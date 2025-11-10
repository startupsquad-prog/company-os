import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { getClerkUserId } from '@/lib/auth/clerk'

export const runtime = 'nodejs'

/**
 * GET /api/ai/agents
 * Get all active AI agents or a specific agent by ID
 * Query params:
 *   - agentId: Optional, to fetch a specific agent
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication using Clerk
    const userId = await getClerkUserId()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const agentId = searchParams.get('agentId')

    // Create Supabase client for querying
    const supabase = await createServerClient()

    // Query ai_agents view in public schema (which exposes core.ai_agents)
    const baseQuery = supabase
      .from('ai_agents')
      .select('*')
      .eq('is_active', true)
      .is('deleted_at', null)

    // If agentId is provided, fetch specific agent
    if (agentId) {
      const { data, error } = await baseQuery.eq('id', agentId).single()

      if (error) {
        console.error('❌ [API/Agents] Error fetching agent:', error)
        return NextResponse.json(
          { error: error.message || 'Failed to fetch agent' },
          { status: 500 }
        )
      }

      if (!data) {
        return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
      }

      return NextResponse.json({ data }, { status: 200 })
    }

    // Otherwise, fetch all active agents
    const { data, error } = await baseQuery.order('created_at', { ascending: true })

    if (error) {
      console.error('❌ [API/Agents] Error fetching agents:', error)
      return NextResponse.json(
        { error: error.message || 'Failed to fetch agents' },
        { status: 500 }
      )
    }

    return NextResponse.json({ data: data || [] }, { status: 200 })
  } catch (error) {
    console.error('❌ [API/Agents] Exception:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch agents' },
      { status: 500 }
    )
  }
}
