'use server'

import { cookies } from 'next/headers'

const supportedLocales = new Set(['en', 'ka'])

export async function setLocaleCookie(locale: string) {
  if (!supportedLocales.has(locale)) {
    throw new Error('Unsupported locale')
  }

  const cookieStore = await cookies()
  cookieStore.set('locale', locale, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
  })
}
