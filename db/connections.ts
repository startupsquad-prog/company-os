/**
 * Database Connections
 * 
 * Provides Drizzle ORM instances for different access levels.
 * 
 * - dbAdmin: Service-role access (server-side only, bypasses RLS)
 *   Use for admin operations, migrations, and background jobs.
 * 
 * - dbRls: JWT-bound access (respects RLS policies)
 *   TODO: Implement when needed for user-scoped queries
 */

import { drizzle } from 'drizzle-orm/postgres-js'
// @ts-ignore - postgres uses export= syntax, works with esModuleInterop
import postgres from 'postgres'
import * as schema from './schema'

// Service-role database connection (bypasses RLS)
// WARNING: Only use in server-side code (API routes, Server Actions, background jobs)
// Never expose this to client-side code
// Create postgres client with proper configuration
const postgresClient = postgres(process.env.DATABASE_URL!, {
  max: 1, // Connection pool size
  prepare: false, // Disable prepared statements for better compatibility with Supabase
})

// Export postgres client for raw queries when needed
export const postgresClientRaw = postgresClient

export const dbAdmin = drizzle(postgresClient, { schema })

// TODO: Implement dbRls for JWT-bound queries that respect RLS policies
// This will be used for user-scoped queries where RLS should be enforced
// export const dbRls = drizzle(...)

