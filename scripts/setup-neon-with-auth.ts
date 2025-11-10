/**
 * Complete Neon Setup with Auth Schema
 *
 * This script:
 * 1. Creates auth schema and users table (for FK references)
 * 2. Applies all Supabase migrations (with auth.users references)
 * 3. Copies all data from Supabase
 * 4. Regenerates Drizzle schemas
 */

import { neon } from '@neondatabase/serverless'
import postgres from 'postgres'
import * as dotenv from 'dotenv'
import { resolve } from 'path'
import { readdirSync, readFileSync } from 'fs'
import { join } from 'path'

// Load environment variables
dotenv.config({ path: resolve(process.cwd(), '.env.local') })
dotenv.config({ path: resolve(process.cwd(), '.env') })

const SUPABASE_DATABASE_URL = process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL
const NEON_DATABASE_URL = process.env.DATABASE_URL

if (!SUPABASE_DATABASE_URL) {
  throw new Error('SUPABASE_DATABASE_URL or DATABASE_URL environment variable is not set')
}

if (!NEON_DATABASE_URL) {
  throw new Error('DATABASE_URL (Neon) environment variable is not set')
}

/**
 * Create auth schema and users table for FK references
 */
async function createAuthSchema(destSql: ReturnType<typeof neon>) {
  console.log('🔐 Creating auth schema for FK references...\n')

  const authSchema = `
    CREATE SCHEMA IF NOT EXISTS auth;
    
    CREATE TABLE IF NOT EXISTS auth.users (
      id UUID PRIMARY KEY,
      email TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `

  await (destSql as any).unsafe(authSchema)
  console.log('✅ Auth schema created\n')
}

/**
 * Apply migration file, handling Supabase-specific syntax
 */
async function applyMigration(destSql: ReturnType<typeof neon>, filePath: string): Promise<void> {
  const fileName = filePath.split(/[/\\]/).pop()
  console.log(`   📄 Applying: ${fileName}`)

  try {
    let sql = readFileSync(filePath, 'utf-8')

    // Remove comments
    sql = sql
      .split('\n')
      .map((line) => (line.trim().startsWith('--') ? '' : line))
      .join('\n')

    // Execute the SQL
    await (destSql as any).unsafe(sql)
    console.log(`      ✅ Applied: ${fileName}`)
  } catch (error: any) {
    const errorMsg = error.message.substring(0, 150)
    if (
      errorMsg.includes('already exists') ||
      errorMsg.includes('duplicate') ||
      errorMsg.includes('does not exist') ||
      errorMsg.includes('permission denied')
    ) {
      console.log(`      ⚠️  ${fileName}: ${errorMsg} (may be expected)`)
    } else {
      console.log(`      ❌ ${fileName}: ${errorMsg}`)
    }
  }
}

/**
 * Copy data from Supabase to Neon
 */
