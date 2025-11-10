/**
 * Check Neon Tables
 *
 * Verify what tables and data exist in Neon after migration.
 */

import { neon } from '@neondatabase/serverless'
import * as dotenv from 'dotenv'
import { resolve } from 'path'

dotenv.config({ path: resolve(process.cwd(), '.env.local') })
dotenv.config({ path: resolve(process.cwd(), '.env') })

const DATABASE_URL = process.env.DATABASE_URL

if (!DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set')
}

async function check() {
  console.log('🔍 Checking Neon database...\n')

  const sql = neon(DATABASE_URL)

  try {
    // Check all schemas
    const schemasResult = await (sql as any).unsafe(`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
      ORDER BY schema_name
    `)

    const schemas = Array.isArray(schemasResult) ? schemasResult : [schemasResult]

    console.log('📦 Found schemas:')
    for (const row of schemas) {
      const schemaName = (row as any).schema_name
      console.log(`   - ${schemaName}`)

      // Check tables in each schema
      const tablesResult = await (sql as any).unsafe(`
        SELECT table_name 
        FROM information_schema.tables
        WHERE table_schema = '${schemaName}'
          AND table_type = 'BASE TABLE'
        ORDER BY table_name
      `)

      const tables = Array.isArray(tablesResult) ? tablesResult : tablesResult ? [tablesResult] : []

      if (tables.length > 0) {
        console.log(`     Tables (${tables.length}):`)
        for (const table of tables) {
          const tableName = (table as any).table_name
          const fullName = `"${schemaName}"."${tableName}"`

          // Count rows
          try {
            const countResult = await (sql as any).unsafe(
              `SELECT COUNT(*) as count FROM ${fullName}`
            )
            const count = Array.isArray(countResult) ? countResult[0] : countResult
            const rowCount = Number((count as any)?.count || 0)
            console.log(`       - ${tableName}: ${rowCount} rows`)
          } catch (e: any) {
            console.log(`       - ${tableName}: Error - ${e.message}`)
          }
        }
      }
    }
  } catch (error: any) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

check()
