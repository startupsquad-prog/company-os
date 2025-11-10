/**
 * Simple CLI test for AI Chat API
 * Tests the /api/chat endpoint using Node.js fetch
 *
 * Usage: node scripts/test-chat-api-simple.js
 *
 * Prerequisites:
 * 1. Start your Next.js dev server: npm run dev
 * 2. Make sure you're logged in to the app
 * 3. Copy your session cookie from browser DevTools
 */

const http = require('http')

// Configuration
const PORT = 3000
const API_ENDPOINT = `/api/chat`

// Test message
const testMessages = [
  {
    role: 'user',
    content: 'Hello! This is a test message. Please respond with "Test successful!"',
  },
]

// Create request
const postData = JSON.stringify({
  messages: testMessages,
})

const options = {
  hostname: 'localhost',
  port: PORT,
  path: API_ENDPOINT,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData),
    // Note: You'll need to add your session cookie here
    // Get it from browser DevTools > Application > Cookies
    // 'Cookie': 'your-session-cookie-here',
  },
}

console.log('🧪 [CLI TEST] Starting AI Chat API Test\n')
console.log(`📋 [CLI TEST] Configuration:`)
console.log(`  - Endpoint: http://localhost:${PORT}${API_ENDPOINT}`)
console.log(`  - Method: POST`)
console.log(`  - Messages: ${testMessages.length}`)
console.log('')

const req = http.request(options, (res) => {
  console.log(`📥 [CLI TEST] Response Status: ${res.statusCode} ${res.statusMessage}`)
  console.log(`📥 [CLI TEST] Response Headers:`, res.headers)
  console.log('')

  if (res.statusCode === 401) {
    console.error('❌ [CLI TEST] Unauthorized - You need to be logged in')
    console.log('💡 [CLI TEST] To fix this:')
    console.log('  1. Open your browser and log in to the app')
    console.log('  2. Open DevTools > Application > Cookies')
    console.log('  3. Copy the session cookie')
    console.log('  4. Add it to the Cookie header in this script')
    process.exit(1)
  }

  if (res.statusCode === 404) {
    console.error('❌ [CLI TEST] Route not found')
    console.log('💡 [CLI TEST] Make sure:')
    console.log('  1. Your Next.js dev server is running')
    console.log('  2. The route file exists at src/app/api/chat/route.ts')
    process.exit(1)
  }

  if (!res.statusCode || res.statusCode >= 400) {
    console.error(`❌ [CLI TEST] Error: ${res.statusCode}`)
    let errorData = ''
    res.on('data', (chunk) => {
      errorData += chunk
    })
    res.on('end', () => {
      console.error('Error response:', errorData)
      process.exit(1)
    })
    return
  }

  console.log('📥 [CLI TEST] Reading response stream...\n')
  console.log('📝 [CLI TEST] Response content:')
  console.log('─'.repeat(50))

  let fullResponse = ''
  res.setEncoding('utf8')

  res.on('data', (chunk) => {
    fullResponse += chunk
    process.stdout.write(chunk)
  })

  res.on('end', () => {
    console.log('\n' + '─'.repeat(50))
    console.log('')
    console.log('✅ [CLI TEST] Test completed!')
    console.log(`📊 [CLI TEST] Response length: ${fullResponse.length} characters`)

    if (fullResponse.length === 0) {
      console.warn('⚠️ [CLI TEST] Warning: Empty response received')
    }
  })
})

req.on('error', (e) => {
  console.error(`❌ [CLI TEST] Request error: ${e.message}`)
  console.log('💡 [CLI TEST] Make sure your Next.js dev server is running on port', PORT)
  process.exit(1)
})

// Write data to request body
req.write(postData)
req.end()
