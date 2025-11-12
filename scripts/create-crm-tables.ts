/**
 * Create CRM Tables in Neon
 *
 * Extracts table definitions from Supabase and creates them in Neon.
 */

import postgres from 'postgres'
import * as dotenv from 'dotenv'
import { resolve } from 'path'

dotenv.config({ path: resolve(process.cwd(), '.env.local') })
dotenv.config({ path: resolve(process.cwd(), '.env') })

const SUPABASE_DATABASE_URL = process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL
const NEON_DATABASE_URL = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL

if (!SUPABASE_DATABASE_URL || !NEON_DATABASE_URL) {
  throw new Error('Database URLs not set')
}

/**
 * Get table definition from Supabase
 */
async function getTableDefinition(
  sourceClient: postgres.Sql,
  schema: string,
  tableName: string
): Promise<string> {
  // Use pg_get_tabledef or construct from information_schema
  const result = await sourceClient.unsafe(`
    SELECT 
      pg_get_tabledef('${schema}.${tableName}'::regclass) as definition
  `)

  return (result[0] as any)?.definition || ''
}

/**
 * Create table in Neon
 */
async function createTable(
  destClient: postgres.Sql,
  schema: string,
  tableName: string,
  definition: string
): Promise<void> {
  try {
    // Clean up the definition - remove schema prefix if present
    let cleanDef = definition
      .replace(/CREATE TABLE\s+(\w+\.)?/gi, 'CREATE TABLE IF NOT EXISTS ')
      .replace(/CREATE\s+TABLE\s+IF\s+NOT\s+EXISTS\s+(\w+\.)?/gi, 'CREATE TABLE IF NOT EXISTS ')

    // Ensure schema is specified
    if (!cleanDef.includes(`${schema}.`)) {
      cleanDef = cleanDef.replace(
        /CREATE TABLE IF NOT EXISTS\s+/i,
        `CREATE TABLE IF NOT EXISTS "${schema}".`
      )
    }

    await destClient.unsafe(cleanDef)
    console.log(`   ✅ Created ${schema}.${tableName}`)
  } catch (error: any) {
    if (error.message.includes('already exists')) {
      console.log(`   ⚠️  ${schema}.${tableName} already exists`)
    } else {
      console.log(`   ❌ Error creating ${schema}.${tableName}: ${error.message.substring(0, 100)}`)
      throw error
    }
  }
}

async function main() {
  console.log('🔨 Creating missing CRM tables in Neon...\n')

  const sourceClient = postgres(SUPABASE_DATABASE_URL, { max: 1, prepare: false })
  const destClient = postgres(NEON_DATABASE_URL, { max: 1, prepare: true })

  try {
    await sourceClient`SELECT 1`
    await destClient`SELECT 1`
    console.log('✅ Both connections successful\n')

    // Get all CRM tables from Supabase
    const crmTables = await sourceClient`
      SELECT table_name 
      FROM information_schema.tables
      WHERE table_schema = 'crm'
        AND table_type = 'BASE TABLE'
        AND table_name NOT LIKE 'pg_%'
      ORDER BY table_name
    `

    console.log(`Found ${crmTables.length} CRM tables in Supabase\n`)

    // Create each table
    for (const table of crmTables) {
      const tableName = table.table_name as string
      console.log(`📋 Processing crm.${tableName}...`)

      try {
        const definition = await getTableDefinition(sourceClient, 'crm', tableName)

        if (!definition) {
          console.log(`   ⚠️  Could not get definition, trying alternative method...`)

          // Alternative: Build definition from information_schema
          const columns = await sourceClient`
            SELECT 
              column_name,
              data_type,
              character_maximum_length,
              numeric_precision,
              numeric_scale,
              is_nullable,
              column_default
            FROM information_schema.columns
            WHERE table_schema = 'crm' AND table_name = ${tableName}
            ORDER BY ordinal_position
          `

          // This is a fallback - we'll use the pg_get_tabledef method primarily
          console.log(`   ⚠️  Skipping (need manual definition)`)
          continue
        }

        await createTable(destClient, 'crm', tableName, definition)
      } catch (error: any) {
        console.log(`   ❌ Error: ${error.message.substring(0, 150)}`)
      }
    }

    console.log('\n✅ CRM table creation complete!')
    console.log('\n💡 Next: Run data migration')
  } catch (error: any) {
    console.error('\n❌ Failed:', error.message)
    process.exit(1)
  } finally {
    await sourceClient.end()
    await destClient.end()
  }
}

main()







