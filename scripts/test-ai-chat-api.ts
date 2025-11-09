/**
 * Test script for AI Chat API endpoint
 * Tests /api/ai/chat with proper authentication
 * 
 * Usage: tsx scripts/test-ai-chat-api.ts
 * 
 * Prerequisites:
 * 1. Start your Next.js dev server: npm run dev
 * 2. Make sure OPENROUTER_API_KEY is set in .env.local
 */

import dotenv from 'dotenv'
import { join } from 'path'

// Load environment variables
dotenv.config({ path: join(process.cwd(), '.env.local') })

const API_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
const ENDPOINT = `${API_URL}/api/ai/chat`

// Test messages - format that DefaultChatTransport expects
const testMessages = [
  {
    role: 'user' as const,
    parts: [
      {
        type: 'text' as const,
        text: 'Hello! This is a test message. Please respond with "Test successful!"',
      },
    ],
  },
]

// Note: This test requires authentication via Supabase cookies
// For a full test, you need to:
// 1. Log in to the app in your browser
// 2. Copy the session cookie from DevTools
// 3. Add it to the Cookie header below

async function testChatAPI() {
  console.log('🧪 [TEST] Starting AI Chat API Test\n')
  console.log(`📋 [TEST] Configuration:`)
  console.log(`  - Endpoint: ${ENDPOINT}`)
  console.log(`  - OPENROUTER_API_KEY: ${process.env.OPENROUTER_API_KEY ? '✅ Set' : '❌ Missing'}`)
  console.log('')

  if (!process.env.OPENROUTER_API_KEY) {
    console.error('❌ [TEST] OPENROUTER_API_KEY is not set in .env.local')
    process.exit(1)
  }

  try {
    console.log('📤 [TEST] Sending request...')
    console.log('📤 [TEST] Messages:', JSON.stringify(testMessages, null, 2))
    console.log('')

    const response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: testMessages,
      }),
    })

    console.log(`📥 [TEST] Response Status: ${response.status} ${response.statusText}`)
    console.log(`📥 [TEST] Response Headers:`, Object.fromEntries(response.headers.entries()))
    console.log('')

    if (response.status === 401) {
      console.error('❌ [TEST] Unauthorized - Authentication required')
      console.log('💡 [TEST] Note: This test requires authentication via cookies')
      console.log('💡 [TEST] The API route checks Supabase authentication')
      process.exit(1)
    }

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`❌ [TEST] Error: ${response.status}`)
      console.error('❌ [TEST] Error response:', errorText)
      process.exit(1)
    }

    console.log('📥 [TEST] Reading response stream...\n')
    console.log('📝 [TEST] Response content:')
    console.log('─'.repeat(50))

    const reader = response.body?.getReader()
    const decoder = new TextDecoder()
    let fullResponse = ''

    if (!reader) {
      console.error('❌ [TEST] No response body reader available')
      process.exit(1)
    }

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value, { stream: true })
      fullResponse += chunk
      process.stdout.write(chunk)
    }

    console.log('\n' + '─'.repeat(50))
    console.log('')
    console.log('✅ [TEST] Test completed!')
    console.log(`📊 [TEST] Response length: ${fullResponse.length} characters`)

    if (fullResponse.length === 0) {
      console.warn('⚠️ [TEST] Warning: Empty response received')
    } else {
      console.log('✅ [TEST] Response received successfully!')
    }
  } catch (error) {
    console.error('❌ [TEST] Request error:', error)
    if (error instanceof Error) {
      console.error('❌ [TEST] Error message:', error.message)
      console.error('❌ [TEST] Error stack:', error.stack)
    }
    process.exit(1)
  }
}

testChatAPI()

