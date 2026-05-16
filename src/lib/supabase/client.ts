import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'
import { getSupabaseClientEnv } from './config'

export function createClient() {
  const { supabaseUrl, supabasePublishableKey } = getSupabaseClientEnv()

  return createBrowserClient<Database>(
    supabaseUrl,
    supabasePublishableKey
  )
}
