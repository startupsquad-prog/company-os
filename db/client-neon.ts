/**
 * Neon Database Client
 *
 * This is the new database client using Neon HTTP driver.
 * After migration, this will replace db/client.ts
 */

import { drizzle } from 'drizzle-orm/neon-http'
import { neon, neonConfig } from '@neondatabase/serverless'
import * as schema from './schema'

// Configure Neon for better performance
neonConfig.fetchConnectionCache = true

// Lazy-load connection to avoid issues when env vars aren't loaded yet
let _sql: ReturnType<typeof neon> | null = null
let _db: ReturnType<typeof drizzle> | null = null

function getSql() {
  if (!_sql) {
    const databaseUrl = process.env.DATABASE_URL

    if (!databaseUrl) {
      throw new Error('DATABASE_URL environment variable is not set')
    }

    // Create Neon HTTP connection
    // Neon uses HTTP for serverless environments (Vercel, etc.)
    _sql = neon(databaseUrl)
  }
  return _sql
}

function getDb() {
  if (!_db) {
    _db = drizzle(getSql(), { schema })
  }
  return _db
}

// Export lazy-loaded instances
export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get(_, prop) {
    return getDb()[prop as keyof ReturnType<typeof drizzle>]
  },
})

// Export SQL client for raw queries
export const sql = new Proxy({} as ReturnType<typeof neon>, {
  get(_, prop) {
    return getSql()[prop as keyof ReturnType<typeof neon>]
  },
})

// Export schema for use in queries
export { schema }

