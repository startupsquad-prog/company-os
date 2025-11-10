/**
 * Create CRM Tables from Schema Information
 *
 * Builds CREATE TABLE statements from information_schema and creates them in Neon.
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
 * Map PostgreSQL data types to SQL
 */
function mapDataType(col: any): string {
  const { data_type, character_maximum_length, numeric_precision, numeric_scale } = col

  switch (data_type) {
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
    default:
      return 'TEXT' // Fallback
  }
}

/**
 * Build CREATE TABLE statement from schema information
 */
async function buildCreateTable(
  sourceClient: postgres.Sql,
  schema: string,
  tableName: string
): Promise<string> {
  // Get columns
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
      rc.update_rule,
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

  const foreignKeys = fkResult.map((fk: any) => ({
    column: fk.column_name,
    refSchema: fk.foreign_table_schema,
    refTable: fk.foreign_table_name,
    refColumn: fk.foreign_column_name,
    onUpdate: fk.update_rule,
    onDelete: fk.delete_rule,
  }))

  // Build CREATE TABLE statement
  let sql = `CREATE TABLE IF NOT EXISTS "${schema}"."${tableName}" (\n`

  const colDefs: string[] = []

  for (const col of columns) {
    let colDef = `  "${col.column_name}" ${mapDataType(col)}`

    // NOT NULL
    if (col.is_nullable === 'NO') {
      colDef += ' NOT NULL'
    }

    // DEFAULT
    if (col.column_default) {
      let defaultValue = col.column_default
      // Skip if it references a column (like "nextval(...)" or column references)
      if (
        defaultValue.includes('nextval') ||
        defaultValue.includes('::') ||
        defaultValue.match(/^\([^)]+\)$/)
      ) {
        // Handle function calls like gen_random_uuid(), now(), nextval()
        if (defaultValue.includes('::')) {
          defaultValue = defaultValue.split('::')[0].trim()
        }
        // Remove outer parentheses if it's a function call
        if (defaultValue.startsWith('(') && defaultValue.endsWith(')')) {
          defaultValue = defaultValue.slice(1, -1)
        }
        colDef += ` DEFAULT ${defaultValue}`
      } else if (
        !defaultValue.includes('(') ||
        defaultValue.includes('gen_random_uuid') ||
        defaultValue.includes('now()')
      ) {
        // Safe defaults: functions or literals
        if (defaultValue.includes('::')) {
          defaultValue = defaultValue.split('::')[0].trim()
        }
        colDef += ` DEFAULT ${defaultValue}`
      }
      // Otherwise skip the default (it might reference a column)
    }

    colDefs.push(colDef)
  }

  sql += colDefs.join(',\n')

  // Primary key
  if (primaryKeys.length > 0) {
    sql += `,\n  PRIMARY KEY (${primaryKeys.map((k) => `"${k}"`).join(', ')})`
  }

  // Foreign keys
  for (const fk of foreignKeys) {
    const onDelete =
      fk.onDelete === 'CASCADE'
        ? ' ON DELETE CASCADE'
        : fk.onDelete === 'SET NULL'
          ? ' ON DELETE SET NULL'
          : ''
    sql += `,\n  CONSTRAINT "${tableName}_${fk.column}_fkey" FOREIGN KEY ("${fk.column}") REFERENCES "${fk.refSchema}"."${fk.refTable}"("${fk.refColumn}")${onDelete}`
  }

  sql += '\n)'

  return sql
}

async function main() {
  console.log('🔨 Creating CRM tables in Neon from Supabase schema...\n')

  const sourceClient = postgres(SUPABASE_DATABASE_URL, { max: 1, prepare: false })
  const destClient = postgres(NEON_DATABASE_URL, { max: 1, prepare: true })

  try {
    await sourceClient`SELECT 1`
    await destClient`SELECT 1`
    console.log('✅ Both connections successful\n')

    // Ensure CRM schema exists
    await destClient.unsafe('CREATE SCHEMA IF NOT EXISTS crm')
    console.log('✅ CRM schema created/verified\n')

    // Get all CRM tables from Supabase
    const crmTables = await sourceClient`
      SELECT table_name 
      FROM information_schema.tables
      WHERE table_schema = 'crm'
        AND table_type = 'BASE TABLE'
        AND table_name NOT LIKE 'pg_%'
      ORDER BY table_name
    `

    console.log(`Found ${crmTables.length} CRM tables in Supabase\n`)

    // Create each table
    for (const table of crmTables) {
      const tableName = table.table_name as string
      console.log(`📋 Creating crm.${tableName}...`)

      try {
        const createSQL = await buildCreateTable(sourceClient, 'crm', tableName)
        await destClient.unsafe(createSQL)
        console.log(`   ✅ Created crm.${tableName}`)
      } catch (error: any) {
        if (error.message.includes('already exists')) {
          console.log(`   ⚠️  crm.${tableName} already exists`)
        } else {
          console.log(`   ❌ Error: ${error.message.substring(0, 150)}`)
          // Continue with other tables
        }
      }
    }

    console.log('\n✅ CRM table creation complete!')
    console.log('\n💡 Next: Run "npm run copy-data-ordered" to copy data')
  } catch (error: any) {
    console.error('\n❌ Failed:', error.message)
    process.exit(1)
  } finally {
    await sourceClient.end()
    await destClient.end()
  }
}

main()
