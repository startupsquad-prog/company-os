/**
 * Copy Data to Neon
 *
 * Uses postgres package (unpooled) to ensure proper transaction commits.
 */

import postgres from 'postgres'
import * as dotenv from 'dotenv'
import { resolve } from 'path'

dotenv.config({ path: resolve(process.cwd(), '.env.local') })
dotenv.config({ path: resolve(process.cwd(), '.env') })

const SUPABASE_DATABASE_URL = process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL
// Use unpooled connection for data operations to ensure proper commits
const NEON_DATABASE_URL = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL

if (!SUPABASE_DATABASE_URL) {
  throw new Error('SUPABASE_DATABASE_URL or DATABASE_URL environment variable is not set')
}

if (!NEON_DATABASE_URL) {
  throw new Error('DATABASE_URL or DATABASE_URL_UNPOOLED environment variable is not set')
}

async function copyData() {
  console.log('📥 Copying data from Supabase to Neon (using postgres for proper commits)...\n')

  const sourceClient = postgres(SUPABASE_DATABASE_URL, { max: 1, prepare: false })
  // Use postgres package for destination to ensure proper transaction handling
  const destClient = postgres(NEON_DATABASE_URL, { max: 1, prepare: true })

  try {
    await sourceClient`SELECT 1`
    await destClient`SELECT 1`
    console.log('✅ Both connections successful\n')

    const schemas = ['core', 'crm', 'ats', 'ops', 'import_ops', 'common_util', 'public']
    let totalRows = 0
    let tablesProcessed = 0

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
          // Get row count
          const countResult = await sourceClient.unsafe(
            `SELECT COUNT(*) as count FROM "${schema}"."${tableName}"`
          )
          const rowCount = Number((countResult[0] as any)?.count || 0)

          if (rowCount === 0) {
            console.log(`   ⏭️  ${fullTableName}: Empty, skipping`)
            continue
          }

          console.log(`   📋 ${fullTableName}: ${rowCount} rows`)

          // Get column names and types
          const columns = await sourceClient`
            SELECT column_name, data_type
            FROM information_schema.columns
            WHERE table_schema = ${schema}
              AND table_name = ${tableName}
            ORDER BY ordinal_position
          `
          const columnNames = columns.map((c) => c.column_name as string)

          // Clear existing data (optional - comment out if you want to keep existing)
          // await destClient.unsafe(`TRUNCATE TABLE "${schema}"."${tableName}" CASCADE`)

          // Fetch and insert data in batches
          const batchSize = 100
          let offset = 0
          let copied = 0

          while (offset < rowCount) {
            const batch = await sourceClient.unsafe(`
              SELECT * FROM "${schema}"."${tableName}"
              ORDER BY (SELECT NULL)
              LIMIT ${batchSize} OFFSET ${offset}
            `)

            if (batch.length === 0) break

            // Insert batch using parameterized query
            for (const row of batch) {
              const values = columnNames.map((col) => (row as any)[col])
              const placeholders = columnNames.map((_, i) => `$${i + 1}`).join(', ')
              const columnsStr = columnNames.map((c) => `"${c}"`).join(', ')

              const insertQuery = `
                INSERT INTO "${schema}"."${tableName}" (${columnsStr})
                VALUES (${placeholders})
                ON CONFLICT DO NOTHING
              `

              try {
                await destClient.unsafe(insertQuery, values)
                copied++
              } catch (error: any) {
                // Log error but continue
                if (
                  !error.message.includes('duplicate') &&
                  !error.message.includes('already exists')
                ) {
                  console.log(`      ⚠️  Row insert error: ${error.message.substring(0, 80)}`)
                }
              }
            }

            offset += batchSize
            process.stdout.write(`      ⏳ ${copied}/${rowCount} rows\r`)
          }

          console.log(`\n      ✅ Copied ${copied} rows`)
          totalRows += copied
          tablesProcessed++
        } catch (error: any) {
          console.log(`\n      ❌ Error: ${error.message.substring(0, 100)}`)
        }
      }
    }

    console.log(`\n✅ Data copy complete!`)
    console.log(`   Tables processed: ${tablesProcessed}`)
    console.log(`   Total rows copied: ${totalRows}`)
    console.log(`\n💡 Run 'npm run verify-data-migration' to verify`)
  } catch (error: any) {
    console.error('\n❌ Copy failed:', error.message)
    console.error(error.stack)
    process.exit(1)
  } finally {
    await sourceClient.end()
    await destClient.end()
  }
}

copyData()

