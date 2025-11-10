/**
 * Comprehensive Migration Verification
 *
 * Verifies:
 * 1. All schemas exist in Neon
 * 2. All tables exist in Neon
 * 3. Table structures match (columns, types, constraints)
 * 4. Data row counts match
 */

import postgres from 'postgres'
import * as dotenv from 'dotenv'
import { resolve } from 'path'

dotenv.config({ path: resolve(process.cwd(), '.env.local') })
dotenv.config({ path: resolve(process.cwd(), '.env') })

const SUPABASE_DATABASE_URL = process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL
// Use unpooled connection for queries
const NEON_DATABASE_URL = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL

if (!SUPABASE_DATABASE_URL || !NEON_DATABASE_URL) {
  throw new Error('Database URLs not set')
}

interface TableInfo {
  schema: string
  table: string
  existsInSupabase: boolean
  existsInNeon: boolean
  supabaseRows: number
  neonRows: number
  columnsMatch: boolean
  columnDifferences: string[]
}

async function getTableColumns(
  client: postgres.Sql,
  schema: string,
  table: string
): Promise<any[]> {
  return await client`
    SELECT 
      column_name,
      data_type,
      character_maximum_length,
      numeric_precision,
      numeric_scale,
      is_nullable,
      column_default
    FROM information_schema.columns
    WHERE table_schema = ${schema} AND table_name = ${table}
    ORDER BY ordinal_position
  `
}

async function compareTableStructure(
  sourceClient: postgres.Sql,
  destClient: postgres.Sql,
  schema: string,
  table: string
): Promise<{ match: boolean; differences: string[] }> {
  const differences: string[] = []

  try {
    const sourceCols = await getTableColumns(sourceClient, schema, table)
    const destCols = await getTableColumns(destClient, schema, table)

    const sourceColMap = new Map(sourceCols.map((c: any) => [c.column_name, c]))
    const destColMap = new Map(destCols.map((c: any) => [c.column_name, c]))

    // Check for missing columns in destination
    for (const [name, col] of sourceColMap) {
      if (!destColMap.has(name)) {
        differences.push(`Missing column in Neon: ${name} (${col.data_type})`)
      } else {
        const destCol = destColMap.get(name)!
        // Compare types (simplified)
        if (col.data_type !== destCol.data_type) {
          differences.push(
            `Type mismatch for ${name}: Supabase=${col.data_type}, Neon=${destCol.data_type}`
          )
        }
        if (col.is_nullable !== destCol.is_nullable) {
          differences.push(
            `Nullable mismatch for ${name}: Supabase=${col.is_nullable}, Neon=${destCol.is_nullable}`
          )
        }
      }
    }

    // Check for extra columns in destination
    for (const [name] of destColMap) {
      if (!sourceColMap.has(name)) {
        differences.push(`Extra column in Neon: ${name}`)
      }
    }

    return {
      match: differences.length === 0,
      differences,
    }
  } catch (error: any) {
    return {
      match: false,
      differences: [`Error comparing structure: ${error.message}`],
    }
  }
}

async function getRowCount(client: postgres.Sql, schema: string, table: string): Promise<number> {
  try {
    const result = await client.unsafe(`SELECT COUNT(*) as count FROM "${schema}"."${table}"`)
    return Number((result[0] as any)?.count || 0)
  } catch (error: any) {
    return -1 // Error
  }
}

