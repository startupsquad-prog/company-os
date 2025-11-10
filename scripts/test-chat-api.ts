/**
 * CLI test script for AI Chat API
 * Tests the /api/chat endpoint directly
 *
 * Usage: tsx scripts/test-chat-api.ts
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { readFileSync } from 'fs'
import { join } from 'path'

// Load environment variables
dotenv.config({ path: join(process.cwd(), '.env.local') })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY!

async function testChatAPI() {
  console.log('🧪 [CLI TEST] Starting AI Chat API Test\n')

  // Check environment variables
  console.log('📋 [CLI TEST] Environment Check:')
  console.log('  - SUPABASE_URL:', SUPABASE_URL ? '✅ Set' : '❌ Missing')
  console.log('  - SUPABASE_ANON_KEY:', SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing')
  console.log('  - OPENROUTER_API_KEY:', OPENROUTER_API_KEY ? '✅ Set' : '❌ Missing')
  console.log('')

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('❌ [CLI TEST] Missing Supabase credentials')
    process.exit(1)
  }

  if (!OPENROUTER_API_KEY) {
    console.error('❌ [CLI TEST] Missing OpenRouter API key')
    process.exit(1)
  }

  // Create Supabase client
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

  // Test authentication - get a test user
  console.log('🔐 [CLI TEST] Testing authentication...')
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    console.error('❌ [CLI TEST] Authentication failed:', authError?.message)
    console.log('💡 [CLI TEST] Note: You need to be logged in to test the API')
    console.log('💡 [CLI TEST] The API requires authentication via cookies')
    console.log('')
    console.log('📝 [CLI TEST] To test the API:')
    console.log('  1. Start your Next.js dev server: npm run dev')
    console.log('  2. Log in to the app in your browser')
    console.log('  3. Use the browser console or Network tab to test the API')
    process.exit(1)
  }

  console.log('✅ [CLI TEST] Authenticated as:', user.email)
  console.log('')

  // Test the API endpoint directly
  console.log('🌐 [CLI TEST] Testing API endpoint...')
  console.log('  Endpoint: http://localhost:3000/api/chat')
  console.log('')

  const testMessages = [
    {
      role: 'user' as const,
      content: 'Hello, this is a test message. Please respond with "Test successful!"',
    },
  ]

  console.log('📤 [CLI TEST] Sending request:')
  console.log('  Messages:', JSON.stringify(testMessages, null, 2))
  console.log('')

  try {
    // Get the session token for authentication
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      console.error('❌ [CLI TEST] No active session found')
      process.exit(1)
    }

    const response = await fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `sb-${SUPABASE_URL.split('//')[1].split('.')[0]}-auth-token=${session.access_token}`,
      },
      body: JSON.stringify({
        messages: testMessages,
      }),
    })

    console.log('📥 [CLI TEST] Response status:', response.status, response.statusText)
    console.log('📥 [CLI TEST] Response headers:', Object.fromEntries(response.headers.entries()))
    console.log('')

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ [CLI TEST] API Error:')
      console.error(errorText)
      process.exit(1)
    }

    // Read the stream
    console.log('📥 [CLI TEST] Reading response stream...')
    const reader = response.body?.getReader()
    const decoder = new TextDecoder()
    let fullResponse = ''

    if (!reader) {
      console.error('❌ [CLI TEST] No response body')
      process.exit(1)
    }

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value, { stream: true })
      fullResponse += chunk
      process.stdout.write(chunk)
    }

    console.log('')
    console.log('')
    console.log('✅ [CLI TEST] Test completed successfully!')
    console.log('📊 [CLI TEST] Response length:', fullResponse.length, 'characters')
  } catch (error) {
    console.error('❌ [CLI TEST] Error:', error)
    if (error instanceof Error) {
      console.error('  Message:', error.message)
      console.error('  Stack:', error.stack)
    }
    process.exit(1)
  }
}

// Run the test
testChatAPI().catch(console.error)
