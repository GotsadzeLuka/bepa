import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { getSupabaseClientEnv, hasSupabaseConfig } from '@/lib/supabase/config'

const PUBLIC_ROUTE_CACHE_SECONDS = 300
const PUBLIC_ROUTE_STALE_SECONDS = 86400
const publicCacheableRoutes = ['/', '/products', '/product', '/news', '/contact']
const privateRoutePrefixes = ['/admin', '/account', '/wishlist', '/cart', '/checkout', '/login', '/register', '/auth']

function getSupabaseOrigin() {
  if (!hasSupabaseConfig) return ''

  try {
    return new URL(getSupabaseClientEnv().supabaseUrl).origin
  } catch {
    return ''
  }
}

function withSecurityHeaders(response: NextResponse) {
  const supabaseOrigin = getSupabaseOrigin()
  const isDevelopment = process.env.NODE_ENV === 'development'
  const scriptSrc = isDevelopment
    ? "'self' 'unsafe-inline' 'unsafe-eval'"
    : "'self' 'unsafe-inline'"
  const connectSrc = [
    "'self'",
    supabaseOrigin,
    isDevelopment ? 'ws:' : '',
    isDevelopment ? 'wss:' : '',
  ].filter(Boolean).join(' ')
  const imgSrc = ["'self'", 'data:', 'blob:', supabaseOrigin].filter(Boolean).join(' ')

  response.headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      `script-src ${scriptSrc}`,
      "style-src 'self' 'unsafe-inline'",
      `img-src ${imgSrc}`,
      "font-src 'self' data:",
      `connect-src ${connectSrc}`,
      "object-src 'none'",
      "base-uri 'self'",
      "frame-ancestors 'none'",
      "form-action 'self'",
      isDevelopment ? '' : 'upgrade-insecure-requests',
    ].filter(Boolean).join('; ')
  )
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()'
  )

  return response
}

function appendVary(response: NextResponse, values: string[]) {
  const existing = response.headers.get('Vary')
  const vary = new Set(
    existing
      ?.split(',')
      .map((entry) => entry.trim())
      .filter(Boolean) ?? []
  )

  for (const value of values) {
    vary.add(value)
  }

  response.headers.set('Vary', Array.from(vary).join(', '))
}

function isPublicCacheableRequest(request: NextRequest) {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return false
  }

  const { pathname } = request.nextUrl
  if (privateRoutePrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) {
    return false
  }

  return publicCacheableRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`))
}

function withRouteHeaders(request: NextRequest, response: NextResponse) {
  withSecurityHeaders(response)

  if (response.status >= 200 && response.status < 300 && isPublicCacheableRequest(request)) {
    response.headers.set(
      'Cache-Control',
      `public, s-maxage=${PUBLIC_ROUTE_CACHE_SECONDS}, stale-while-revalidate=${PUBLIC_ROUTE_STALE_SECONDS}`
    )
    appendVary(response, ['Cookie', 'Accept-Language'])
    return response
  }

  response.headers.set('Cache-Control', 'private, no-store, max-age=0, must-revalidate')
  return response
}

function hasGoogleAuthProvider(user: { app_metadata?: Record<string, unknown> } | null) {
  const metadata = user?.app_metadata ?? {}
  const provider = metadata.provider
  const providers = metadata.providers

  return (
    provider === 'google' ||
    (!provider && Array.isArray(providers) && providers.includes('google'))
  )
}

function adminLoginRedirect(request: NextRequest, message?: string) {
  const redirectUrl = new URL('/admin/login', request.url)
  if (message) {
    redirectUrl.searchParams.set('error', message)
  }
  return NextResponse.redirect(redirectUrl)
}

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  if (!hasSupabaseConfig) {
    return withRouteHeaders(request, supabaseResponse)
  }

  const { pathname, searchParams } = request.nextUrl
  const hasOAuthCode = searchParams.has('code')
  const authError =
    searchParams.get('error_description') ??
    searchParams.get('error')

  if (hasOAuthCode && pathname !== '/auth/callback') {
    const redirectUrl = new URL('/auth/callback', request.url)
    redirectUrl.search = request.nextUrl.search
    return withRouteHeaders(request, NextResponse.redirect(redirectUrl))
  }

  if (authError && pathname !== '/login' && pathname !== '/admin/login') {
    const redirectPath = pathname.startsWith('/admin') ? '/admin/login' : '/login'
    const redirectUrl = new URL(redirectPath, request.url)
    redirectUrl.searchParams.set('error', authError)
    return withRouteHeaders(request, NextResponse.redirect(redirectUrl))
  }

  const { supabaseUrl, supabasePublishableKey } = getSupabaseClientEnv()

  const supabase = createServerClient(
    supabaseUrl,
    supabasePublishableKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Admin routes protection
  if (pathname.startsWith('/admin')) {
    // Allow access to admin login page
    if (pathname === '/admin/login') {
      if (user && hasGoogleAuthProvider(user)) {
        // Check if user is admin
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()

        if (profile?.role === 'admin') {
          return withRouteHeaders(request, NextResponse.redirect(new URL('/admin', request.url)))
        }
      }
      return withRouteHeaders(request, supabaseResponse)
    }

    // Protect all other admin routes
    if (!user) {
      return withRouteHeaders(request, NextResponse.redirect(new URL('/admin/login', request.url)))
    }

    if (!hasGoogleAuthProvider(user)) {
      return withRouteHeaders(request, adminLoginRedirect(request, 'Admin access requires Google OAuth.'))
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return withRouteHeaders(request, NextResponse.redirect(new URL('/', request.url)))
    }
  }

  // User protected routes
  const protectedUserRoutes = ['/account', '/wishlist', '/orders']
  if (protectedUserRoutes.some(route => pathname.startsWith(route))) {
    if (!user) {
      const redirectUrl = new URL('/login', request.url)
      redirectUrl.searchParams.set('redirect', pathname)
      return withRouteHeaders(request, NextResponse.redirect(redirectUrl))
    }
  }

  // Redirect logged in users from auth pages
  if (pathname === '/login' || pathname === '/register') {
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profile?.role === 'admin') {
        return withRouteHeaders(request, NextResponse.redirect(new URL('/admin', request.url)))
      }
      return withRouteHeaders(request, NextResponse.redirect(new URL('/', request.url)))
    }
  }

  return withRouteHeaders(request, supabaseResponse)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
