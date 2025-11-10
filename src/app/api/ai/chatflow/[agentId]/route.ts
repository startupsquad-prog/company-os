import { NextRequest } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { streamText } from 'ai'
import { createOpenRouter } from '@openrouter/ai-sdk-provider'

// Route segment config
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 30

// Initialize OpenRouter provider
const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
})

// Log API key status on startup
if (!process.env.OPENROUTER_API_KEY) {
  console.error('❌ [Chatflow API] OPENROUTER_API_KEY is not set')
} else {
  console.log('✅ [Chatflow API] OPENROUTER_API_KEY is set')
}

/**
 * AI Chatflow API Route - Agent-Specific Context
 *
 * This endpoint provides isolated chat context per agent.
 * - Authenticates users via Supabase
 * - Streams AI responses in real-time
 * - Uses agent-specific system prompts and settings
 */
export async function POST(req: NextRequest, { params }: { params: { agentId: string } }) {
  const startTime = Date.now()
  const agentId = params.agentId

  console.log('🚀 [Chatflow API] POST request for agent:', agentId)

  try {
    // Verify authentication
    const { getClerkUserId } = await import('@/lib/auth/clerk')
    const userId = await getClerkUserId()

    if (!userId) {
      console.error('❌ [Chatflow API] Unauthorized request')
      return new Response('Unauthorized', { status: 401 })
    }

    console.log('✅ [Chatflow API] User authenticated:', userId)

    // Parse request body
    const body = await req.json()
    const { messages } = body

    if (!messages || !Array.isArray(messages)) {
      console.error('❌ [Chatflow API] Invalid request - messages array required')
      return new Response('Invalid request: messages array required', { status: 400 })
    }

    // Check OpenRouter API key
    if (!process.env.OPENROUTER_API_KEY) {
      console.error('❌ [Chatflow API] OPENROUTER_API_KEY is not configured')
      return new Response(JSON.stringify({ error: 'OpenRouter API key is not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Convert messages from UI format (with parts) to model format (with content)
    const modelMessages = messages.map((m: any) => {
      let content = ''

      // Handle new AI SDK v5 format with parts array
      if (m.parts && Array.isArray(m.parts)) {
        content = m.parts
          .map((part: any) => {
            if (part.type === 'text' && part.text) return part.text
            if (typeof part === 'string') return part
            return part.text || part.content || ''
          })
          .filter(Boolean)
          .join('')
      }
      // Handle legacy format with content string
      else if (typeof m.content === 'string') {
        content = m.content
      }
      // Handle array format
      else if (Array.isArray(m.content)) {
        content = m.content
          .map((part: any) => (typeof part === 'string' ? part : part.text || part.content || ''))
          .filter(Boolean)
          .join('')
      }
      // Fallback
      else {
        content = String(m.content || '')
      }

      return {
        role: m.role,
        content: content,
      }
    })

    // Fetch the specific agent
    const { data: agentData, error: agentError } = await supabase
      .schema('core')
      .from('ai_agents')
      .select('*')
      .eq('id', agentId)
      .eq('is_active', true)
      .is('deleted_at', null)
      .single()

    type Agent = {
      name: string
      system_prompt: string
      model?: string | null
      max_tokens?: number | null
      temperature?: number | null
    }

    const agent = agentData as Agent | null

    if (agentError || !agent) {
      console.error('❌ [Chatflow API] Agent not found:', agentId, agentError?.message)
      return new Response(JSON.stringify({ error: 'Agent not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    console.log('✅ [Chatflow API] Using agent:', agent.name)

    // Prepare messages with system prompt
    const finalMessages = agent?.system_prompt
      ? [{ role: 'system' as const, content: agent.system_prompt }, ...modelMessages]
      : modelMessages

    // Determine model and settings from agent or use defaults
    const modelName = agent?.model || 'openai/chatgpt-4o-latest'
    const maxTokens = agent?.max_tokens || 2000
    const temperature = agent?.temperature ?? 0.7

    // Stream AI response using Vercel AI SDK
    console.log('🤖 [Chatflow API] Calling OpenRouter with model:', modelName)

    const result = await streamText({
      model: openrouter(modelName),
      messages: finalMessages,
      maxOutputTokens: maxTokens,
      temperature: temperature,
    })

    console.log('✅ [Chatflow API] Stream created successfully')

    // Use toUIMessageStreamResponse() for DefaultChatTransport compatibility
    const response = result.toUIMessageStreamResponse()

    const duration = Date.now() - startTime
    console.log(`✅ [Chatflow API] Response created in ${duration}ms`)

    return response
  } catch (error) {
    const duration = Date.now() - startTime
    console.error('❌ [Chatflow API] Error after', duration, 'ms')
    console.error('❌ [Chatflow API] Error:', error)

    return new Response(
      JSON.stringify({
        error: 'Failed to process chat request',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
}
