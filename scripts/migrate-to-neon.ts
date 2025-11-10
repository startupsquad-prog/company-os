/**
 * Migration Script: Supabase to Neon
 *
 * This script copies all data from Supabase to Neon database.
 *
 * Prerequisites:
 * 1. Set SUPABASE_DATABASE_URL in .env.local (your current Supabase connection)
 * 2. Set NEON_DATABASE_URL in .env.local (your new Neon connection)
 *
 * Usage:
 *   npm run migrate:to-neon
 *   or
 *   tsx scripts/migrate-to-neon.ts
 */

import postgres from 'postgres'
import { drizzle } from 'drizzle-orm/postgres-js'
import { neon, neonConfig } from '@neondatabase/serverless'
import { drizzle as drizzleNeon } from 'drizzle-orm/neon-http'
import * as dotenv from 'dotenv'
import { resolve } from 'path'

// Load environment variables
dotenv.config({ path: resolve(process.cwd(), '.env.local') })
dotenv.config({ path: resolve(process.cwd(), '.env') })

const SUPABASE_DATABASE_URL = process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL
const NEON_DATABASE_URL = process.env.NEON_DATABASE_URL || process.env.DATABASE_URL

if (!SUPABASE_DATABASE_URL) {
  throw new Error('SUPABASE_DATABASE_URL or DATABASE_URL environment variable is not set')
}

if (!NEON_DATABASE_URL) {
  throw new Error('NEON_DATABASE_URL environment variable is not set')
}

// Configure Neon for better performance
neonConfig.fetchConnectionCache = true

interface MigrationStats {
  tables: number
  rows: number
  errors: string[]
  warnings: string[]
}

/**
 * Get all table names from a schema
 */
async function getTables(sourceClient: postgres.Sql, schemas: string[]): Promise<string[]> {
  const tables: string[] = []

  for (const schema of schemas) {
    const result = await sourceClient`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = ${schema}
        AND table_type = 'BASE TABLE'
        AND table_name NOT LIKE 'pg_%'
        AND table_name NOT LIKE '_drizzle_%'
      ORDER BY table_name
    `

    for (const row of result) {
      tables.push(`${schema}.${row.table_name}`)
    }
  }

  return tables
}

/**
 * Get table structure (columns)
 */
async function getTableStructure(
  sourceClient: postgres.Sql,
  schema: string,
  tableName: string
): Promise<Array<{ column_name: string; data_type: string; is_nullable: string }>> {
  const result = await sourceClient`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_schema = ${schema}
      AND table_name = ${tableName}
    ORDER BY ordinal_position
  `

  return result as Array<{ column_name: string; data_type: string; is_nullable: string }>
}

/**
 * Copy a single table from source to destination
 */
async function copyTable(
  sourceClient: postgres.Sql,
  destSql: ReturnType<typeof neon>,
  schema: string,
  tableName: string,
  stats: MigrationStats
): Promise<void> {
  const fullTableName = `${schema}.${tableName}`
  console.log(`  📋 Copying ${fullTableName}...`)

  try {
    // Get table structure
    const columns = await getTableStructure(sourceClient, schema, tableName)
    const columnNames = columns.map((c) => c.column_name)

    // Get row count
    const countResult = await sourceClient.unsafe(`
      SELECT COUNT(*) as count FROM "${schema}"."${tableName}"
    `)
    const rowCount = Number(countResult[0]?.count || 0)

    if (rowCount === 0) {
      console.log(`    ⚠️  Table is empty, skipping data copy`)
      stats.warnings.push(`${fullTableName}: Table is empty`)
      return
    }

    console.log(`    📊 Found ${rowCount} rows`)

    // Fetch data in batches
    const batchSize = 1000
    let offset = 0
    let totalCopied = 0

    while (offset < rowCount) {
      const batch = await sourceClient.unsafe(`
        SELECT * FROM "${schema}"."${tableName}"
        ORDER BY (SELECT NULL)
        LIMIT ${batchSize} OFFSET ${offset}
      `)

      if (batch.length === 0) break

      // Use unsafe method for raw SQL with proper escaping
      const columnsStr = columnNames.map((c) => `"${c}"`).join(', ')

      // Insert rows with proper SQL escaping
      for (const row of batch) {
        const values = columnNames.map((col) => {
          const val = row[col]
          // Properly escape SQL values
          if (val === null || val === undefined) return 'NULL'
          if (val instanceof Date) return `'${val.toISOString()}'`
          if (typeof val === 'boolean') return val ? 'true' : 'false'
          if (typeof val === 'number') return String(val)
          if (typeof val === 'object') {
            // JSON objects
            return `'${JSON.stringify(val).replace(/'/g, "''")}'::jsonb`
          }
          // Strings - escape single quotes
          return `'${String(val).replace(/'/g, "''")}'`
        })

        const valuesStr = values.join(', ')
        const insertQuery = `INSERT INTO "${schema}"."${tableName}" (${columnsStr}) VALUES (${valuesStr}) ON CONFLICT DO NOTHING`

        // Use unsafe for raw SQL queries
        await (destSql as any).unsafe(insertQuery)
      }

      totalCopied += batch.length
      offset += batchSize

      process.stdout.write(`    ⏳ Progress: ${totalCopied}/${rowCount} rows\r`)
    }

    console.log(`\n    ✅ Copied ${totalCopied} rows`)
    stats.rows += totalCopied
  } catch (error: any) {
    const errorMsg = `Failed to copy ${fullTableName}: ${error.message}`
    console.error(`    ❌ ${errorMsg}`)
    stats.errors.push(errorMsg)
  }
}

