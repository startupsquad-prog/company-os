/**
 * Test database connection directly
 */

import * as dotenv from 'dotenv'
import { resolve } from 'path'
import postgres from 'postgres'

// Load environment variables
dotenv.config({ path: resolve(process.cwd(), '.env.local') })
dotenv.config({ path: resolve(process.cwd(), '.env') })

async function testConnection() {
  const dbUrl = process.env.DATABASE_URL
  if (!dbUrl) {
    console.error('❌ DATABASE_URL is not set!')
    process.exit(1)
  }
  
  console.log('✅ DATABASE_URL is set')
  console.log('Connecting to database...')
  
  try {
    const sql = postgres(dbUrl, { max: 1 })
    
    // Test 1: Simple query
    console.log('\n📊 Test 1: Simple query...')
    const result1 = await sql`SELECT 1 as test`
    console.log('✅ Simple query works:', result1)
    
    // Test 2: Query tickets table
    console.log('\n📊 Test 2: Query tickets table...')
    const result2 = await sql`SELECT COUNT(*) as count FROM common_util.tickets`
    console.log('✅ Tickets query works:', result2)
    
    // Test 3: Query with WHERE
    console.log('\n📊 Test 3: Query non-deleted tickets...')
    const result3 = await sql`SELECT COUNT(*) as count FROM common_util.tickets WHERE deleted_at IS NULL`
    console.log('✅ Non-deleted tickets query works:', result3)
    
    // Test 4: Fetch actual tickets
    console.log('\n📊 Test 4: Fetch actual tickets...')
    const result4 = await sql`SELECT id, ticket_number, title, status FROM common_util.tickets WHERE deleted_at IS NULL LIMIT 5`
    console.log(`✅ Fetched ${result4.length} tickets:`)
    result4.forEach((ticket: any, index: number) => {
      console.log(`   ${index + 1}. ${ticket.ticket_number} - ${ticket.title} (${ticket.status})`)
    })
    
    await sql.end()
    console.log('\n✅ All tests passed! Database connection is working.')
    process.exit(0)
  } catch (error: any) {
    console.error('\n❌ Connection failed!')
    console.error('Error:', error.message)
    console.error('Stack:', error.stack)
    process.exit(1)
  }
}

testConnection()

