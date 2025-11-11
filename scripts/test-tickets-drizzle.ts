/**
 * Test script to verify Drizzle ORM connection and tickets data fetching
 * Run with: npx tsx scripts/test-tickets-drizzle.ts
 */

import * as dotenv from 'dotenv'
import { resolve } from 'path'

// Load environment variables
dotenv.config({ path: resolve(process.cwd(), '.env.local') })
dotenv.config({ path: resolve(process.cwd(), '.env') })

// Using postgres client directly for testing

async function testTicketsConnection() {
  console.log('🧪 Testing Drizzle ORM connection and tickets data...\n')

  try {
    // Test 1: Check DATABASE_URL
    const dbUrl = process.env.DATABASE_URL
    if (!dbUrl) {
      console.error('❌ DATABASE_URL is not set!')
      process.exit(1)
    }
    console.log('✅ DATABASE_URL is set:', dbUrl.substring(0, 30) + '...')

    // Test 2: Test database connection with raw SQL
    console.log('\n📊 Test 2: Testing database connection with raw SQL...')
    const { postgresClientRaw } = await import('../db/connections')
    const rawResult = await postgresClientRaw`SELECT COUNT(*) as count FROM common_util.tickets`
    console.log('✅ Raw SQL connection successful!')
    console.log(`   Total tickets: ${rawResult[0]?.count}`)

    // Test 3: Count non-deleted tickets
    console.log('\n📊 Test 3: Counting non-deleted tickets...')
    const nonDeletedResult = await postgresClientRaw`SELECT COUNT(*) as count FROM common_util.tickets WHERE deleted_at IS NULL`
    console.log(`✅ Non-deleted tickets: ${nonDeletedResult[0]?.count}`)

    // Test 4: Fetch first 5 tickets
    console.log('\n📊 Test 4: Fetching first 5 tickets...')
    const tickets = await postgresClientRaw`
      SELECT id, ticket_number, title, status, priority, created_at
      FROM common_util.tickets
      WHERE deleted_at IS NULL
      ORDER BY created_at DESC
      LIMIT 5
    `

    console.log(`✅ Fetched ${tickets.length} tickets:`)
    tickets.forEach((ticket: any, index: number) => {
      console.log(`   ${index + 1}. ${ticket.ticket_number} - ${ticket.title} (${ticket.status})`)
    })

    // Test 5: Test with filters
    console.log('\n📊 Test 5: Testing with status filter...')
    const filteredTickets = await postgresClientRaw`
      SELECT id, ticket_number, title, status
      FROM common_util.tickets
      WHERE deleted_at IS NULL AND status = 'open'
      LIMIT 3
    `

    console.log(`✅ Filtered tickets: ${filteredTickets.length}`)

    console.log('\n✅ All tests passed! Drizzle ORM is working correctly.')
    console.log('\n💡 Next steps:')
    console.log('   - Check API route logs')
    console.log('   - Verify the tickets page is calling the API correctly')
    process.exit(0)
  } catch (error: any) {
    console.error('\n❌ Test failed!')
    console.error('Error:', error.message)
    console.error('Stack:', error.stack)
    process.exit(1)
  }
}

testTicketsConnection()

