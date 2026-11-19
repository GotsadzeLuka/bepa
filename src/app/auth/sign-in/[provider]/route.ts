import { getSafeRedirect } from '@/lib/safe-redirect'
import { createServerClient } from '@supabase/ssr'
import type { CookieOptions } from '@supabase/ssr'
import type { Provider } from '@supabase/supabase-js'
import { NextResponse, type NextRequest } from 'next/server'
import {
  getPublicAppUrl,
  getSupabaseClientEnv,
  oauthNextCookieName,
} from '@/lib/supabase/config'

const allowedProviders = new Set<Provider>(['google'])

type RouteContext = {
  params: Promise<{ provider: string }> | { provider: string }
}

type CookieToSet = {
  name: string
  value: string
  options: CookieOptions
}


function getOAuthOrigin(request: NextRequest) {
  return getPublicAppUrl() || request.nextUrl.origin
}

function getErrorRedirect(request: NextRequest, message: string) {
  const redirectUrl = new URL('/login', request.url)
  redirectUrl.searchParams.set('error', message)
  return NextResponse.redirect(redirectUrl)
}

export async function GET(request: NextRequest, context: RouteContext) {
  const { provider } = await context.params

  if (!allowedProviders.has(provider as Provider)) {
    return getErrorRedirect(request, 'Unsupported OAuth provider.')
  }

  const next = getSafeRedirect(request.nextUrl.searchParams.get('next'))
  const oauthOrigin = getOAuthOrigin(request)
  const callbackUrl = new URL('/auth/callback', oauthOrigin)
  const { supabaseUrl, supabasePublishableKey } = getSupabaseClientEnv()
  const cookiesToSet: CookieToSet[] = []

  const supabase = createServerClient(
    supabaseUrl,
    supabasePublishableKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(nextCookies) {
          cookiesToSet.push(...nextCookies)
        },
      },
    }
  )

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: provider as Provider,
    options: {
      redirectTo: callbackUrl.toString(),
    },
  })

  if (error || !data.url) {
    return getErrorRedirect(request, error?.message ?? 'Unable to start OAuth login.')
  }

  const response = NextResponse.redirect(data.url)

  cookiesToSet.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, options)
  })

  response.cookies.set(oauthNextCookieName, next, {
    httpOnly: true,
    maxAge: 600,
    path: '/',
    sameSite: 'lax',
    secure: callbackUrl.protocol === 'https:',
  })

  return response
}
