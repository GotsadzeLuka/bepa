import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { getSupabaseClientEnv, hasSupabaseConfig } from '@/lib/supabase/config'

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

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  if (!hasSupabaseConfig) {
    return withSecurityHeaders(supabaseResponse)
  }

  const { pathname, searchParams } = request.nextUrl
  const hasOAuthCode = searchParams.has('code')
  const authError =
    searchParams.get('error_description') ??
    searchParams.get('error')

  if (hasOAuthCode && pathname !== '/auth/callback') {
    const redirectUrl = new URL('/auth/callback', request.url)
    redirectUrl.search = request.nextUrl.search
    return withSecurityHeaders(NextResponse.redirect(redirectUrl))
  }

  if (authError && pathname !== '/login') {
    const redirectUrl = new URL('/login', request.url)
    redirectUrl.searchParams.set('error', authError)
    return withSecurityHeaders(NextResponse.redirect(redirectUrl))
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
          supabaseResponse = NextResponse.next({
            request,
          })
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
      if (user) {
        // Check if user is admin
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()

        if (profile?.role === 'admin') {
          return withSecurityHeaders(NextResponse.redirect(new URL('/admin', request.url)))
        }
      }
      return withSecurityHeaders(supabaseResponse)
    }

    // Protect all other admin routes
    if (!user) {
      return withSecurityHeaders(NextResponse.redirect(new URL('/admin/login', request.url)))
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return withSecurityHeaders(NextResponse.redirect(new URL('/', request.url)))
    }
  }

  // User protected routes
  const protectedUserRoutes = ['/account', '/wishlist', '/orders']
  if (protectedUserRoutes.some(route => pathname.startsWith(route))) {
    if (!user) {
      const redirectUrl = new URL('/login', request.url)
      redirectUrl.searchParams.set('redirect', pathname)
      return withSecurityHeaders(NextResponse.redirect(redirectUrl))
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
        return withSecurityHeaders(NextResponse.redirect(new URL('/admin', request.url)))
      }
      return withSecurityHeaders(NextResponse.redirect(new URL('/', request.url)))
    }
  }

  return withSecurityHeaders(supabaseResponse)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
