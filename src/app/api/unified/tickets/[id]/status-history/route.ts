import { NextRequest, NextResponse } from 'next/server'
import { getTicketStatusHistory } from '@/lib/db/tickets-drizzle'

/**
 * GET /api/unified/tickets/[id]/status-history
 * Get status history for a ticket using Drizzle ORM
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const history = await getTicketStatusHistory(id)

    // Transform to snake_case
    const transformedHistory = history.map((entry: any) => ({
      id: entry.id,
      ticket_id: entry.ticketId,
      status: entry.status,
      previous_status: entry.previousStatus,
      notes: entry.notes,
      created_at: entry.createdAt,
      created_by: entry.createdBy,
      created_by_profile: entry.created_by_profile ? {
        id: entry.created_by_profile.id,
        first_name: entry.created_by_profile.firstName,
        last_name: entry.created_by_profile.lastName,
        email: entry.created_by_profile.email,
        avatar_url: entry.created_by_profile.avatarUrl,
      } : null,
    }))

    return NextResponse.json({ data: transformedHistory })
  } catch (error: any) {
    console.error('[API] Error in GET /api/unified/tickets/[id]/status-history:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch status history' },
      { status: 500 }
    )
  }
}

