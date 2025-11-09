// Temporary route at /api/chat to match default transport behavior
// This will help us debug why the transport isn't using the configured endpoint
import { streamText } from 'ai'
import { createOpenRouter } from '@openrouter/ai-sdk-provider'
import { createServerClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'

// Route segment config
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 30

// Initialize OpenRouter provider
const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
})

// Log API key status (without exposing the key)
if (!process.env.OPENROUTER_API_KEY) {
  console.error('❌ [API] OPENROUTER_API_KEY is not set in environment variables!')
} else {
  console.log('✅ [API] OPENROUTER_API_KEY is set (length:', process.env.OPENROUTER_API_KEY.length, ')')
}

export async function POST(req: NextRequest) {
  try {
    console.log('🚀 [API ROUTE /api/chat] ===== POST REQUEST RECEIVED =====')
    console.log('🚀 [API ROUTE /api/chat] Request URL:', req.url)
    console.log('🚀 [API ROUTE /api/chat] Request method:', req.method)
    
    // Verify authentication
    const supabase = await createServerClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error('API: Unauthorized request', { authError, hasUser: !!user })
      return new Response('Unauthorized', { status: 401 })
    }

    console.log('API: User authenticated:', user.id)

    // Parse request body
    const body = await req.json()
    const { messages } = body

    console.log('API: Received messages:', {
      count: messages?.length || 0,
      messages: messages?.map((m: any) => ({
        role: m.role,
        contentLength: m.content?.length || 0,
      })),
    })

    if (!messages || !Array.isArray(messages)) {
      console.error('API: Invalid request - messages array required')
      return new Response('Invalid request: messages array required', { status: 400 })
    }

    // Stream response from OpenRouter
    console.log('🤖 [API] Calling OpenRouter with model: gpt-4o-mini')
    console.log('🤖 [API] Messages being sent:', JSON.stringify(messages.map((m: any) => ({
      role: m.role,
      contentLength: m.content?.length || 0,
    })), null, 2))
    
    try {
      const result = await streamText({
        model: openrouter('gpt-4o-mini'),
        messages,
        maxOutputTokens: 1000,
      })

      console.log('✅ [API] Stream created successfully')
      console.log('✅ [API] Returning toTextStreamResponse()')
      
      // Log stream info if available
      if ((result as any).textStream) {
        console.log('✅ [API] Stream has textStream property')
      }
      
      const response = result.toTextStreamResponse()
      console.log('✅ [API] Response object created')
      console.log('✅ [API] Response headers:', Object.fromEntries(response.headers.entries()))
      
      return response
    } catch (streamError) {
      console.error('❌ [API] Error creating stream:', streamError)
      if (streamError instanceof Error) {
        console.error('❌ [API] Stream error message:', streamError.message)
        console.error('❌ [API] Stream error stack:', streamError.stack)
      }
      throw streamError
    }
  } catch (error) {
    console.error('❌ [API ROUTE /api/chat] ===== ERROR =====')
    console.error('❌ [API ROUTE /api/chat] Error:', error)
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

