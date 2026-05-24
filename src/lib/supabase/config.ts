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

const hasRealSupabaseUrl =
  supabaseUrl.startsWith('https://') &&
  !supabaseUrl.includes('your-project-ref')

const hasRealSupabaseKey =
  Boolean(supabasePublishableKey) &&
  !supabasePublishableKey.startsWith('your-')

export const hasSupabaseConfig = Boolean(hasRealSupabaseUrl && hasRealSupabaseKey)

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
  if (typeof window !== 'undefined') {
    return window.location.origin
  }

  if (appUrl.startsWith('https://')) {
    return appUrl.replace(/\/$/, '')
  }

  return ''
}
