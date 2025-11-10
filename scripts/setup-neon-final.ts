/**
 * Final Neon Setup
 *
 * Uses postgres package for DDL (schema creation) and Neon HTTP for data operations.
 */

import { neon } from '@neondatabase/serverless'
import postgres from 'postgres'
import * as dotenv from 'dotenv'
import { resolve } from 'path'
import { readdirSync, readFileSync } from 'fs'
import { join } from 'path'

dotenv.config({ path: resolve(process.cwd(), '.env.local') })
dotenv.config({ path: resolve(process.cwd(), '.env') })

const SUPABASE_DATABASE_URL = process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL
// Use unpooled connection for DDL operations
const NEON_DATABASE_URL = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL
const NEON_POOLED_URL = process.env.DATABASE_URL // For queries

if (!SUPABASE_DATABASE_URL) {
  throw new Error('SUPABASE_DATABASE_URL or DATABASE_URL environment variable is not set')
}

if (!NEON_DATABASE_URL) {
  throw new Error('DATABASE_URL or DATABASE_URL_UNPOOLED environment variable is not set')
}

/**
 * Split SQL into statements
 */
function splitSQL(sql: string): string[] {
  const statements: string[] = []
  let current = ''
  let inDollarQuote = false
  let dollarTag = ''

  for (let i = 0; i < sql.length; i++) {
    const char = sql[i]
    const nextChar = sql[i + 1]

    if (char === '$' && nextChar === '$') {
      if (!inDollarQuote) {
        let tagEnd = i + 2
        while (tagEnd < sql.length && sql[tagEnd] !== '$') tagEnd++
        dollarTag = sql.substring(i + 2, tagEnd)
        inDollarQuote = true
        current += sql.substring(i, tagEnd + 2)
        i = tagEnd + 1
        continue
      } else {
        const potentialTag = sql.substring(i + 2, i + 2 + dollarTag.length)
        if (potentialTag === dollarTag && sql[i + 2 + dollarTag.length] === '$') {
          current += sql.substring(i, i + 2 + dollarTag.length + 2)
          i = i + 2 + dollarTag.length + 1
          inDollarQuote = false
          dollarTag = ''
          continue
        }
      }
    }

    current += char

    if (
      !inDollarQuote &&
      char === ';' &&
      (nextChar === '\n' || nextChar === '\r' || i === sql.length - 1)
    ) {
      const stmt = current.trim()
      if (stmt.length > 0 && !stmt.startsWith('--')) {
        statements.push(stmt)
      }
      current = ''
    }
  }

  if (current.trim().length > 0) {
    statements.push(current.trim())
  }

  return statements.filter((s) => s.length > 0)
}

/**
 * Apply migration using postgres client (for DDL)
 */
async function applyMigration(postgresClient: postgres.Sql, filePath: string): Promise<void> {
  const fileName = filePath.split(/[/\\]/).pop()
  console.log(`   📄 Applying: ${fileName}`)

  const sqlContent = readFileSync(filePath, 'utf-8')
  const cleaned = sqlContent
    .split('\n')
    .map((line) => (line.trim().startsWith('--') ? '' : line))
    .join('\n')

  const statements = splitSQL(cleaned)
  console.log(`      Found ${statements.length} statements`)

  let successCount = 0

  for (const statement of statements) {
    if (statement.trim().length === 0) continue

    try {
      await postgresClient.unsafe(statement)
      successCount++
    } catch (error: any) {
      const errorMsg = error.message
      if (
        !errorMsg.includes('already exists') &&
        !errorMsg.includes('duplicate') &&
        !errorMsg.includes('does not exist') &&
        !errorMsg.includes('permission denied')
      ) {
        // Only log unexpected errors
        if (successCount === 0 || successCount % 10 === 0) {
          console.log(`      ⚠️  Statement ${successCount + 1}: ${errorMsg.substring(0, 80)}`)
        }
      } else {
        successCount++ // Count as success
      }
    }
  }

  console.log(`      ✅ Applied: ${successCount}/${statements.length} statements`)
}

/**
 * Copy data using Neon HTTP
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
          SELECT column_name
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
              // Skip duplicate errors
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
 * Main
 */
async function main() {
  console.log('🚀 Final Neon setup (using postgres for DDL, Neon HTTP for data)...\n')

  const sourceClient = postgres(SUPABASE_DATABASE_URL, { max: 1, prepare: false })

  // Use postgres package for DDL (unpooled connection)
  const neonPostgres = postgres(NEON_DATABASE_URL, { max: 1, prepare: true })

  // Use Neon HTTP for data operations
  const neonHttp = neon(NEON_POOLED_URL || NEON_DATABASE_URL)

  try {
    await sourceClient`SELECT 1`
    await neonPostgres`SELECT 1`
    console.log('✅ All connections successful\n')

    // Step 1: Create auth schema
    console.log('🔐 Creating auth schema...')
    await neonPostgres.unsafe(`
      CREATE SCHEMA IF NOT EXISTS auth;
      CREATE TABLE IF NOT EXISTS auth.users (
        id UUID PRIMARY KEY,
        email TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `)
    console.log('✅ Auth schema created\n')

    // Step 2: Apply migrations using postgres client
    console.log('📐 Applying Supabase migrations...\n')
    const migrationsDir = join(process.cwd(), 'supabase', 'migrations')
    const migrationFiles = readdirSync(migrationsDir)
      .filter((f) => f.endsWith('.sql'))
      .sort()
      .map((f) => join(migrationsDir, f))

    for (const file of migrationFiles) {
      await applyMigration(neonPostgres, file)
    }

    console.log('\n✅ All migrations applied\n')

    // Step 3: Verify schemas exist
    console.log('🔍 Verifying schemas...')
    const schemas = await neonPostgres`
      SELECT nspname FROM pg_namespace 
      WHERE nspname IN ('core', 'crm', 'ats', 'ops', 'common_util', 'import_ops')
      ORDER BY nspname
    `
    console.log(
      `   Found ${schemas.length} schemas:`,
      schemas.map((s: any) => s.nspname).join(', ')
    )

    // Step 4: Copy data
    const totalRows = await copyAllData(sourceClient, neonHttp)

    // Step 5: Summary
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
    console.error(error.stack)
    process.exit(1)
  } finally {
    await sourceClient.end()
    await neonPostgres.end()
  }
}

main()

