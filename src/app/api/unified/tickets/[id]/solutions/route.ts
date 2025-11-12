import { NextRequest, NextResponse } from 'next/server'
import { getTicketSolutions, createTicketSolution, getProfileIdFromClerkUserId } from '@/lib/db/tickets-drizzle'
import { getClerkUserId } from '@/lib/auth/clerk'

/**
 * GET /api/unified/tickets/[id]/solutions
 * Get solutions for a ticket using Drizzle ORM
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const solutions = await getTicketSolutions(id)

    // Transform to snake_case
    const transformedSolutions = solutions.map((solution: any) => ({
      id: solution.id,
      ticket_id: solution.ticketId,
      title: solution.title,
      description: solution.description,
      checklist_items: solution.checklistItems || [],
      is_active: solution.isActive,
      created_at: solution.createdAt,
      updated_at: solution.updatedAt,
      created_by: solution.createdBy,
      deleted_at: solution.deletedAt,
    }))

    return NextResponse.json({ data: transformedSolutions })
  } catch (error: any) {
    console.error('[API] Error in GET /api/unified/tickets/[id]/solutions:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch solutions' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/unified/tickets/[id]/solutions
 * Create a solution for a ticket using Drizzle ORM
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    if (!body.title || typeof body.title !== 'string' || body.title.trim().length === 0) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    // Get profile ID
    let profileId: string | null = null
    try {
      const userId = await getClerkUserId()
      if (userId) {
        profileId = await getProfileIdFromClerkUserId(userId)
      }
    } catch (error) {
      console.warn('[API] Auth check failed, continuing without auth for testing')
    }

    const solution = await createTicketSolution(
      id,
      body.title.trim(),
      body.description || null,
      body.checklist_items || [],
      profileId
    )

    // Transform to snake_case
    const transformedSolution = {
      id: solution.id,
      ticket_id: solution.ticketId,
      title: solution.title,
      description: solution.description,
      checklist_items: solution.checklistItems || [],
      is_active: solution.isActive,
      created_at: solution.createdAt,
      updated_at: solution.updatedAt,
      created_by: solution.createdBy,
    }

    return NextResponse.json({ data: transformedSolution }, { status: 201 })
  } catch (error: any) {
    console.error('[API] Error in POST /api/unified/tickets/[id]/solutions:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create solution' },
      { status: 500 }
    )
  }
}

