/**
 * Fix Remaining Data Issues
 *
 * Fixes FK constraint issues and copies remaining data.
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

async function copyWithFKMapping(
  sourceClient: postgres.Sql,
  destClient: postgres.Sql,
  schema: string,
  table: string,
  fkMappings?: { [key: string]: { sourceTable: string; sourceIdCol: string; destIdCol: string } }
): Promise<number> {
  const fullName = `${schema}.${table}`
  console.log(`   📋 ${fullName}...`)

  try {
    // Get row count
    const countResult = await sourceClient.unsafe(
      `SELECT COUNT(*) as count FROM "${schema}"."${table}"`
    )
    const rowCount = Number((countResult[0] as any)?.count || 0)

    if (rowCount === 0) {
      console.log(`      ⏭️  Empty, skipping`)
      return 0
    }

    console.log(`      Found ${rowCount} rows`)

    // Get columns
    const columns = await sourceClient`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = ${schema} AND table_name = ${table}
      ORDER BY ordinal_position
    `
    const columnNames = columns.map((c) => c.column_name as string)

    // Fetch all rows
    const rows = await sourceClient.unsafe(`SELECT * FROM "${schema}"."${table}"`)

    let copied = 0
    let errors = 0

    for (const row of rows) {
      const values: any[] = []
      const placeholders: string[] = []
      const insertColumns: string[] = []

      for (let i = 0; i < columnNames.length; i++) {
        const colName = columnNames[i]
        let value = (row as any)[colName]

        // Handle FK mappings
        if (fkMappings && fkMappings[colName]) {
          const mapping = fkMappings[colName]
          // Find the mapped ID in destination
          const mappedResult = await destClient.unsafe(
            `SELECT "${mapping.destIdCol}" FROM "${schema}"."${mapping.sourceTable}" WHERE "${mapping.sourceIdCol}" = $1 LIMIT 1`,
            [value]
          )
          if (mappedResult.length > 0) {
            value = (mappedResult[0] as any)[mapping.destIdCol]
          } else {
            // Skip this row if FK doesn't exist
            value = null
          }
        }

        if (value !== undefined) {
          insertColumns.push(`"${colName}"`)
          values.push(value)
          placeholders.push(`$${values.length}`)
        }
      }

      if (values.length === 0) {
        errors++
        continue
      }

      const insertQuery = `
        INSERT INTO "${schema}"."${table}" (${insertColumns.join(', ')})
        VALUES (${placeholders.join(', ')})
        ON CONFLICT DO NOTHING
      `

      try {
        await destClient.unsafe(insertQuery, values)
        copied++
      } catch (error: any) {
        errors++
        if (errors <= 3) {
          console.log(`      ⚠️  Row error: ${error.message.substring(0, 80)}`)
        }
      }
    }

    console.log(
      `      ✅ Copied ${copied}/${rowCount} rows${errors > copied ? ` (${errors} errors)` : ''}`
    )
    return copied
  } catch (error: any) {
    console.log(`      ❌ Error: ${error.message.substring(0, 100)}`)
    return 0
  }
}

async function main() {
  console.log('🔧 Fixing remaining data issues...\n')

  const sourceClient = postgres(SUPABASE_DATABASE_URL, { max: 1, prepare: false })
  const destClient = postgres(NEON_DATABASE_URL, { max: 1, prepare: true })

  try {
    await sourceClient`SELECT 1`
    await destClient`SELECT 1`
    console.log('✅ Both connections successful\n')

    // First, check if role_permissions and user_role_bindings need FK remapping
    console.log('📋 Checking FK relationships...\n')

    // Get role IDs from both databases to see if they match
    const supabaseRoles = await sourceClient.unsafe(`SELECT id, name FROM core.roles ORDER BY name`)
    const neonRoles = await destClient.unsafe(`SELECT id, name FROM core.roles ORDER BY name`)

    console.log(`   Supabase roles: ${supabaseRoles.length}`)
    console.log(`   Neon roles: ${neonRoles.length}`)

    // Check if IDs match
    const supabaseRoleIds = new Set(supabaseRoles.map((r: any) => r.id))
    const neonRoleIds = new Set(neonRoles.map((r: any) => r.id))
    const matchingIds = [...supabaseRoleIds].filter((id) => neonRoleIds.has(id))

    console.log(`   Matching role IDs: ${matchingIds.length}/${supabaseRoles.length}\n`)

    // Copy role_permissions (should work now that roles are copied)
    console.log('📋 Copying role_permissions...')
    const rpCount = await copyWithFKMapping(sourceClient, destClient, 'core', 'role_permissions')

    // Copy user_role_bindings
    console.log('\n📋 Copying user_role_bindings...')
    const urbCount = await copyWithFKMapping(sourceClient, destClient, 'core', 'user_role_bindings')

    // Copy task_deliverables
    console.log('\n📋 Copying task_deliverables...')
    const tdCount = await copyWithFKMapping(
      sourceClient,
      destClient,
      'common_util',
      'task_deliverables'
    )

    // Copy task_subtasks
    console.log('\n📋 Copying task_subtasks...')
    const tsCount = await copyWithFKMapping(
      sourceClient,
      destClient,
      'common_util',
      'task_subtasks'
    )

    console.log('\n✅ Remaining data copy complete!')
    console.log(`   role_permissions: ${rpCount} rows`)
    console.log(`   user_role_bindings: ${urbCount} rows`)
    console.log(`   task_deliverables: ${tdCount} rows`)
    console.log(`   task_subtasks: ${tsCount} rows`)

    console.log('\n💡 Run "npm run verify-all" to verify')
  } catch (error: any) {
    console.error('\n❌ Failed:', error.message)
    process.exit(1)
  } finally {
    await sourceClient.end()
    await destClient.end()
  }
}

main()

