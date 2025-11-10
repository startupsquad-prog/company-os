/**
 * Copy Data with ID Mapping
 *
 * Maps IDs between Supabase and Neon using unique identifiers (like names),
 * then copies dependent tables using the mapped IDs.
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
 * Create ID mapping based on unique identifier
 */
async function createIdMapping(
  sourceClient: postgres.Sql,
  destClient: postgres.Sql,
  schema: string,
  table: string,
  uniqueCol: string
): Promise<Map<string, string>> {
  const sourceRows = await sourceClient.unsafe(
    `SELECT id, "${uniqueCol}" FROM "${schema}"."${table}"`
  )
  const destRows = await destClient.unsafe(`SELECT id, "${uniqueCol}" FROM "${schema}"."${table}"`)

  const mapping = new Map<string, string>()
  const destMap = new Map(destRows.map((r: any) => [r[uniqueCol], r.id]))

  for (const sourceRow of sourceRows) {
    const uniqueValue = (sourceRow as any)[uniqueCol]
    const destId = destMap.get(uniqueValue)
    if (destId) {
      mapping.set((sourceRow as any).id, destId)
    }
  }

  return mapping
}

async function main() {
  console.log('🔧 Copying remaining data with ID mapping...\n')

  const sourceClient = postgres(SUPABASE_DATABASE_URL, { max: 1, prepare: false })
  const destClient = postgres(NEON_DATABASE_URL, { max: 1, prepare: true })

  try {
    await sourceClient`SELECT 1`
    await destClient`SELECT 1`
    console.log('✅ Both connections successful\n')

    // Create ID mappings
    console.log('📋 Creating ID mappings...\n')

    const roleMapping = await createIdMapping(sourceClient, destClient, 'core', 'roles', 'name')
    console.log(`   Roles: ${roleMapping.size} mappings`)

    const permissionMapping = await createIdMapping(
      sourceClient,
      destClient,
      'core',
      'permissions',
      'name'
    )
    console.log(`   Permissions: ${permissionMapping.size} mappings`)

    const profileMapping = await createIdMapping(
      sourceClient,
      destClient,
      'core',
      'profiles',
      'email'
    )
    console.log(`   Profiles: ${profileMapping.size} mappings`)

    // Tasks - use a combination of title + created_at or just copy by preserving IDs
    // Since tasks were already copied, we can use the same IDs
    const taskMapping = new Map<string, string>()
    const sourceTasks = await sourceClient.unsafe(`SELECT id FROM common_util.tasks`)
    const destTasks = await destClient.unsafe(`SELECT id FROM common_util.tasks`)
    const destTaskIds = new Set(destTasks.map((t: any) => t.id))
    for (const st of sourceTasks) {
      if (destTaskIds.has((st as any).id)) {
        taskMapping.set((st as any).id, (st as any).id)
      }
    }
    console.log(`   Tasks: ${taskMapping.size} mappings\n`)

    // Copy role_permissions with ID mapping
    console.log('📋 Copying role_permissions...')
    const rpRows = await sourceClient.unsafe(`SELECT * FROM core.role_permissions`)
    let rpCopied = 0

    for (const row of rpRows) {
      const mappedRoleId = roleMapping.get((row as any).role_id)
      const mappedPermId = permissionMapping.get((row as any).permission_id)

      if (mappedRoleId && mappedPermId) {
        try {
          await destClient.unsafe(
            `INSERT INTO core.role_permissions (id, role_id, permission_id, created_at, updated_at, created_by, deleted_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT DO NOTHING`,
            [
              (row as any).id,
              mappedRoleId,
              mappedPermId,
              (row as any).created_at,
              (row as any).updated_at,
              (row as any).created_by,
              (row as any).deleted_at,
            ]
          )
          rpCopied++
        } catch (error: any) {
          // Skip errors
        }
      }
    }
    console.log(`   ✅ Copied ${rpCopied}/${rpRows.length} rows\n`)

    // Copy user_role_bindings with ID mapping
    console.log('📋 Copying user_role_bindings...')
    const urbRows = await sourceClient.unsafe(`SELECT * FROM core.user_role_bindings`)
    let urbCopied = 0

    for (const row of urbRows) {
      const mappedUserId = profileMapping.get((row as any).user_id) || (row as any).user_id
      const mappedRoleId = roleMapping.get((row as any).role_id)

      if (mappedRoleId) {
        try {
          await destClient.unsafe(
            `INSERT INTO core.user_role_bindings (id, user_id, role_id, created_at, updated_at, created_by, deleted_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT DO NOTHING`,
            [
              (row as any).id,
              mappedUserId,
              mappedRoleId,
              (row as any).created_at,
              (row as any).updated_at,
              (row as any).created_by,
              (row as any).deleted_at,
            ]
          )
          urbCopied++
        } catch (error: any) {
          // Skip errors
        }
      }
    }
    console.log(`   ✅ Copied ${urbCopied}/${urbRows.length} rows\n`)

    // Copy task_deliverables - check if task_id exists in Neon
    console.log('📋 Copying task_deliverables...')
    const tdRows = await sourceClient.unsafe(`SELECT * FROM common_util.task_deliverables`)
    let tdCopied = 0

    for (const row of tdRows) {
      const taskId = (row as any).task_id
      // Check if task exists in Neon
      const taskExists = await destClient.unsafe(`SELECT 1 FROM common_util.tasks WHERE id = $1`, [
        taskId,
      ])

      if (taskExists.length > 0) {
        try {
          const cols = Object.keys(row as any).filter((k) => (row as any)[k] !== undefined)
          const values = cols.map((k) => (row as any)[k])
          const placeholders = cols.map((_, i) => `$${i + 1}`).join(', ')
          const colNames = cols.map((c) => `"${c}"`).join(', ')

          await destClient.unsafe(
            `INSERT INTO common_util.task_deliverables (${colNames}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`,
            values
          )
          tdCopied++
        } catch (error: any) {
          // Skip errors
        }
      }
    }
    console.log(`   ✅ Copied ${tdCopied}/${tdRows.length} rows\n`)

    // Copy task_subtasks - check if task_id and parent_task_id exist
    console.log('📋 Copying task_subtasks...')
    const tsRows = await sourceClient.unsafe(`SELECT * FROM common_util.task_subtasks`)
    let tsCopied = 0

    for (const row of tsRows) {
      const taskId = (row as any).task_id
      const parentId = (row as any).parent_task_id

      // Check if both tasks exist
      const taskExists = await destClient.unsafe(`SELECT 1 FROM common_util.tasks WHERE id = $1`, [
        taskId,
      ])
      const parentExists =
        !parentId ||
        (await destClient.unsafe(`SELECT 1 FROM common_util.tasks WHERE id = $1`, [parentId]))
          .length > 0

      if (taskExists.length > 0 && parentExists) {
        try {
          const cols = Object.keys(row as any).filter((k) => (row as any)[k] !== undefined)
          const values = cols.map((k) => (row as any)[k])
          const placeholders = cols.map((_, i) => `$${i + 1}`).join(', ')
          const colNames = cols.map((c) => `"${c}"`).join(', ')

          await destClient.unsafe(
            `INSERT INTO common_util.task_subtasks (${colNames}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`,
            values
          )
          tsCopied++
        } catch (error: any) {
          // Skip errors
        }
      }
    }
    console.log(`   ✅ Copied ${tsCopied}/${tsRows.length} rows\n`)

    console.log('✅ Remaining data copy complete!')
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