/**
 * Ensure schema exists in destination
 */
async function ensureSchema(destSql: ReturnType<typeof neon>, schemaName: string): Promise<void> {
  try {
    // Use unsafe for DDL statements
    await (destSql as any).unsafe(`CREATE SCHEMA IF NOT EXISTS "${schemaName}"`)
  } catch (error: any) {
    console.warn(`  ⚠️  Could not create schema ${schemaName}: ${error.message}`)
  }
}

/**
 * Main migration function
 */
async function migrate(): Promise<void> {
  console.log('🚀 Starting Supabase to Neon migration...\n')

  // Connect to source (Supabase)
  console.log('📡 Connecting to Supabase...')
  const sourceClient = postgres(SUPABASE_DATABASE_URL, {
    max: 1,
    prepare: false,
  })

  // Connect to destination (Neon)
  console.log('📡 Connecting to Neon...')
  const destSql = neon(NEON_DATABASE_URL)

  const stats: MigrationStats = {
    tables: 0,
    rows: 0,
    errors: [],
    warnings: [],
  }

  try {
    // Test connections
    await sourceClient`SELECT 1`
    await destSql`SELECT 1`
    console.log('✅ Both connections successful\n')

    // Get all schemas to migrate
    const schemasToMigrate = ['core', 'crm', 'ats', 'ops', 'import_ops', 'common_util', 'public']

    // Ensure all schemas exist in destination
    console.log('📦 Creating schemas in Neon...')
    for (const schema of schemasToMigrate) {
      await ensureSchema(destSql, schema)
    }
    console.log('✅ Schemas created\n')

    // Get all tables
    console.log('🔍 Discovering tables...')
    const tables = await getTables(sourceClient, schemasToMigrate)
    console.log(`✅ Found ${tables.length} tables to migrate\n`)

    // Copy each table
    console.log('📥 Starting data migration...\n')
    for (const fullTableName of tables) {
      const [schema, tableName] = fullTableName.split('.')
      await copyTable(sourceClient, destSql, schema, tableName, stats)
      stats.tables++
    }

    // Print summary
    console.log('\n' + '='.repeat(60))
    console.log('📊 Migration Summary')
    console.log('='.repeat(60))
    console.log(`✅ Tables migrated: ${stats.tables}`)
    console.log(`✅ Rows copied: ${stats.rows.toLocaleString()}`)

    if (stats.warnings.length > 0) {
      console.log(`\n⚠️  Warnings (${stats.warnings.length}):`)
      stats.warnings.forEach((w) => console.log(`   - ${w}`))
    }

    if (stats.errors.length > 0) {
      console.log(`\n❌ Errors (${stats.errors.length}):`)
      stats.errors.forEach((e) => console.log(`   - ${e}`))
      console.log('\n⚠️  Migration completed with errors. Please review and fix.')
      process.exit(1)
    } else {
      console.log('\n✅ Migration completed successfully!')
    }
  } catch (error: any) {
    console.error('\n❌ Migration failed:', error.message)
    console.error(error.stack)
    process.exit(1)
  } finally {
    await sourceClient.end()
  }
}

// Run migration
migrate().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})
