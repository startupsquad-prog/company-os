/**
 * Test script to verify Trigger.dev task is working
 *
 * Run: npx tsx scripts/test-trigger-dev-task.ts
 */

import { tasks } from '@trigger.dev/sdk/v3'

async function testTask() {
  console.log('🧪 Testing Trigger.dev task...')

  try {
    const handle = await tasks.trigger('ai-chat-agent', {
      userId: 'test-user-123',
      messages: [
        {
          role: 'user',
          content: 'Hello, this is a test message',
        },
      ],
      sessionId: 'test-session-' + Date.now(),
    })

    console.log('✅ Task triggered successfully!')
    console.log('Run ID:', handle.id)
    console.log('\n📊 Check the Trigger.dev dashboard:')
    console.log('https://cloud.trigger.dev/projects/v3/proj_oqmifvryosgmasgpkyqi/runs')
    console.log('\n⚠️  Make sure Trigger.dev dev server is running:')
    console.log('   npm run dev:trigger')
  } catch (error) {
    console.error('❌ Failed to trigger task:', error)
    if (error instanceof Error) {
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
    }
  }
}

testTask()
