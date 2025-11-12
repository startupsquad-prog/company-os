import { NextRequest, NextResponse } from 'next/server'
import { getTicketSolution, updateTicketSolution, deleteTicketSolution } from '@/lib/db/tickets-drizzle'

/**
 * GET /api/unified/tickets/solutions/[solutionId]
 * Get a single solution by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ solutionId: string }> }
) {
  try {
    const { solutionId } = await params
    const solution = await getTicketSolution(solutionId)

    if (!solution) {
      return NextResponse.json({ error: 'Solution not found' }, { status: 404 })
    }

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

    return NextResponse.json({ data: transformedSolution })
  } catch (error: any) {
    console.error('[API] Error in GET /api/unified/tickets/solutions/[solutionId]:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch solution' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/unified/tickets/solutions/[solutionId]
 * Update a solution
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ solutionId: string }> }
) {
  try {
    const { solutionId } = await params
    const body = await request.json()

    const updates: {
      title?: string
      description?: string | null
      checklistItems?: any[]
      isActive?: boolean
    } = {}

    if (body.title !== undefined) {
      updates.title = body.title.trim()
    }
    if (body.description !== undefined) {
      updates.description = body.description || null
    }
    if (body.checklist_items !== undefined) {
      updates.checklistItems = body.checklist_items || []
    }
    if (body.is_active !== undefined) {
      updates.isActive = body.is_active
    }

    const solution = await updateTicketSolution(solutionId, updates)

    if (!solution) {
      return NextResponse.json({ error: 'Solution not found' }, { status: 404 })
    }

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

    return NextResponse.json({ data: transformedSolution })
  } catch (error: any) {
    console.error('[API] Error in PATCH /api/unified/tickets/solutions/[solutionId]:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update solution' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/unified/tickets/solutions/[solutionId]
 * Delete a solution (soft delete)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ solutionId: string }> }
) {
  try {
    const { solutionId } = await params
    const solution = await deleteTicketSolution(solutionId)

    if (!solution) {
      return NextResponse.json({ error: 'Solution not found' }, { status: 404 })
    }

    return NextResponse.json({ message: 'Solution deleted successfully' })
  } catch (error: any) {
    console.error('[API] Error in DELETE /api/unified/tickets/solutions/[solutionId]:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete solution' },
      { status: 500 }
    )
  }
}

