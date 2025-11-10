import { neon } from '@neondatabase/serverless'
import * as dotenv from 'dotenv'
import { resolve } from 'path'
import { writeFileSync, mkdirSync } from 'fs'

// Load environment variables
dotenv.config({ path: resolve(process.cwd(), '.env.local') })
dotenv.config({ path: resolve(process.cwd(), '.env') })

const databaseUrl = process.env.DATABASE_URL!

const schemasToGenerate = ['core', 'crm', 'ats', 'ops', 'import_ops', 'common_util']

async function generateSchemas() {
  console.log('🔄 Generating Drizzle schemas from database...\n')

  const sql = neon(databaseUrl)

  try {
    // Ensure db/schema directory exists
    mkdirSync('./db/schema', { recursive: true })

    const allExports: string[] = []

    for (const schemaName of schemasToGenerate) {
      console.log(`📋 Processing schema: ${schemaName}`)

      // Get all tables in this schema
      const tablesResult = await sql`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = ${schemaName}
          AND table_type = 'BASE TABLE'
        ORDER BY table_name
      `
      const tables = Array.isArray(tablesResult) ? tablesResult : [tablesResult]

      if (tables.length === 0) {
        console.log(`   ⚠️  No tables found in ${schemaName}\n`)
        continue
      }

      console.log(`   Found ${tables.length} tables`)

      // Generate schema file for this schema
      const schemaContent: string[] = [
        `// Auto-generated schema for ${schemaName} schema`,
        `import { pgTable, pgSchema, uuid, text, integer, boolean, timestamp, bigint, jsonb, numeric, date, time, real, doublePrecision, inet, macaddr, bytea } from "drizzle-orm/pg-core";`,
        ``,
        `export const ${schemaName}Schema = pgSchema("${schemaName}");`,
        ``,
      ]

      for (const table of tables) {
        const tableName = table.table_name
        const camelCaseName = tableName.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())

        // Get columns for this table
        const columnsResult = await sql`
          SELECT 
            column_name,
            data_type,
            is_nullable,
            column_default,
            character_maximum_length,
            numeric_precision,
            numeric_scale
          FROM information_schema.columns
          WHERE table_schema = ${schemaName}
            AND table_name = ${tableName}
          ORDER BY ordinal_position
        `
        const columns = Array.isArray(columnsResult) ? columnsResult : [columnsResult]

        schemaContent.push(
          `export const ${camelCaseName} = ${schemaName}Schema.table("${tableName}", {`
        )

        for (const col of columns) {
          const colName = col.column_name
          const camelColName = colName.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
          const nullable = col.is_nullable === 'YES'

          let drizzleType = ''
          const params: string[] = []

          switch (col.data_type) {
            case 'uuid':
              drizzleType = 'uuid'
              break
            case 'text':
              drizzleType = 'text'
              break
            case 'character varying':
            case 'varchar':
              drizzleType = 'varchar'
              if (col.character_maximum_length) {
                params.push(col.character_maximum_length.toString())
              }
              break
            case 'integer':
            case 'int4':
              drizzleType = 'integer'
              break
            case 'bigint':
            case 'int8':
              drizzleType = 'bigint'
              break
            case 'boolean':
            case 'bool':
              drizzleType = 'boolean'
              break
            case 'timestamp with time zone':
            case 'timestamptz':
              drizzleType = 'timestamp'
              params.push(`{ withTimezone: true, mode: 'string' }`)
              break
            case 'timestamp without time zone':
            case 'timestamp':
              drizzleType = 'timestamp'
              params.push(`{ mode: 'string' }`)
              break
            case 'date':
              drizzleType = 'date'
              break
            case 'jsonb':
              drizzleType = 'jsonb'
              break
            case 'numeric':
            case 'decimal':
              drizzleType = 'numeric'
              if (col.numeric_precision && col.numeric_scale) {
                params.push(`${col.numeric_precision}, ${col.numeric_scale}`)
              }
              break
            case 'real':
            case 'float4':
              drizzleType = 'real'
              break
            case 'double precision':
            case 'float8':
              drizzleType = 'doublePrecision'
              break
            default:
              drizzleType = 'text' // Fallback
          }

          const typeCall =
            params.length > 0
              ? `${drizzleType}("${colName}", ${params.join(', ')})`
              : `${drizzleType}("${colName}")`

          const nullability = nullable ? '' : '.notNull()'
          const defaultValue = col.column_default
            ? `.default(${col.column_default.includes('nextval') ? 'sql`nextval(...)`' : `"${col.column_default}"`})`
            : ''

          schemaContent.push(`  ${camelColName}: ${typeCall}${nullability}${defaultValue},`)
        }

        schemaContent.push(`});`)
        schemaContent.push(``)
      }

      // Write schema file
      const fileName = `./db/schema/${schemaName}.ts`
      writeFileSync(fileName, schemaContent.join('\n'))
      console.log(`   ✅ Generated ${fileName}\n`)

      allExports.push(`export * from './${schemaName}';`)
    }

    // Update index.ts
    const indexContent = [
      `// Central export for all schema definitions`,
      `// Auto-generated - do not edit manually`,
      ``,
      ...allExports,
      ``,
    ].join('\n')

    writeFileSync('./db/schema/index.ts', indexContent)
    console.log('✅ Updated db/schema/index.ts')
    console.log('\n🎉 Schema generation complete!\n')
  } catch (error: any) {
    console.error('❌ Error generating schemas:', error.message)
    console.error(error)
  }
}

generateSchemas().catch(console.error)
