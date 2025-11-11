import { NextRequest, NextResponse } from 'next/server'
import { getTicketComments, createTicketComment, getProfileIdFromClerkUserId } from '@/lib/db/tickets-drizzle'
import { getClerkUserId } from '@/lib/auth/clerk'

/**
 * GET /api/unified/tickets/[id]/comments
 * Get comments for a ticket using Drizzle ORM
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const comments = await getTicketComments(id)

    // Transform to snake_case
    const transformedComments = comments.map((comment: any) => ({
      id: comment.id,
      ticket_id: comment.ticketId,
      author_id: comment.authorId,
      body: comment.content, // Note: schema uses 'content', API uses 'body'
      is_internal: comment.isInternal,
      attachments: comment.attachments,
      created_at: comment.createdAt,
      updated_at: comment.updatedAt,
      deleted_at: comment.deletedAt,
      author: comment.author ? {
        id: comment.author.id,
        first_name: comment.author.firstName,
        last_name: comment.author.lastName,
        email: comment.author.email,
        avatar_url: comment.author.avatarUrl,
      } : null,
    }))

    return NextResponse.json({ data: transformedComments })
  } catch (error: any) {
    console.error('[API] Error in GET /api/unified/tickets/[id]/comments:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch comments' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/unified/tickets/[id]/comments
 * Create a comment for a ticket using Drizzle ORM
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Auth check temporarily removed for testing
    // const userId = await getClerkUserId()
    // if (!userId) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }

    const { id } = await params
    // Read body first
    const body = await request.json()

    // For testing, use a dummy profile ID or get from request
    // TODO: Re-enable auth check after testing
    let profileId: string | null = null
    try {
      const userId = await getClerkUserId()
      if (userId) {
        profileId = await getProfileIdFromClerkUserId(userId)
      }
    } catch (error) {
      console.warn('[API] Auth check failed, continuing without auth for testing')
    }

    // If no profile found, try to get from request body or use a fallback
    if (!profileId) {
      profileId = body.author_id || null
      if (!profileId) {
        // Try to get first profile as fallback for testing
        const { postgresClientRaw } = await import('@/db/connections')
        const profiles = await postgresClientRaw`SELECT id FROM core.profiles WHERE deleted_at IS NULL LIMIT 1`
        profileId = profiles[0]?.id || null
        if (!profileId) {
          return NextResponse.json({ error: 'Profile not found. Please ensure you are logged in.' }, { status: 404 })
        }
      }
    }

    const comment = await createTicketComment(
      id,
      body.body || body.content,
      profileId!
    )

    // Transform to snake_case
    const transformedComment = {
      id: comment.id,
      ticket_id: comment.ticketId,
      author_id: comment.authorId,
      body: comment.content,
      is_internal: comment.isInternal,
      attachments: comment.attachments,
      created_at: comment.createdAt,
      updated_at: comment.updatedAt,
    }

    return NextResponse.json({ data: transformedComment }, { status: 201 })
  } catch (error: any) {
    console.error('[API] Error in POST /api/unified/tickets/[id]/comments:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create comment' },
      { status: 500 }
    )
  }
}

