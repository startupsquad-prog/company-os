/**
 * Check which tables exist in Neon
 */

import postgres from 'postgres'
import * as dotenv from 'dotenv'
import { resolve } from 'path'

dotenv.config({ path: resolve(process.cwd(), '.env.local') })
dotenv.config({ path: resolve(process.cwd(), '.env') })

const NEON_DATABASE_URL = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL

if (!NEON_DATABASE_URL) {
  throw new Error('DATABASE_URL or DATABASE_URL_UNPOOLED environment variable is not set')
}

async function checkTables() {
  const client = postgres(NEON_DATABASE_URL, { max: 1, prepare: true })

  try {
    const schemas = ['core', 'crm', 'ats', 'ops', 'import_ops', 'common_util']

    for (const schema of schemas) {
      const tables = await client`
        SELECT table_name 
        FROM information_schema.tables
        WHERE table_schema = ${schema}
          AND table_type = 'BASE TABLE'
          AND table_name NOT LIKE 'pg_%'
          AND table_name NOT LIKE '_drizzle_%'
        ORDER BY table_name
      `

      if (tables.length > 0) {
        console.log(`\n📋 ${schema} schema (${tables.length} tables):`)
        for (const table of tables) {
          console.log(`   - ${table.table_name}`)
        }
      } else {
        console.log(`\n⚠️  ${schema} schema: No tables found`)
      }
    }
  } finally {
    await client.end()
  }
}

checkTables()





