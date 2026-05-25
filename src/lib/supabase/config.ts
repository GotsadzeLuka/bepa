const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''
const supabasePublishableKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  ''
export const supabaseStorageBucket =
  process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET ??
  process.env.SUPABASE_STORAGE_BUCKET ??
  'BePa-PublicStorage'
export const oauthNextCookieName = 'bepa_oauth_next'

const hasRealSupabaseUrl =
  supabaseUrl.startsWith('https://') &&
  !supabaseUrl.includes('your-project-ref')

const hasRealSupabaseKey =
  Boolean(supabasePublishableKey) &&
  !supabasePublishableKey.startsWith('your-')

export const hasSupabaseConfig = Boolean(hasRealSupabaseUrl && hasRealSupabaseKey)

function getConfiguredAppUrl() {
  const normalizedAppUrl = appUrl.replace(/^NEXT_PUBLIC_APP_URL=/, '').trim()

  if (normalizedAppUrl.startsWith('https://')) {
    return normalizedAppUrl.replace(/\/$/, '')
  }

  return ''
}

export function getSupabaseClientEnv() {
  if (!hasSupabaseConfig) {
    throw new Error(
      'Missing Supabase client env. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.'
    )
  }

  return {
    supabaseUrl,
    supabasePublishableKey,
  }
}

export function getPublicAppUrl() {
  const configuredAppUrl = getConfiguredAppUrl()
  const isProductionBuild = process.env.NODE_ENV === 'production'

  if (isProductionBuild && configuredAppUrl) {
    return configuredAppUrl
  }

  if (typeof window !== 'undefined') {
    const currentOrigin = window.location.origin
    const currentHostname = window.location.hostname
    const isLocalhost =
      currentHostname === 'localhost' ||
      currentHostname === '127.0.0.1' ||
      currentHostname === '0.0.0.0' ||
      currentHostname === '::1' ||
      currentHostname === '[::1]'

    if (isLocalhost) {
      return currentOrigin
    }

    return configuredAppUrl || currentOrigin
  }

  return configuredAppUrl
}

export function setOAuthNextCookie(next: string) {
  if (typeof document === 'undefined' || typeof window === 'undefined') {
    return
  }

  const safeNext = next.startsWith('/') && !next.startsWith('//') ? next : '/'
  const secure = window.location.protocol === 'https:' ? '; Secure' : ''

  document.cookie = `${oauthNextCookieName}=${encodeURIComponent(safeNext)}; Path=/; Max-Age=600; SameSite=Lax${secure}`
}
