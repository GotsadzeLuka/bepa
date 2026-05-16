const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const supabasePublishableKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  ''

export const hasSupabaseConfig = Boolean(supabaseUrl && supabasePublishableKey)

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
