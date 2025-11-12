/**
 * Verify Data Migration
 *
 * Compares row counts between Supabase and Neon to ensure all data was migrated.
 */

import postgres from 'postgres'
import { neon } from '@neondatabase/serverless'
import * as dotenv from 'dotenv'
import { resolve } from 'path'

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

interface TableInfo {
  schema: string
  table: string
  supabaseCount: number
  neonCount: number
  match: boolean
  difference: number
}

async function verifyDataMigration() {
  console.log('🔍 Verifying data migration from Supabase to Neon...\n')

  const sourceClient = postgres(SUPABASE_DATABASE_URL, { max: 1, prepare: false })
  const destSql = neon(NEON_DATABASE_URL)

  try {
    // Test connections
    await sourceClient`SELECT 1`
    await destSql`SELECT 1`
    console.log('✅ Both connections successful\n')

    const schemas = ['core', 'crm', 'ats', 'ops', 'import_ops', 'common_util', 'public']
    const results: TableInfo[] = []
    let totalSupabaseRows = 0
    let totalNeonRows = 0
    let mismatches: TableInfo[] = []

    console.log('📊 Comparing row counts...\n')

    for (const schema of schemas) {
      // Get all tables in this schema from Supabase
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
          // Get count from Supabase
          const supabaseCountResult = await sourceClient.unsafe(
            `SELECT COUNT(*) as count FROM "${schema}"."${tableName}"`
          )
          const supabaseCount = Number((supabaseCountResult[0] as any)?.count || 0)

          // Get count from Neon
          let neonCount = 0
          try {
            const neonCountResult = await (destSql as any).unsafe(
              `SELECT COUNT(*) as count FROM "${schema}"."${tableName}"`
            )
            const countArray = Array.isArray(neonCountResult) ? neonCountResult : [neonCountResult]
            neonCount = Number((countArray[0] as any)?.count || 0)
          } catch (neonError: any) {
            // Table might not exist in Neon
            if (neonError.message.includes('does not exist')) {
              neonCount = -1 // Mark as missing
            } else {
              throw neonError
            }
          }

          const match = supabaseCount === neonCount && neonCount >= 0
          const difference = supabaseCount - neonCount

          const info: TableInfo = {
            schema,
            table: tableName,
            supabaseCount,
            neonCount,
            match,
            difference,
          }

          results.push(info)
          totalSupabaseRows += supabaseCount
          totalNeonRows += neonCount >= 0 ? neonCount : 0

          if (!match) {
            mismatches.push(info)
          }

          // Display status
          if (supabaseCount > 0 || neonCount !== 0) {
            const status = match ? '✅' : neonCount === -1 ? '❌' : '⚠️'
            const statusText = match ? 'MATCH' : neonCount === -1 ? 'MISSING' : 'MISMATCH'
            console.log(
              `${status} ${fullTableName.padEnd(50)} Supabase: ${String(supabaseCount).padStart(5)} | Neon: ${String(neonCount >= 0 ? neonCount : 'N/A').padStart(5)} | ${statusText}`
            )
          }
        } catch (error: any) {
          console.log(`❌ Error checking ${fullTableName}: ${error.message.substring(0, 100)}`)
        }
      }
    }

    // Summary
    console.log('\n' + '='.repeat(80))
    console.log('📊 Migration Verification Summary')
    console.log('='.repeat(80))
    console.log(`Total tables checked: ${results.length}`)
    console.log(`Total rows in Supabase: ${totalSupabaseRows}`)
    console.log(`Total rows in Neon: ${totalNeonRows}`)
    console.log(`Rows matched: ${results.filter((r) => r.match).length}`)
    console.log(`Rows mismatched: ${mismatches.length}`)

    if (mismatches.length > 0) {
      console.log('\n⚠️  Mismatches found:')
      for (const mismatch of mismatches) {
        const fullName = `${mismatch.schema}.${mismatch.table}`
        if (mismatch.neonCount === -1) {
          console.log(`   ❌ ${fullName}: Table missing in Neon`)
        } else {
          console.log(
            `   ⚠️  ${fullName}: Supabase has ${mismatch.supabaseCount}, Neon has ${mismatch.neonCount} (difference: ${mismatch.difference})`
          )
        }
      }
      console.log('\n💡 Recommendation: Re-run data migration for mismatched tables')
      process.exit(1)
    } else {
      console.log('\n✅ All data successfully migrated!')
      console.log(`   All ${results.length} tables match between Supabase and Neon`)
      console.log(`   Total ${totalNeonRows} rows verified`)
    }
  } catch (error: any) {
    console.error('\n❌ Verification failed:', error.message)
    console.error(error.stack)
    process.exit(1)
  } finally {
    await sourceClient.end()
  }
}

verifyDataMigration()







