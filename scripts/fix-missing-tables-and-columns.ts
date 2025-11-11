/**
 * Fix Missing Tables and Columns
 *
 * Creates missing tables and adds missing columns to match Supabase schema.
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
 * Create missing table from Supabase schema
 */
async function createMissingTable(
  sourceClient: postgres.Sql,
  destClient: postgres.Sql,
  schema: string,
  tableName: string
): Promise<void> {
  console.log(`   📋 Creating ${schema}.${tableName}...`)

  // Get columns from Supabase
  const columns = await sourceClient`
    SELECT 
      column_name,
      data_type,
      character_maximum_length,
      numeric_precision,
      numeric_scale,
      is_nullable,
      column_default,
      udt_name
    FROM information_schema.columns
    WHERE table_schema = ${schema} AND table_name = ${tableName}
    ORDER BY ordinal_position
  `

  if (columns.length === 0) {
    console.log(`      ⚠️  No columns found in Supabase`)
    return
  }

  // Get primary key
  const pkResult = await sourceClient.unsafe(`
    SELECT a.attname
    FROM pg_index i
    JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
    WHERE i.indrelid = '"${schema}"."${tableName}"'::regclass
      AND i.indisprimary
    ORDER BY a.attnum
  `)
  const primaryKeys = pkResult.map((r: any) => r.attname)

  // Get foreign keys
  const fkResult = await sourceClient`
    SELECT
      kcu.column_name,
      ccu.table_schema AS foreign_table_schema,
      ccu.table_name AS foreign_table_name,
      ccu.column_name AS foreign_column_name,
      rc.delete_rule
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
    JOIN information_schema.referential_constraints AS rc
      ON rc.constraint_name = tc.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema = ${schema}
      AND tc.table_name = ${tableName}
  `

  // Map data types
  function mapDataType(col: any): string {
    const { data_type, character_maximum_length, numeric_precision, numeric_scale, udt_name } = col

    // Handle arrays
    if (udt_name && udt_name.startsWith('_')) {
      const baseType = udt_name.substring(1)
      return `${baseType}[]`
    }

    switch (data_type) {
      case 'ARRAY':
        return 'TEXT[]' // Default array type
      case 'uuid':
        return 'UUID'
      case 'text':
        return 'TEXT'
      case 'character varying':
      case 'varchar':
        return character_maximum_length ? `VARCHAR(${character_maximum_length})` : 'TEXT'
      case 'integer':
      case 'int4':
        return 'INTEGER'
      case 'bigint':
      case 'int8':
        return 'BIGINT'
      case 'boolean':
      case 'bool':
        return 'BOOLEAN'
      case 'timestamp with time zone':
      case 'timestamptz':
        return 'TIMESTAMPTZ'
      case 'timestamp without time zone':
      case 'timestamp':
        return 'TIMESTAMP'
      case 'date':
        return 'DATE'
      case 'jsonb':
        return 'JSONB'
      case 'numeric':
      case 'decimal':
        if (numeric_precision && numeric_scale) {
          return `NUMERIC(${numeric_precision}, ${numeric_scale})`
        }
        return 'NUMERIC'
      case 'real':
      case 'float4':
        return 'REAL'
      case 'double precision':
      case 'float8':
        return 'DOUBLE PRECISION'
      case 'smallint':
      case 'int2':
        return 'SMALLINT'
      default:
        return 'TEXT'
    }
  }

  // Build CREATE TABLE
  let sql = `CREATE TABLE IF NOT EXISTS "${schema}"."${tableName}" (\n`
  const colDefs: string[] = []

  for (const col of columns) {
    let colDef = `  "${col.column_name}" ${mapDataType(col)}`

    if (col.is_nullable === 'NO') {
      colDef += ' NOT NULL'
    }

    if (col.column_default) {
      let defaultValue = col.column_default
      if (defaultValue.includes('::')) {
        defaultValue = defaultValue.split('::')[0].trim()
      }
      // Skip complex defaults that reference columns
      if (
        !defaultValue.includes('(') ||
        defaultValue.includes('gen_random_uuid') ||
        defaultValue.includes('now()') ||
        defaultValue.includes('nextval')
      ) {
        colDef += ` DEFAULT ${defaultValue}`
      }
    }

    colDefs.push(colDef)
  }

  sql += colDefs.join(',\n')

  if (primaryKeys.length > 0) {
    sql += `,\n  PRIMARY KEY (${primaryKeys.map((k) => `"${k}"`).join(', ')})`
  }

  for (const fk of fkResult) {
    const onDelete =
      fk.delete_rule === 'CASCADE'
        ? ' ON DELETE CASCADE'
        : fk.delete_rule === 'SET NULL'
          ? ' ON DELETE SET NULL'
          : ''
    sql += `,\n  CONSTRAINT "${tableName}_${fk.column_name}_fkey" FOREIGN KEY ("${fk.column_name}") REFERENCES "${fk.foreign_table_schema}"."${fk.foreign_table_name}"("${fk.foreign_column_name}")${onDelete}`
  }

  sql += '\n)'

  try {
    await destClient.unsafe(sql)
    console.log(`      ✅ Created ${schema}.${tableName}`)
  } catch (error: any) {
    if (error.message.includes('already exists')) {
      console.log(`      ⚠️  Already exists`)
    } else {
      console.log(`      ❌ Error: ${error.message.substring(0, 100)}`)
      throw error
    }
  }
}

/**
 * Add missing columns to existing table
 */
