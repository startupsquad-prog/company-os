/**
 * Test Neon SQL Execution
 */

import { neon } from '@neondatabase/serverless'
import * as dotenv from 'dotenv'
import { resolve } from 'path'

dotenv.config({ path: resolve(process.cwd(), '.env.local') })
dotenv.config({ path: resolve(process.cwd(), '.env') })

const DATABASE_URL = process.env.DATABASE_URL

if (!DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set')
}

async function test() {
  const sql = neon(DATABASE_URL)

  try {
    // Test 1: Create a schema
    console.log('1. Testing CREATE SCHEMA...')
    try {
      await (sql as any).unsafe('CREATE SCHEMA IF NOT EXISTS test_schema')
      console.log('   ✅ Schema creation works')
    } catch (e: any) {
      console.log(`   ❌ Error: ${e.message}`)
    }

    // Test 2: Check if test_schema exists
    console.log('\n2. Checking if test_schema exists...')
    const schemas =
      await sql`SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'test_schema'`
    console.log('   Result:', schemas)

    // Test 3: Try creating core schema
    console.log('\n3. Creating core schema...')
    try {
      await (sql as any).unsafe('CREATE SCHEMA IF NOT EXISTS core')
      console.log('   ✅ Core schema created')
    } catch (e: any) {
      console.log(`   ❌ Error: ${e.message}`)
    }

    // Test 4: Check all schemas
    console.log('\n4. All schemas:')
    const allSchemas =
      await sql`SELECT schema_name FROM information_schema.schemata WHERE schema_name NOT IN ('pg_catalog', 'information_schema', 'pg_toast') ORDER BY schema_name`
    const schemaList = Array.isArray(allSchemas) ? allSchemas : [allSchemas]
    for (const s of schemaList) {
      console.log(`   - ${(s as any).schema_name}`)
    }

    // Test 5: Try reading a migration file and executing it
    console.log('\n5. Testing migration file execution...')
    const { readFileSync } = await import('fs')
    const { join } = await import('path')
    const firstMigration = join(
      process.cwd(),
      'supabase',
      'migrations',
      '20250107000000_phase0_core.sql'
    )
    const migrationContent = readFileSync(firstMigration, 'utf-8')

    // Extract just the schema creation part
    const schemaCreation = migrationContent.match(/CREATE SCHEMA IF NOT EXISTS\s+(\w+);/gi)
    if (schemaCreation) {
      console.log(`   Found ${schemaCreation.length} schema creations`)
      for (const stmt of schemaCreation) {
        try {
          await (sql as any).unsafe(stmt)
          console.log(`   ✅ Executed: ${stmt.substring(0, 50)}...`)
        } catch (e: any) {
          console.log(`   ❌ Error: ${e.message.substring(0, 100)}`)
        }
      }
    }
  } catch (error: any) {
    console.error('Error:', error.message)
  }
}

test()