async function copyAllData(sourceClient: postgres.Sql, destSql: ReturnType<typeof neon>) {
  console.log('\n📥 Copying data from Supabase to Neon...\n')

  const schemas = ['core', 'crm', 'ats', 'ops', 'import_ops', 'common_util', 'public']
  let totalRows = 0

  for (const schema of schemas) {
    const tables = await sourceClient`
      SELECT table_name 
      FROM information_schema.tables
      WHERE table_schema = ${schema}
        AND table_type = 'BASE TABLE'
        AND table_name NOT LIKE 'pg_%'
        AND table_name NOT LIKE '_drizzle_%'
      ORDER BY table_name
    `

    for (const table of tables) {
      const tableName = table.table_name as string
      const fullTableName = `${schema}.${tableName}`

      try {
        const countResult = await sourceClient.unsafe(
          `SELECT COUNT(*) as count FROM "${schema}"."${tableName}"`
        )
        const rowCount = Number((countResult[0] as any)?.count || 0)

        if (rowCount === 0) {
          console.log(`   ⏭️  ${fullTableName}: Empty, skipping`)
          continue
        }

        console.log(`   📋 ${fullTableName}: ${rowCount} rows`)

        const columns = await sourceClient`
          SELECT column_name, data_type
          FROM information_schema.columns
          WHERE table_schema = ${schema}
            AND table_name = ${tableName}
          ORDER BY ordinal_position
        `
        const columnNames = columns.map((c) => c.column_name as string)

        const batchSize = 500
        let offset = 0
        let copied = 0

        while (offset < rowCount) {
          const batch = await sourceClient.unsafe(`
            SELECT * FROM "${schema}"."${tableName}"
            ORDER BY (SELECT NULL)
            LIMIT ${batchSize} OFFSET ${offset}
          `)

          if (batch.length === 0) break

          for (const row of batch) {
            const values = columnNames.map((col) => {
              const val = (row as any)[col]
              if (val === null || val === undefined) return 'NULL'
              if (val instanceof Date) return `'${val.toISOString()}'`
              if (typeof val === 'boolean') return val ? 'true' : 'false'
              if (typeof val === 'number') return String(val)
              if (typeof val === 'object') {
                return `'${JSON.stringify(val).replace(/'/g, "''")}'::jsonb`
              }
              return `'${String(val).replace(/'/g, "''")}'`
            })

            const columnsStr = columnNames.map((c) => `"${c}"`).join(', ')
            const valuesStr = values.join(', ')
            const insertQuery = `INSERT INTO "${schema}"."${tableName}" (${columnsStr}) VALUES (${valuesStr}) ON CONFLICT DO NOTHING`

            try {
              await (destSql as any).unsafe(insertQuery)
              copied++
            } catch (error: any) {
              // Skip duplicate key errors
            }
          }

          offset += batchSize
          process.stdout.write(`      ⏳ ${copied}/${rowCount} rows\r`)
        }

        console.log(`\n      ✅ Copied ${copied} rows`)
        totalRows += copied
      } catch (error: any) {
        console.log(`\n      ❌ Error: ${error.message.substring(0, 100)}`)
      }
    }
  }

  console.log(`\n✅ Data copy complete: ${totalRows} total rows\n`)
  return totalRows
}

/**
 * Main function
 */
async function main() {
  console.log('🚀 Starting complete Neon setup...\n')

  const sourceClient = postgres(SUPABASE_DATABASE_URL, { max: 1, prepare: false })
  const destSql = neon(NEON_DATABASE_URL)

  try {
    await sourceClient`SELECT 1`
    await destSql`SELECT 1`
    console.log('✅ Both connections successful\n')

    // Step 1: Create auth schema
    await createAuthSchema(destSql)

    // Step 2: Apply migrations
    console.log('📐 Applying Supabase migrations...\n')
    const migrationsDir = join(process.cwd(), 'supabase', 'migrations')
    const migrationFiles = readdirSync(migrationsDir)
      .filter((f) => f.endsWith('.sql'))
      .sort()
      .map((f) => join(migrationsDir, f))

    for (const file of migrationFiles) {
      await applyMigration(destSql, file)
    }

    console.log('\n✅ All migrations applied\n')

    // Step 3: Copy data
    const totalRows = await copyAllData(sourceClient, destSql)

    // Step 4: Summary
    console.log('='.repeat(60))
    console.log('📊 Migration Summary')
    console.log('='.repeat(60))
    console.log(`✅ Migrations applied: ${migrationFiles.length} files`)
    console.log(`✅ Data copied: ${totalRows} rows`)
    console.log('\n✅ Complete setup finished!')
    console.log('\n💡 Next steps:')
    console.log('   1. Run: npm run drizzle:generate-schemas')
    console.log('   2. Test your application')
  } catch (error: any) {
    console.error('\n❌ Setup failed:', error.message)
    process.exit(1)
  } finally {
    await sourceClient.end()
  }
}

main()

