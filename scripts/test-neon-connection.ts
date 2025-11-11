/**
 * Test Neon Database Connection
 *
 * This script tests the Neon database connection and verifies basic operations.
 *
 * Usage:
 *   tsx scripts/test-neon-connection.ts
 */

import { neon } from '@neondatabase/serverless'
import * as dotenv from 'dotenv'
import { resolve } from 'path'

// Load environment variables
dotenv.config({ path: resolve(process.cwd(), '.env.local') })
dotenv.config({ path: resolve(process.cwd(), '.env') })

const DATABASE_URL = process.env.DATABASE_URL

if (!DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set')
}

async function testConnection() {
  console.log('🧪 Testing Neon database connection...\n')

  try {
    const sql = neon(DATABASE_URL)

    // Test 1: Basic connection
    console.log('1️⃣ Testing basic connection...')
    const result1 = await sql`SELECT 1 as test`
    console.log('   ✅ Connection successful:', result1[0])

    // Test 2: Check database version
    console.log('\n2️⃣ Checking database version...')
    const result2 = await sql`SELECT version()`
    console.log('   ✅ Database version:', result2[0]?.version?.substring(0, 50) + '...')

    // Test 3: List schemas
    console.log('\n3️⃣ Listing schemas...')
    const result3 = await sql`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
      ORDER BY schema_name
    `
    console.log('   ✅ Found schemas:')
    result3.forEach((row: any) => {
      console.log(`      - ${row.schema_name}`)
    })

    // Test 4: Count tables in each schema
    console.log('\n4️⃣ Counting tables in each schema...')
    for (const row of result3) {
      const schemaName = (row as any).schema_name
      const result4 = await sql`
        SELECT COUNT(*) as count
        FROM information_schema.tables
        WHERE table_schema = ${schemaName}
          AND table_type = 'BASE TABLE'
      `
      const count = Number((result4[0] as any)?.count || 0)
      console.log(`      ${schemaName}: ${count} tables`)
    }

    // Test 5: Test a simple query on core schema
    console.log('\n5️⃣ Testing query on core schema...')
    try {
      const result5 = await sql`
        SELECT COUNT(*) as count FROM core.profiles
      `
      const profileCount = Number((result5[0] as any)?.count || 0)
      console.log(`   ✅ Found ${profileCount} profiles in core.profiles`)
    } catch (error: any) {
      console.log(`   ⚠️  Could not query core.profiles: ${error.message}`)
    }

    console.log('\n✅ All connection tests passed!')
    console.log('\n💡 Next steps:')
    console.log('   1. Run: npm run migrate:to-neon (if not done yet)')
    console.log('   2. Run: npm run drizzle:generate-schemas')
    console.log('   3. Test your application')
  } catch (error: any) {
    console.error('\n❌ Connection test failed:', error.message)
    console.error('\n💡 Troubleshooting:')
    console.error('   1. Verify DATABASE_URL is correct in .env.local')
    console.error('   2. Check that Neon database is accessible')
    console.error('   3. Verify network connectivity')
    process.exit(1)
  }
}

testConnection()





