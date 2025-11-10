/**
 * Copy Data in Dependency Order
 *
 * Copies data respecting foreign key constraints by processing tables in order.
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

// Define table order based on dependencies (FKs)
const TABLE_ORDER = [
  // Core - no dependencies
  'core.departments',
  'core.modules',
  'core.roles',
  'core.permissions',
  'core.enum_registry',

  // Core - depends on departments
  'core.teams',

  // Core - depends on auth.users (we'll handle this)
  'core.profiles',

  // Core - depends on profiles
  'core.employees',
  'core.contacts',
  'core.companies',
  'core.company_contacts',

  // Core - depends on roles/permissions
  'core.role_permissions',
  'core.user_role_bindings',

  // Core - depends on profiles
  'core.notifications',
  'core.activity_events',
  'core.ai_agents',

  // CRM - depends on profiles, contacts, companies
  'crm.pipelines',
  'crm.stages',
  'crm.leads',
  'crm.opportunities',
  'crm.interactions',
  'crm.status_history',

  // Common Util - depends on profiles
  'common_util.tasks',
  'common_util.task_assignees',
  'common_util.task_comments',
  'common_util.task_status_history',
]

async function copyTable(
  sourceClient: postgres.Sql,
  destClient: postgres.Sql,
  schema: string,
  table: string
): Promise<number> {
  const fullName = `${schema}.${table}`

  try {
    // Check if table exists in destination
    const tableExists = await destClient`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = ${schema} AND table_name = ${table}
      )
    `

    if (!tableExists[0]?.exists) {
      console.log(`   ⏭️  ${fullName}: Table doesn't exist in Neon, skipping`)
      return 0
    }

    // Get row count from source
    const countResult = await sourceClient.unsafe(
      `SELECT COUNT(*) as count FROM "${schema}"."${table}"`
    )
    const rowCount = Number((countResult[0] as any)?.count || 0)

    if (rowCount === 0) {
      return 0
    }

    console.log(`   📋 ${fullName}: ${rowCount} rows`)

    // Get columns from destination (to match schema)
    const destColumns = await destClient`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = ${schema}
        AND table_name = ${table}
        AND column_name NOT IN ('updated_at') -- Skip updated_at, let it default
      ORDER BY ordinal_position
    `
    const destColumnNames = destColumns.map((c) => c.column_name as string)

    // Get columns from source
    const sourceColumns = await sourceClient`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = ${schema}
        AND table_name = ${table}
      ORDER BY ordinal_position
    `
    const sourceColumnNames = sourceColumns.map((c) => c.column_name as string)

    // Find intersection of columns (only copy columns that exist in both)
    const columnsToCopy = destColumnNames.filter((col) => sourceColumnNames.includes(col))

    if (columnsToCopy.length === 0) {
      console.log(`      ⚠️  No matching columns, skipping`)
      return 0
    }

    // Fetch and insert in batches
    const batchSize = 100
    let offset = 0
    let copied = 0

    while (offset < rowCount) {
      const batch = await sourceClient.unsafe(`
        SELECT ${columnsToCopy.map((c) => `"${c}"`).join(', ')} 
        FROM "${schema}"."${table}"
        ORDER BY (SELECT NULL)
        LIMIT ${batchSize} OFFSET ${offset}
      `)

      if (batch.length === 0) break

      for (const row of batch) {
        const values = columnsToCopy.map((col) => (row as any)[col])
        const placeholders = columnsToCopy.map((_, i) => `$${i + 1}`).join(', ')
        const columnsStr = columnsToCopy.map((c) => `"${c}"`).join(', ')

        const insertQuery = `
          INSERT INTO "${schema}"."${table}" (${columnsStr})
          VALUES (${placeholders})
          ON CONFLICT DO NOTHING
        `

        try {
          await destClient.unsafe(insertQuery, values)
          copied++
        } catch (error: any) {
          if (!error.message.includes('duplicate') && !error.message.includes('already exists')) {
            // Only log first few errors per table
            if (copied === 0) {
              console.log(`      ⚠️  ${error.message.substring(0, 100)}`)
            }
          }
        }
      }

      offset += batchSize
      process.stdout.write(`      ⏳ ${copied}/${rowCount} rows\r`)
    }

    console.log(`\n      ✅ Copied ${copied} rows`)
    return copied
  } catch (error: any) {
    console.log(`\n      ❌ Error: ${error.message.substring(0, 100)}`)
    return 0
  }
}

async function main() {
  console.log('📥 Copying data in dependency order...\n')

  const sourceClient = postgres(SUPABASE_DATABASE_URL, { max: 1, prepare: false })
  const destClient = postgres(NEON_DATABASE_URL, { max: 1, prepare: true })

  try {
    await sourceClient`SELECT 1`
    await destClient`SELECT 1`
    console.log('✅ Both connections successful\n')

    let totalRows = 0

    for (const fullTableName of TABLE_ORDER) {
      const [schema, table] = fullTableName.split('.')
      const rows = await copyTable(sourceClient, destClient, schema, table)
      totalRows += rows
    }

    console.log(`\n✅ Data copy complete!`)
    console.log(`   Total rows copied: ${totalRows}`)
    console.log(`\n💡 Run 'npm run verify-data-migration' to verify`)
  } catch (error: any) {
    console.error('\n❌ Copy failed:', error.message)
    process.exit(1)
  } finally {
    await sourceClient.end()
    await destClient.end()
  }
}

main()
