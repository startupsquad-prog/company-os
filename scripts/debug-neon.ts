/**
 * Debug Neon Connection
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

async function debug() {
  console.log('🔍 Debugging Neon connection...\n')
  console.log('DATABASE_URL:', DATABASE_URL.substring(0, 50) + '...\n')

  const sql = neon(DATABASE_URL)

  try {
    // Test 1: Current database
    const dbInfo = await sql`SELECT current_database(), current_user`
    console.log('1. Database info:', dbInfo)

    // Test 2: Create a test schema
    console.log('\n2. Creating test_schema...')
    await (sql as any).unsafe('CREATE SCHEMA IF NOT EXISTS test_schema')

    // Test 3: Check if it exists using pg_namespace
    const namespaces = await sql`SELECT nspname FROM pg_namespace WHERE nspname = 'test_schema'`
    console.log('   Namespaces query result:', namespaces)

    // Test 4: Create a test table
    console.log('\n3. Creating test table...')
    await (sql as any).unsafe(
      'CREATE TABLE IF NOT EXISTS test_schema.test_table (id UUID PRIMARY KEY, name TEXT)'
    )

    // Test 5: Check if table exists
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables
      WHERE table_schema = 'test_schema'
        AND table_name = 'test_table'
    `
    console.log('   Tables query result:', tables)

    // Test 6: Insert and query data
    console.log('\n4. Testing data operations...')
    await (sql as any).unsafe(
      "INSERT INTO test_schema.test_table (id, name) VALUES (gen_random_uuid(), 'test') ON CONFLICT DO NOTHING"
    )
    const data = await sql`SELECT * FROM test_schema.test_table`
    console.log('   Data:', data)

    // Test 7: Try creating core schema
    console.log('\n5. Creating core schema...')
    await (sql as any).unsafe('CREATE SCHEMA IF NOT EXISTS core')

    // Test 8: Check core schema
    const coreCheck = await sql`SELECT nspname FROM pg_namespace WHERE nspname = 'core'`
    console.log('   Core schema check:', coreCheck)

    // Test 9: Create a table in core
    console.log('\n6. Creating table in core schema...')
    await (sql as any).unsafe(`
      CREATE TABLE IF NOT EXISTS core.test_profiles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT
      )
    `)

    // Test 10: Check the table
    const coreTables = await sql`
      SELECT table_name 
      FROM information_schema.tables
      WHERE table_schema = 'core'
    `
    console.log('   Core tables:', coreTables)
  } catch (error: any) {
    console.error('❌ Error:', error.message)
    console.error(error.stack)
  }
}

debug()







