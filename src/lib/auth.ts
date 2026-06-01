/**
 * Secure Authentication Utilities
 * 
 * Handles JWT validation, session management, and user authentication
 * with Supabase Auth. All database operations go through Prisma.
 * 
 * SECURITY FEATURES:
 * - JWT signature verification through Supabase
 * - Session expiry validation
 * - Role-based access control
 * - No raw SQL - all queries through Prisma ORM
 */

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/db'
import { getSupabaseClientEnv } from '@/lib/supabase/config'

// Role type (matches database enum)
export type UserRole = 'user' | 'admin'

// Type for authenticated user
export interface AuthUser {
  id: string
  email: string
  role: UserRole
  fullName: string | null
  phone: string | null
  provider: string | null
  providers: string[]
}

function getStringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === 'string') : []
}

export function hasGoogleAuthProvider(user: Pick<AuthUser, 'provider' | 'providers'>) {
  return user.provider === 'google' || (!user.provider && user.providers.includes('google'))
}

/**
 * Get the current authenticated user from the request.
 * Validates JWT through Supabase and fetches profile from database.
 * 
 * @returns AuthUser or null if not authenticated
 */
export async function getAuthUser(): Promise<AuthUser | null> {
  try {
    const cookieStore = await cookies()
    const { supabaseUrl, supabasePublishableKey } = getSupabaseClientEnv()
    
    // Create Supabase server client with cookies
    const supabase = createServerClient(
      supabaseUrl,
      supabasePublishableKey,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {
              // Ignore - called from Server Component
            }
          },
        },
      }
    )

    // Validate JWT and get user - Supabase verifies signature
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return null
    }

    // Fetch profile from database using Prisma
    const profile = await prisma.profile.findUnique({
      where: { id: user.id }
    })

    return {
      id: user.id,
      email: user.email || '',
      role: (profile?.role as UserRole) || 'user',
      fullName: profile?.fullName || null,
      phone: profile?.phone || null,
      provider: typeof user.app_metadata.provider === 'string' ? user.app_metadata.provider : null,
      providers: getStringArray(user.app_metadata.providers),
    }
  } catch (error) {
    console.error('Auth error:', error)
    return null
  }
}

/**
 * Require authentication - throws if not authenticated.
 * Use in API routes and server actions.
 */
export async function requireAuth(): Promise<AuthUser> {
  const user = await getAuthUser()
  
  if (!user) {
    throw new Error('Not authenticated')
  }
  
  return user
}

/**
 * Require admin role - throws if not admin.
 * Use in admin API routes and server actions.
 */
export async function requireAdmin(): Promise<AuthUser> {
  const user = await requireAuth()
  
  if (user.role !== 'admin') {
    throw new Error('Admin access required')
  }

  if (!hasGoogleAuthProvider(user)) {
    throw new Error('Admin access requires Google OAuth')
  }
  
  return user
}

/**
 * Check if user is authenticated (non-throwing version).
 */
export async function isAuthenticated(): Promise<boolean> {
  const user = await getAuthUser()
  return user !== null
}

/**
 * Check if user is admin (non-throwing version).
 */
export async function isAdmin(): Promise<boolean> {
  const user = await getAuthUser()
  return user !== null && user.role === 'admin' && hasGoogleAuthProvider(user)
}
