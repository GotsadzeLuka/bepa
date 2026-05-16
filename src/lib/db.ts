/**
 * Prisma Database Client
 * 
 * Prisma 7 requires an adapter for the client engine.
 * Using @prisma/adapter-pg for PostgreSQL/Supabase.
 */

import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

// Create connection pool
const connectionString = process.env.DATABASE_URL

// Create pg connection pool
const pool = new Pool({ connectionString })

// Create Prisma adapter
const adapter = new PrismaPg(pool)

// Add prisma to global type for development hot-reload
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Create Prisma client with adapter
export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  adapter,
  log: process.env.NODE_ENV === 'development' 
    ? ['query', 'error', 'warn'] 
    : ['error'],
})

// Prevent multiple instances in development
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

// Export for convenience
export default prisma