async function main() {
  console.log('🔍 Comprehensive Migration Verification\n')
  console.log('='.repeat(80))

  const sourceClient = postgres(SUPABASE_DATABASE_URL, { max: 1, prepare: false })
  const destClient = postgres(NEON_DATABASE_URL, { max: 1, prepare: true })

  try {
    await sourceClient`SELECT 1`
    await destClient`SELECT 1`
    console.log('✅ Both connections successful\n')

    const schemas = ['core', 'crm', 'ats', 'ops', 'import_ops', 'common_util', 'public', 'auth']
    const allResults: TableInfo[] = []
    let totalIssues = 0

    for (const schema of schemas) {
      console.log(`\n📦 Checking schema: ${schema}`)
      console.log('-'.repeat(80))

      // Get tables from Supabase
      const supabaseTables = await sourceClient`
        SELECT table_name 
        FROM information_schema.tables
        WHERE table_schema = ${schema}
          AND table_type = 'BASE TABLE'
          AND table_name NOT LIKE 'pg_%'
          AND table_name NOT LIKE '_drizzle_%'
        ORDER BY table_name
      `

      // Get tables from Neon
      const neonTables = await destClient`
        SELECT table_name 
        FROM information_schema.tables
        WHERE table_schema = ${schema}
          AND table_type = 'BASE TABLE'
          AND table_name NOT LIKE 'pg_%'
          AND table_name NOT LIKE '_drizzle_%'
        ORDER BY table_name
      `
      const neonTableNames = new Set(neonTables.map((t: any) => t.table_name))

      console.log(`   Supabase: ${supabaseTables.length} tables`)
      console.log(`   Neon: ${neonTables.length} tables\n`)

      // Check each table
      for (const table of supabaseTables) {
        const tableName = table.table_name as string
        const fullName = `${schema}.${tableName}`
        const existsInNeon = neonTableNames.has(tableName)

        console.log(`   📋 ${fullName}`)

        const info: TableInfo = {
          schema,
          table: tableName,
          existsInSupabase: true,
          existsInNeon: existsInNeon,
          supabaseRows: 0,
          neonRows: 0,
          columnsMatch: false,
          columnDifferences: [],
        }

        if (!existsInNeon) {
          console.log(`      ❌ Table missing in Neon`)
          info.columnDifferences.push('Table does not exist in Neon')
          totalIssues++
        } else {
          // Compare structure
          const structure = await compareTableStructure(sourceClient, destClient, schema, tableName)
          info.columnsMatch = structure.match
          info.columnDifferences = structure.differences

          if (!structure.match) {
            console.log(`      ⚠️  Structure differences:`)
            structure.differences.forEach((diff) => console.log(`         - ${diff}`))
            totalIssues++
          }

          // Compare row counts
          const supabaseCount = await getRowCount(sourceClient, schema, tableName)
          const neonCount = await getRowCount(destClient, schema, tableName)

          info.supabaseRows = supabaseCount
          info.neonRows = neonCount

          if (supabaseCount === -1) {
            console.log(`      ⚠️  Could not get Supabase row count`)
          } else if (neonCount === -1) {
            console.log(`      ⚠️  Could not get Neon row count`)
            totalIssues++
          } else if (supabaseCount === neonCount) {
            console.log(`      ✅ Rows match: ${supabaseCount}`)
          } else {
            console.log(
              `      ❌ Row count mismatch: Supabase=${supabaseCount}, Neon=${neonCount} (diff: ${supabaseCount - neonCount})`
            )
            totalIssues++
          }
        }

        allResults.push(info)
      }

      // Check for tables in Neon that don't exist in Supabase
      for (const neonTable of neonTables) {
        const tableName = neonTable.table_name as string
        const existsInSupabase = supabaseTables.some((t) => t.table_name === tableName)
        if (!existsInSupabase) {
          console.log(`   ⚠️  ${schema}.${tableName}: Exists in Neon but not in Supabase`)
          totalIssues++
        }
      }
    }

    // Summary
    console.log('\n' + '='.repeat(80))
    console.log('📊 Verification Summary')
    console.log('='.repeat(80))

    const tablesChecked = allResults.length
    const tablesMatch = allResults.filter(
      (r) => r.existsInNeon && r.columnsMatch && r.supabaseRows === r.neonRows
    ).length
    const missingTables = allResults.filter((r) => !r.existsInNeon).length
    const structureMismatches = allResults.filter((r) => r.existsInNeon && !r.columnsMatch).length
    const dataMismatches = allResults.filter(
      (r) =>
        r.existsInNeon && r.supabaseRows !== r.neonRows && r.supabaseRows >= 0 && r.neonRows >= 0
    ).length

    const totalSupabaseRows = allResults.reduce(
      (sum, r) => sum + (r.supabaseRows > 0 ? r.supabaseRows : 0),
      0
    )
    const totalNeonRows = allResults.reduce((sum, r) => sum + (r.neonRows > 0 ? r.neonRows : 0), 0)

    console.log(`Tables checked: ${tablesChecked}`)
    console.log(`✅ Fully matching: ${tablesMatch}`)
    console.log(`❌ Missing tables: ${missingTables}`)
    console.log(`⚠️  Structure mismatches: ${structureMismatches}`)
    console.log(`⚠️  Data mismatches: ${dataMismatches}`)
    console.log(`\nTotal rows in Supabase: ${totalSupabaseRows}`)
    console.log(`Total rows in Neon: ${totalNeonRows}`)
    console.log(`Row difference: ${totalSupabaseRows - totalNeonRows}`)

    if (totalIssues === 0) {
      console.log('\n✅ All verifications passed!')
    } else {
      console.log(`\n⚠️  Found ${totalIssues} issue(s)`)

      // Detailed report
      console.log('\n📋 Detailed Issues:')
      console.log('-'.repeat(80))

      if (missingTables > 0) {
        console.log('\n❌ Missing Tables:')
        allResults
          .filter((r) => !r.existsInNeon)
          .forEach((r) => console.log(`   - ${r.schema}.${r.table}`))
      }

      if (structureMismatches > 0) {
        console.log('\n⚠️  Structure Mismatches:')
        allResults
          .filter((r) => r.existsInNeon && !r.columnsMatch)
          .forEach((r) => {
            console.log(`   ${r.schema}.${r.table}:`)
            r.columnDifferences.forEach((diff) => console.log(`      - ${diff}`))
          })
      }

      if (dataMismatches > 0) {
        console.log('\n⚠️  Data Mismatches:')
        allResults
          .filter(
            (r) =>
              r.existsInNeon &&
              r.supabaseRows !== r.neonRows &&
              r.supabaseRows >= 0 &&
              r.neonRows >= 0
          )
          .forEach((r) => {
            console.log(
              `   ${r.schema}.${r.table}: Supabase=${r.supabaseRows}, Neon=${r.neonRows} (diff: ${r.supabaseRows - r.neonRows})`
            )
          })
      }

      process.exit(1)
    }
  } catch (error: any) {
    console.error('\n❌ Verification failed:', error.message)
    console.error(error.stack)
    process.exit(1)
  } finally {
    await sourceClient.end()
    await destClient.end()
  }
}

main()
