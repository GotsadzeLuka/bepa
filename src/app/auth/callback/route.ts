import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

function getSafeRedirect(next: string | null) {
  if (next?.startsWith('/') && !next.startsWith('//')) {
    return next
  }

  return '/'
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = getSafeRedirect(requestUrl.searchParams.get('next'))
  const errorCode = requestUrl.searchParams.get('error_code')
  const errorDescription = requestUrl.searchParams.get('error_description')

  if (errorCode || errorDescription) {
    const redirectUrl = new URL('/login', requestUrl.origin)
    redirectUrl.searchParams.set('error', errorDescription ?? 'Authentication failed')
    return NextResponse.redirect(redirectUrl)
  }

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      const redirectUrl = new URL('/login', requestUrl.origin)
      redirectUrl.searchParams.set('error', error.message)
      return NextResponse.redirect(redirectUrl)
    }
  }

  return NextResponse.redirect(new URL(next, requestUrl.origin))
}