async function addMissingColumns(
  sourceClient: postgres.Sql,
  destClient: postgres.Sql,
  schema: string,
  tableName: string
): Promise<void> {
  // Get columns from both
  const sourceCols = await sourceClient`
    SELECT column_name, data_type, character_maximum_length, numeric_precision, numeric_scale, is_nullable, column_default, udt_name
    FROM information_schema.columns
    WHERE table_schema = ${schema} AND table_name = ${tableName}
    ORDER BY ordinal_position
  `

  const destCols = await destClient`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = ${schema} AND table_name = ${tableName}
  `

  const destColNames = new Set(destCols.map((c: any) => c.column_name))

  function mapDataType(col: any): string {
    const { data_type, character_maximum_length, numeric_precision, numeric_scale, udt_name } = col

    if (udt_name && udt_name.startsWith('_')) {
      return `${udt_name.substring(1)}[]`
    }

    switch (data_type) {
      case 'ARRAY':
        return 'TEXT[]'
      case 'uuid':
        return 'UUID'
      case 'text':
        return 'TEXT'
      case 'character varying':
      case 'varchar':
        return character_maximum_length ? `VARCHAR(${character_maximum_length})` : 'TEXT'
      case 'integer':
      case 'int4':
        return 'INTEGER'
      case 'bigint':
      case 'int8':
        return 'BIGINT'
      case 'boolean':
      case 'bool':
        return 'BOOLEAN'
      case 'timestamp with time zone':
      case 'timestamptz':
        return 'TIMESTAMPTZ'
      case 'timestamp without time zone':
      case 'timestamp':
        return 'TIMESTAMP'
      case 'date':
        return 'DATE'
      case 'jsonb':
        return 'JSONB'
      case 'numeric':
      case 'decimal':
        return numeric_precision && numeric_scale
          ? `NUMERIC(${numeric_precision}, ${numeric_scale})`
          : 'NUMERIC'
      case 'smallint':
      case 'int2':
        return 'SMALLINT'
      default:
        return 'TEXT'
    }
  }

  for (const col of sourceCols) {
    if (!destColNames.has(col.column_name)) {
      console.log(`   ➕ Adding column ${col.column_name} (${mapDataType(col)})`)

      let alterSQL = `ALTER TABLE "${schema}"."${tableName}" ADD COLUMN "${col.column_name}" ${mapDataType(col)}`

      if (col.is_nullable === 'NO') {
        alterSQL += ' NOT NULL'
      }

      if (col.column_default) {
        let defaultValue = col.column_default
        if (defaultValue.includes('::')) {
          defaultValue = defaultValue.split('::')[0].trim()
        }
        if (
          !defaultValue.includes('(') ||
          defaultValue.includes('gen_random_uuid') ||
          defaultValue.includes('now()')
        ) {
          alterSQL += ` DEFAULT ${defaultValue}`
        }
      }

      try {
        await destClient.unsafe(alterSQL)
        console.log(`      ✅ Added ${col.column_name}`)
      } catch (error: any) {
        console.log(`      ❌ Error: ${error.message.substring(0, 100)}`)
      }
    }
  }
}

/**
 * Fix column type mismatches
 */
async function fixColumnTypes(
  sourceClient: postgres.Sql,
  destClient: postgres.Sql,
  schema: string,
  tableName: string
): Promise<void> {
  // Fix crm.leads.tags from text to array
  if (schema === 'crm' && tableName === 'leads') {
    const sourceCol = await sourceClient`
      SELECT data_type, udt_name
      FROM information_schema.columns
      WHERE table_schema = 'crm' AND table_name = 'leads' AND column_name = 'tags'
    `

    if (sourceCol[0]?.data_type === 'ARRAY') {
      console.log(`   🔧 Fixing crm.leads.tags type (text → array)`)
      try {
        await destClient.unsafe(`
          ALTER TABLE "crm"."leads" 
          ALTER COLUMN "tags" TYPE TEXT[] USING CASE WHEN "tags" IS NULL THEN NULL ELSE ARRAY["tags"]::TEXT[] END
        `)
        console.log(`      ✅ Fixed tags column type`)
      } catch (error: any) {
        console.log(
          `      ⚠️  Could not fix (may need manual migration): ${error.message.substring(0, 100)}`
        )
      }
    }
  }
}

async function main() {
  console.log('🔧 Fixing missing tables and columns...\n')

  const sourceClient = postgres(SUPABASE_DATABASE_URL, { max: 1, prepare: false })
  const destClient = postgres(NEON_DATABASE_URL, { max: 1, prepare: true })

  try {
    await sourceClient`SELECT 1`
    await destClient`SELECT 1`
    console.log('✅ Both connections successful\n')

    // Missing tables to create
    const missingTables = [
      { schema: 'core', table: 'ai_agents' },
      { schema: 'common_util', table: 'task_attachments' },
      { schema: 'common_util', table: 'task_deliverables' },
      { schema: 'common_util', table: 'task_subtasks' },
    ]

    console.log('📋 Creating missing tables...\n')
    for (const { schema, table } of missingTables) {
      await createMissingTable(sourceClient, destClient, schema, table)
    }

    console.log('\n📋 Adding missing columns...\n')

    // Fix common_util.tasks
    console.log('   🔧 Fixing common_util.tasks...')
    await addMissingColumns(sourceClient, destClient, 'common_util', 'tasks')

    // Fix column types
    console.log('\n📋 Fixing column types...\n')
    await fixColumnTypes(sourceClient, destClient, 'crm', 'leads')

    console.log('\n✅ All fixes applied!')
    console.log('\n💡 Next: Run "npm run verify-all" to verify')
  } catch (error: any) {
    console.error('\n❌ Failed:', error.message)
    process.exit(1)
  } finally {
    await sourceClient.end()
    await destClient.end()
  }
}

main()





