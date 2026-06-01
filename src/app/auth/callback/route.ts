import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { oauthNextCookieName } from '@/lib/supabase/config'

function getSafeRedirect(next: string | null) {
  if (next?.startsWith('/') && !next.startsWith('//')) {
    return next
  }

  return '/'
}

function getCookieRedirect(request: NextRequest) {
  const next = request.cookies.get(oauthNextCookieName)?.value

  if (!next) {
    return null
  }

  try {
    return decodeURIComponent(next)
  } catch {
    return next
  }
}

function isAdminRedirect(next: string) {
  return next === '/admin' || next.startsWith('/admin/')
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

function getAuthFailureRedirect(requestUrl: URL, next: string, message: string) {
  const redirectUrl = new URL(isAdminRedirect(next) ? '/admin/login' : '/login', requestUrl.origin)
  redirectUrl.searchParams.set('error', message)
  return redirectUrl
}

function redirectClearingOAuthCookie(url: URL) {
  const response = NextResponse.redirect(url)
  response.cookies.set(oauthNextCookieName, '', {
    maxAge: 0,
    path: '/',
  })
  return response
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = getSafeRedirect(requestUrl.searchParams.get('next') ?? getCookieRedirect(request))
  const errorCode = requestUrl.searchParams.get('error_code')
  const errorDescription = requestUrl.searchParams.get('error_description')

  if (errorCode || errorDescription) {
    return redirectClearingOAuthCookie(
      getAuthFailureRedirect(requestUrl, next, errorDescription ?? 'Authentication failed')
    )
  }

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      return redirectClearingOAuthCookie(getAuthFailureRedirect(requestUrl, next, error.message))
    }

    if (isAdminRedirect(next)) {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user || !hasGoogleAuthProvider(user)) {
        await supabase.auth.signOut()
        return redirectClearingOAuthCookie(
          getAuthFailureRedirect(requestUrl, next, 'Admin access requires Google OAuth.')
        )
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profile?.role !== 'admin') {
        await supabase.auth.signOut()
        return redirectClearingOAuthCookie(
          getAuthFailureRedirect(requestUrl, next, 'Admin privileges are required.')
        )
      }
    }
  }

  return redirectClearingOAuthCookie(new URL(next, requestUrl.origin))
}
