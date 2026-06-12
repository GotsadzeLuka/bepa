import { createServerClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database, UserRole } from '@/types/database'
import { getSupabaseClientEnv, hasSupabaseConfig } from '@/lib/supabase/config'

const PUBLIC_ROUTE_CACHE_SECONDS = 300
const PUBLIC_ROUTE_STALE_SECONDS = 86400
const ADMIN_ROLE_CACHE_SECONDS = 60
const publicCacheableRoutes = ['/', '/products', '/product', '/news', '/contact']
const privateRoutePrefixes = ['/admin', '/account', '/wishlist', '/cart', '/checkout', '/login', '/register', '/auth']
const adminRoleCache = new Map<string, { role: UserRole | null; expiresAt: number }>()

// Routes whose middleware behavior depends on auth state. Everything else
// skips the Supabase session lookup entirely, so public route hits stay
// network-free.
const authSensitiveRoutePrefixes = ['/admin', '/account', '/wishlist', '/orders', '/login', '/register']

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
  // geolocation=(self) allows the checkout "Use my current location" button
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(self), payment=(), usb=(), browsing-topics=()'
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

function isAuthSensitiveRequest(pathname: string) {
  return authSensitiveRoutePrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  )
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

async function getCachedProfileRole(supabase: SupabaseClient<Database>, userId: string) {
  const now = Date.now()
  const cached = adminRoleCache.get(userId)

  if (cached && cached.expiresAt > now) {
    return cached.role
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single()

  const role = profile?.role ?? null
  adminRoleCache.set(userId, {
    role,
    expiresAt: now + ADMIN_ROLE_CACHE_SECONDS * 1000,
  })

  return role
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

  // Public storefront routes render no server-side auth state, so skip the
  // Supabase round-trip entirely. The browser client keeps its own session
  // fresh, and protected routes below still refresh cookies server-side.
  if (!isAuthSensitiveRequest(pathname)) {
    return withRouteHeaders(request, supabaseResponse)
  }

  const { supabaseUrl, supabasePublishableKey } = getSupabaseClientEnv()

  const supabase = createServerClient<Database>(
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

  // getClaims() verifies the JWT locally when the project uses asymmetric
  // keys (refreshing expired sessions through the cookie adapter), which is
  // far cheaper than a getUser() network round-trip on every protected hit.
  const { data: claimsData } = await supabase.auth.getClaims()
  const claims = claimsData?.claims
  const user = claims?.sub
    ? {
        id: claims.sub,
        app_metadata: (claims.app_metadata ?? {}) as Record<string, unknown>,
      }
    : null

  // Admin routes protection
  if (pathname.startsWith('/admin')) {
    // Allow access to admin login page
    if (pathname === '/admin/login') {
      if (user && hasGoogleAuthProvider(user)) {
        const role = await getCachedProfileRole(supabase, user.id)

        if (role === 'admin') {
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

    const role = await getCachedProfileRole(supabase, user.id)

    if (role !== 'admin') {
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
      const role = await getCachedProfileRole(supabase, user.id)

      if (role === 'admin') {
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
