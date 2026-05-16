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

// Role type (matches database enum)
export type UserRole = 'user' | 'admin'

// Type for authenticated user
export interface AuthUser {
  id: string
  email: string
  role: UserRole
  fullName: string | null
  phone: string | null
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
    
    // Create Supabase server client with cookies
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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
  return user !== null && user.role === 'admin'
}
