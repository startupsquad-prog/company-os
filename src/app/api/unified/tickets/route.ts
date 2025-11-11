import { NextRequest, NextResponse } from 'next/server'
import { getTickets, createTicket, updateTicket, deleteTicket } from '@/lib/db/tickets-drizzle'
import { getClerkUserId } from '@/lib/auth/clerk'

/**
 * GET /api/unified/tickets
 * Fetch tickets with filters, pagination, and sorting using Drizzle ORM
 * NOTE: Auth validation temporarily removed for testing
 */
export async function GET(request: NextRequest) {
  try {
    console.log('[API] GET /api/unified/tickets - Starting request')
    const searchParams = request.nextUrl.searchParams

    // Parse query parameters
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '10')
    const search = searchParams.get('search') || ''
    const view = searchParams.get('view') || 'table' // 'table' | 'kanban'

    // Build filters
    const filters: {
      status?: string[]
      priority?: string[]
      search?: string
    } = {}

    const statusFilter = searchParams.get('status')
    if (statusFilter) {
      filters.status = statusFilter.split(',')
    }

    const priorityFilter = searchParams.get('priority')
    if (priorityFilter) {
      filters.priority = priorityFilter.split(',')
    }

    if (search) {
      filters.search = search
    }

    // Parse sorting
    const sortField = searchParams.get('sortField') || 'created_at'
    const sortDirection = searchParams.get('sortDirection') || 'desc'

    // Fetch tickets using Drizzle
    console.log('[API] Fetching tickets with Drizzle:', { filters, sortField, sortDirection, page, pageSize, view })
    const result = await getTickets(
      filters,
      { field: sortField, direction: sortDirection as 'asc' | 'desc' },
      page,
      pageSize,
      view as 'table' | 'kanban'
    )
    console.log('[API] Drizzle query result:', { ticketCount: result.tickets.length, total: result.total })

    // Transform data to match expected format (snake_case to camelCase)
    const transformedTickets = result.tickets.map((ticket: any) => ({
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
    }))

    return NextResponse.json({
      data: transformedTickets,
      count: result.total,
      page: result.page,
      pageSize: result.pageSize,
      totalPages: result.totalPages,
    })
  } catch (error: any) {
    console.error('[API] Error in GET /api/unified/tickets:', {
      message: error.message,
      stack: error.stack,
    })
    return NextResponse.json(
      { error: error.message || 'Failed to fetch tickets' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/unified/tickets
 * Create a new ticket using Drizzle ORM
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await getClerkUserId()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    const ticket = await createTicket({
      title: body.title,
      description: body.description,
      client_id: body.client_id,
      client_email: body.client_email,
      client_name: body.client_name,
      status: body.status || 'new',
      priority: body.priority || 'medium',
      category: body.category,
      assignee_id: body.assignee_id,
      due_date: body.due_date,
    })

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

    return NextResponse.json({ data: transformedTicket }, { status: 201 })
  } catch (error: any) {
    console.error('[API] Error in POST /api/unified/tickets:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create ticket' },
      { status: 500 }
    )
  }
}



