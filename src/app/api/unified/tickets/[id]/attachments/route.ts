import { NextRequest, NextResponse } from 'next/server'
import { dbAdmin } from '@/db/connections'
import { ticketCommentsInCommonUtil } from '@/db/schema/common_util'
import { eq, isNull, and } from 'drizzle-orm'

/**
 * GET /api/unified/tickets/[id]/attachments
 * Get attachments for a ticket
 * 
 * Note: Ticket attachments are stored in ticket_comments.attachments (JSONB array)
 * This endpoint aggregates all attachments from all comments for the ticket
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    // Fetch all comments for this ticket
    const comments = await dbAdmin
      .select({
        id: ticketCommentsInCommonUtil.id,
        attachments: ticketCommentsInCommonUtil.attachments,
        createdAt: ticketCommentsInCommonUtil.createdAt,
      })
      .from(ticketCommentsInCommonUtil)
      .where(
        and(
          eq(ticketCommentsInCommonUtil.ticketId, id),
          isNull(ticketCommentsInCommonUtil.deletedAt)
        )
      )

    // Aggregate attachments from all comments
    const allAttachments: any[] = []
    comments.forEach((comment) => {
      if (comment.attachments && Array.isArray(comment.attachments)) {
        comment.attachments.forEach((att: any) => {
          allAttachments.push({
            ...att,
            comment_id: comment.id,
            created_at: comment.createdAt,
          })
        })
      }
    })

    // Sort by created_at descending
    allAttachments.sort((a, b) => {
      const dateA = new Date(a.created_at || 0).getTime()
      const dateB = new Date(b.created_at || 0).getTime()
      return dateB - dateA
    })

    return NextResponse.json({ 
      data: allAttachments
    })
  } catch (error: any) {
    console.error('[API] Error in GET /api/unified/tickets/[id]/attachments:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch attachments' },
      { status: 500 }
    )
  }
}

