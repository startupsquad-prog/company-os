import { NextRequest, NextResponse } from 'next/server'
import { getTicketById, updateTicket, deleteTicket } from '@/lib/db/tickets-drizzle'
import { getClerkUserId } from '@/lib/auth/clerk'

/**
 * GET /api/unified/tickets/[id]
 * Get a single ticket by ID using Drizzle ORM
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const ticket = await getTicketById(id)

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    // Transform to snake_case
    const transformedTicket = {
      id: ticket.id,
      ticket_number: ticket.ticketNumber,
      title: ticket.title,
      description: ticket.description,
      client_id: ticket.clientId,
      client_email: ticket.clientEmail,
      client_name: ticket.clientName,
      status: ticket.status,
      priority: ticket.priority,
      category: ticket.category,
      assignee_id: ticket.assigneeId,
      due_date: ticket.dueDate,
      resolution: ticket.resolution,
      resolved_at: ticket.resolvedAt,
      resolved_by: ticket.resolvedBy,
      meta: ticket.meta,
      created_at: ticket.createdAt,
      updated_at: ticket.updatedAt,
      created_by: ticket.createdBy,
      deleted_at: ticket.deletedAt,
      client: ticket.client ? {
        id: ticket.client.id,
        name: ticket.client.name,
        email: ticket.client.email,
      } : null,
      assignee: ticket.assignee ? {
        id: ticket.assignee.id,
        first_name: ticket.assignee.firstName,
        last_name: ticket.assignee.lastName,
        email: ticket.assignee.email,
        avatar_url: ticket.assignee.avatarUrl,
      } : null,
    }

    return NextResponse.json({ data: transformedTicket })
  } catch (error: any) {
    console.error('[API] Error in GET /api/unified/tickets/[id]:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch ticket' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/unified/tickets/[id]
 * Update a ticket using Drizzle ORM
 */
export async function PATCH(
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
    const body = await request.json()

    // Only include fields that are explicitly provided (not undefined)
    const updateData: any = {}
    if (body.title !== undefined) updateData.title = body.title
    if (body.description !== undefined) updateData.description = body.description === '' ? null : body.description
    if (body.client_id !== undefined) updateData.client_id = body.client_id === '' || body.client_id === '__none__' ? null : body.client_id
    if (body.client_email !== undefined) updateData.client_email = body.client_email === '' ? null : body.client_email
    if (body.client_name !== undefined) updateData.client_name = body.client_name === '' ? null : body.client_name
    if (body.status !== undefined) updateData.status = body.status
    if (body.priority !== undefined) updateData.priority = body.priority
    if (body.category !== undefined) updateData.category = body.category === '' ? null : body.category
    if (body.assignee_id !== undefined) updateData.assignee_id = body.assignee_id === '' || body.assignee_id === '__unassigned__' ? null : body.assignee_id
    if (body.due_date !== undefined) updateData.due_date = body.due_date === '' ? null : body.due_date
    // Note: is_starred is not in the schema, skipping

    const ticket = await updateTicket(id, updateData)

    // Transform to snake_case
    const transformedTicket = {
      id: ticket.id,
      ticket_number: ticket.ticketNumber,
      title: ticket.title,
      description: ticket.description,
      client_id: ticket.clientId,
      client_email: ticket.clientEmail,
      client_name: ticket.clientName,
      status: ticket.status,
      priority: ticket.priority,
      category: ticket.category,
      assignee_id: ticket.assigneeId,
      due_date: ticket.dueDate,
      created_at: ticket.createdAt,
      updated_at: ticket.updatedAt,
      created_by: ticket.createdBy,
    }

    return NextResponse.json({ data: transformedTicket })
  } catch (error: any) {
    console.error('[API] Error in PATCH /api/unified/tickets/[id]:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update ticket' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/unified/tickets/[id]
 * Delete a ticket (soft delete) using Drizzle ORM
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const userId = await getClerkUserId()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await deleteTicket(id)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[API] Error in DELETE /api/unified/tickets/[id]:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete ticket' },
      { status: 500 }
    )
  }
}

