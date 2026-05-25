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
    const redirectUrl = new URL('/login', requestUrl.origin)
    redirectUrl.searchParams.set('error', errorDescription ?? 'Authentication failed')
    return redirectClearingOAuthCookie(redirectUrl)
  }

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      const redirectUrl = new URL('/login', requestUrl.origin)
      redirectUrl.searchParams.set('error', error.message)
      return redirectClearingOAuthCookie(redirectUrl)
    }
  }

  return redirectClearingOAuthCookie(new URL(next, requestUrl.origin))
}
