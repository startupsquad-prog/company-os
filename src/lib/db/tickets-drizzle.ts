/**
 * Tickets Database Queries using Drizzle ORM
 * 
 * This module provides Drizzle-based queries for ticket operations.
 * Replaces Supabase client usage with Drizzle ORM.
 */

import { dbAdmin, postgresClientRaw } from '@/db/connections'
import { ticketsInCommonUtil, ticketCommentsInCommonUtil, ticketStatusHistoryInCommonUtil, ticketAssignmentsInCommonUtil, ticketSolutionsInCommonUtil } from '@/db/schema/common_util'
import { profilesInCore, contactsInCore } from '@/db/schema/core'
import { eq, and, or, isNull, inArray, desc, asc, ilike, sql, count } from 'drizzle-orm'
import { getClerkUserId } from '@/lib/auth/clerk'

export interface TicketFilters {
  status?: string[]
  priority?: string[]
  search?: string
}

export interface TicketSort {
  field: string
  direction: 'asc' | 'desc'
}

/**
 * Get current user's profile ID using Clerk user ID
 */
async function getCurrentProfileId(): Promise<string | null> {
  const userId = await getClerkUserId()
  if (!userId) {
    return null
  }

  const [profile] = await dbAdmin
    .select({ id: profilesInCore.id })
    .from(profilesInCore)
    .where(and(eq(profilesInCore.userId, userId), isNull(profilesInCore.deletedAt)))
    .limit(1)

  return profile?.id || null
}

/**
 * Get profile ID from Clerk user ID (for use in API routes)
 */
export async function getProfileIdFromClerkUserId(clerkUserId: string): Promise<string | null> {
  const [profile] = await dbAdmin
    .select({ id: profilesInCore.id })
    .from(profilesInCore)
    .where(and(eq(profilesInCore.userId, clerkUserId), isNull(profilesInCore.deletedAt)))
    .limit(1)

  return profile?.id || null
}

/**
 * Get tickets with filters, pagination, and sorting
 */
export async function getTickets(
  filters: TicketFilters = {},
  sort: TicketSort = { field: 'createdAt', direction: 'desc' },
  page: number = 1,
  pageSize: number = 10,
  view: 'table' | 'kanban' = 'table'
) {
  try {
    const conditions = [isNull(ticketsInCommonUtil.deletedAt)]

    // Apply status filter
    if (filters.status && filters.status.length > 0) {
      conditions.push(inArray(ticketsInCommonUtil.status, filters.status))
    }

    // Apply priority filter
    if (filters.priority && filters.priority.length > 0) {
      conditions.push(inArray(ticketsInCommonUtil.priority, filters.priority))
    }

    // Apply search filter
    if (filters.search) {
      const searchTerm = `%${filters.search}%`
      conditions.push(
        or(
          ilike(ticketsInCommonUtil.ticketNumber, searchTerm),
          ilike(ticketsInCommonUtil.title, searchTerm),
          ilike(ticketsInCommonUtil.description || sql`''`, searchTerm),
          ilike(ticketsInCommonUtil.clientName || sql`''`, searchTerm)
        )!
      )
    }

    // Get total count using raw SQL (Drizzle query builder has issues with schemas)
    // Build WHERE clause dynamically
    let whereClause = 'deleted_at IS NULL'
    const queryParams: any[] = []
    
    if (filters.status && filters.status.length > 0) {
      whereClause += ` AND status = ANY($${queryParams.length + 1}::text[])`
      queryParams.push(filters.status)
    }
    if (filters.priority && filters.priority.length > 0) {
      whereClause += ` AND priority = ANY($${queryParams.length + 1}::text[])`
      queryParams.push(filters.priority)
    }
    if (filters.search) {
      const searchTerm = `%${filters.search}%`
      whereClause += ` AND (ticket_number ILIKE $${queryParams.length + 1} OR title ILIKE $${queryParams.length + 2} OR description ILIKE $${queryParams.length + 3} OR client_name ILIKE $${queryParams.length + 4})`
      queryParams.push(searchTerm, searchTerm, searchTerm, searchTerm)
    }
    
    // Use postgres client with unsafe for dynamic queries
    const countQuery = `SELECT COUNT(*) as count FROM common_util.tickets WHERE ${whereClause}`
    const countResult = await postgresClientRaw.unsafe(countQuery, queryParams)
    const totalCount = parseInt(countResult[0]?.count || '0')

    // Build query using raw SQL (Drizzle query builder has issues with schemas)
    // Reuse the same WHERE clause and params from count query
    const sortFieldMap: Record<string, string> = {
      'created_at': 'created_at',
      'createdAt': 'created_at',
      'updated_at': 'updated_at',
      'updatedAt': 'updated_at',
      'ticket_number': 'ticket_number',
      'ticketNumber': 'ticket_number',
      'due_date': 'due_date',
      'dueDate': 'due_date',
      'status': 'status',
      'priority': 'priority',
      'title': 'title',
    }
    const dbSortField = sortFieldMap[sort.field] || 'created_at'
    
    let selectQuery = `
      SELECT 
        id, ticket_number, title, description, client_id, client_email, client_name,
        status, priority, category, assignee_id, due_date, resolution, resolved_at, resolved_by,
        meta, created_at, updated_at, created_by, deleted_at
      FROM common_util.tickets
      WHERE ${whereClause}
      ORDER BY ${dbSortField} ${sort.direction.toUpperCase()}
    `
    
    // Apply pagination (skip for kanban view)
    if (view !== 'kanban') {
      const offset = (page - 1) * pageSize
      selectQuery += ` LIMIT ${pageSize} OFFSET ${offset}`
    }
    
    // Use postgres client directly for raw queries
    const ticketsResult = await postgresClientRaw.unsafe(selectQuery, queryParams)
    const tickets = ticketsResult.map((row: any) => ({
      id: row.id,
      ticketNumber: row.ticket_number,
      title: row.title,
      description: row.description,
      clientId: row.client_id,
      clientEmail: row.client_email,
      clientName: row.client_name,
      status: row.status,
      priority: row.priority,
      category: row.category,
      assigneeId: row.assignee_id,
      dueDate: row.due_date,
      resolution: row.resolution,
      resolvedAt: row.resolved_at,
      resolvedBy: row.resolved_by,
      meta: row.meta,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      createdBy: row.created_by,
      deletedAt: row.deleted_at,
    }))

    // Fetch related data separately
    const clientIds = [...new Set(tickets.map((t) => t.clientId).filter(Boolean) as string[])]
    const assigneeIds = [...new Set(tickets.map((t) => t.assigneeId).filter(Boolean) as string[])]

    // Fetch contacts (clients)
    const contacts = clientIds.length > 0
      ? await dbAdmin
          .select({
            id: contactsInCore.id,
            name: contactsInCore.name,
            email: contactsInCore.email,
          })
          .from(contactsInCore)
          .where(and(inArray(contactsInCore.id, clientIds), isNull(contactsInCore.deletedAt)))
      : []

    // Fetch profiles (assignees)
    const profiles = assigneeIds.length > 0
      ? await dbAdmin
          .select({
            id: profilesInCore.id,
            firstName: profilesInCore.firstName,
            lastName: profilesInCore.lastName,
            email: profilesInCore.email,
            avatarUrl: profilesInCore.avatarUrl,
          })
          .from(profilesInCore)
          .where(and(inArray(profilesInCore.id, assigneeIds), isNull(profilesInCore.deletedAt)))
      : []

    // Create lookup maps
    const contactsMap = new Map(contacts.map((c) => [c.id, c]))
    const profilesMap = new Map(profiles.map((p) => [p.id, p]))

    // Combine tickets with relations
    const ticketsWithRelations = tickets.map((ticket) => ({
      ...ticket,
      client: ticket.clientId ? contactsMap.get(ticket.clientId) || null : null,
      assignee: ticket.assigneeId ? profilesMap.get(ticket.assigneeId) || null : null,
    }))

    return {
      tickets: ticketsWithRelations,
      total: totalCount || 0,
      page,
      pageSize,
      totalPages: Math.ceil((totalCount || 0) / pageSize),
    }
  } catch (error: any) {
    console.error('[Drizzle] Error in getTickets:', {
      message: error.message,
      stack: error.stack,
      filters,
      sort,
      page,
      pageSize,
    })
    throw error
  }
}

/**
 * Get ticket by ID with all relations
 */
export async function getTicketById(id: string) {
  // Use Drizzle query builder
  const [ticket] = await dbAdmin
    .select()
    .from(ticketsInCommonUtil)
    .where(and(eq(ticketsInCommonUtil.id, id), isNull(ticketsInCommonUtil.deletedAt)))
    .limit(1)

  if (!ticket) {
    return null
  }

  // Fetch related data using Drizzle
  const [contact] = ticket.clientId
    ? await dbAdmin
        .select({
          id: contactsInCore.id,
          name: contactsInCore.name,
          email: contactsInCore.email,
        })
        .from(contactsInCore)
        .where(and(eq(contactsInCore.id, ticket.clientId), isNull(contactsInCore.deletedAt)))
        .limit(1)
    : [null]

  const [assignee] = ticket.assigneeId
    ? await dbAdmin
        .select({
          id: profilesInCore.id,
          firstName: profilesInCore.firstName,
          lastName: profilesInCore.lastName,
          email: profilesInCore.email,
          avatarUrl: profilesInCore.avatarUrl,
        })
        .from(profilesInCore)
        .where(and(eq(profilesInCore.id, ticket.assigneeId), isNull(profilesInCore.deletedAt)))
        .limit(1)
    : [null]

  return {
    ...ticket,
    client: contact || null,
    assignee: assignee || null,
  }
}

/**
 * Create a new ticket
 */
export async function createTicket(data: {
  title: string
  description?: string
  client_id?: string
  client_email?: string
  client_name?: string
  status?: string
  priority?: string
  category?: string
  assignee_id?: string
  due_date?: string
  ticket_number?: string
}) {
  const userId = await getClerkUserId()
  if (!userId) {
    throw new Error('Unauthorized')
  }

  // Generate ticket number if not provided
  const ticketNumber = data.ticket_number || `TKT-${Date.now().toString().slice(-6)}`

  const [ticket] = await dbAdmin
    .insert(ticketsInCommonUtil)
    .values({
      ticketNumber,
      title: data.title,
      description: data.description || null,
      clientId: data.client_id || null,
      clientEmail: data.client_email || null,
      clientName: data.client_name || null,
      status: data.status || 'new',
      priority: data.priority || 'medium',
      category: data.category || null,
      assigneeId: data.assignee_id || null,
      dueDate: data.due_date || null,
      createdBy: userId,
    })
    .returning()

  return ticket
}

/**
 * Update a ticket
 * Uses raw SQL (Drizzle query builder has issues with schema prefixes)
 */
export async function updateTicket(id: string, data: {
  title?: string
  description?: string
  client_id?: string
  client_email?: string
  client_name?: string
  status?: string
  priority?: string
  category?: string
  assignee_id?: string
  due_date?: string
  is_starred?: boolean
}) {
  // Build update query using raw SQL
  const updateFields: string[] = []
  const updateParams: any[] = []
  let paramIndex = 1

  if (data.title !== undefined) {
    updateFields.push(`title = $${paramIndex}`)
    updateParams.push(data.title)
    paramIndex++
  }
  if (data.description !== undefined) {
    updateFields.push(`description = $${paramIndex}`)
    updateParams.push(data.description === '' ? null : data.description)
    paramIndex++
  }
  if (data.client_id !== undefined) {
    updateFields.push(`client_id = $${paramIndex}`)
    updateParams.push(data.client_id === '' || data.client_id === '__none__' ? null : data.client_id)
    paramIndex++
  }
  if (data.client_email !== undefined) {
    updateFields.push(`client_email = $${paramIndex}`)
    updateParams.push(data.client_email === '' ? null : data.client_email)
    paramIndex++
  }
  if (data.client_name !== undefined) {
    updateFields.push(`client_name = $${paramIndex}`)
    updateParams.push(data.client_name === '' ? null : data.client_name)
    paramIndex++
  }
  if (data.status !== undefined) {
    updateFields.push(`status = $${paramIndex}`)
    updateParams.push(data.status)
    paramIndex++
  }
  if (data.priority !== undefined) {
    updateFields.push(`priority = $${paramIndex}`)
    updateParams.push(data.priority)
    paramIndex++
  }
  if (data.category !== undefined) {
    updateFields.push(`category = $${paramIndex}`)
    updateParams.push(data.category === '' ? null : data.category)
    paramIndex++
  }
  if (data.assignee_id !== undefined) {
    updateFields.push(`assignee_id = $${paramIndex}`)
    updateParams.push(data.assignee_id === '' || data.assignee_id === '__unassigned__' ? null : data.assignee_id)
    paramIndex++
  }
  if (data.due_date !== undefined) {
    updateFields.push(`due_date = $${paramIndex}`)
    updateParams.push(data.due_date === '' ? null : data.due_date)
    paramIndex++
  }
  // Note: tickets table doesn't have is_starred field, skipping

  // Always update updated_at
  updateFields.push(`updated_at = $${paramIndex}`)
  updateParams.push(new Date().toISOString())
  paramIndex++

  // Validate we have at least one field to update
  if (updateFields.length === 0) {
    throw new Error('No fields to update')
  }

  // Add id parameter
  updateParams.push(id)

  // Final safety check: filter out any undefined values (convert to null)
  const safeParams = updateParams.map((param) => (param === undefined ? null : param))

  const updateQuery = `
    UPDATE common_util.tickets 
    SET ${updateFields.join(', ')}
    WHERE id = $${paramIndex} AND deleted_at IS NULL
    RETURNING *
  `

  const result = await postgresClientRaw.unsafe(updateQuery, safeParams)
  if (result.length === 0) {
    throw new Error('Ticket not found')
  }

  const row = result[0]
  return {
    id: row.id,
    ticketNumber: row.ticket_number,
    title: row.title,
    description: row.description,
    clientId: row.client_id,
    clientEmail: row.client_email,
    clientName: row.client_name,
    status: row.status,
    priority: row.priority,
    category: row.category,
    assigneeId: row.assignee_id,
    dueDate: row.due_date,
    resolution: row.resolution,
    resolvedAt: row.resolved_at,
    resolvedBy: row.resolved_by,
    meta: row.meta,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    createdBy: row.created_by,
    deletedAt: row.deleted_at,
  }
}

/**
 * Delete a ticket (soft delete)
 */
export async function deleteTicket(id: string) {
  const [ticket] = await dbAdmin
    .update(ticketsInCommonUtil)
    .set({ deletedAt: new Date().toISOString() })
    .where(eq(ticketsInCommonUtil.id, id))
    .returning()

  return ticket
}

/**
 * Get ticket comments
 */
export async function getTicketComments(ticketId: string) {
  // Use Drizzle query builder
  const comments = await dbAdmin
    .select()
    .from(ticketCommentsInCommonUtil)
    .where(and(eq(ticketCommentsInCommonUtil.ticketId, ticketId), isNull(ticketCommentsInCommonUtil.deletedAt)))
    .orderBy(desc(ticketCommentsInCommonUtil.createdAt))

  // Fetch authors using Drizzle
  const authorIds = [...new Set(comments.map((c) => c.authorId).filter(Boolean) as string[])]
  const authors = authorIds.length > 0
    ? await dbAdmin
        .select({
          id: profilesInCore.id,
          firstName: profilesInCore.firstName,
          lastName: profilesInCore.lastName,
          email: profilesInCore.email,
          avatarUrl: profilesInCore.avatarUrl,
        })
        .from(profilesInCore)
        .where(and(inArray(profilesInCore.id, authorIds), isNull(profilesInCore.deletedAt)))
    : []

  const authorsMap = new Map(authors.map((a) => [a.id, a]))

  return comments.map((comment) => ({
    ...comment,
    author: comment.authorId ? authorsMap.get(comment.authorId) || null : null,
  }))
}

/**
 * Create a ticket comment
 * Uses Drizzle query builder
 */
export async function createTicketComment(ticketId: string, content: string, authorId: string) {
  const [comment] = await dbAdmin
    .insert(ticketCommentsInCommonUtil)
    .values({
      ticketId,
      authorId,
      content,
      isInternal: false,
      attachments: [],
    })
    .returning()

  if (!comment) {
    throw new Error('Failed to create comment')
  }

  return comment
}

/**
 * Get ticket status history
 */
export async function getTicketStatusHistory(ticketId: string) {
  const history = await dbAdmin
    .select()
    .from(ticketStatusHistoryInCommonUtil)
    .where(eq(ticketStatusHistoryInCommonUtil.ticketId, ticketId))
    .orderBy(desc(ticketStatusHistoryInCommonUtil.createdAt))

  // Fetch created_by profiles (createdBy is Clerk user_id, not profile id)
  const createdByIds = [...new Set(history.map((h) => h.createdBy).filter(Boolean) as string[])]
  const profiles = createdByIds.length > 0
    ? await dbAdmin
        .select({
          id: profilesInCore.id,
          userId: profilesInCore.userId,
          firstName: profilesInCore.firstName,
          lastName: profilesInCore.lastName,
          email: profilesInCore.email,
          avatarUrl: profilesInCore.avatarUrl,
        })
        .from(profilesInCore)
        .where(and(inArray(profilesInCore.userId, createdByIds), isNull(profilesInCore.deletedAt)))
    : []

  const profilesMap = new Map(profiles.map((p) => [p.userId, p]))

  return history.map((entry) => ({
    ...entry,
    created_by_profile: entry.createdBy ? profilesMap.get(entry.createdBy) || null : null,
  }))
}

/**
 * Get solutions for a ticket
 */
export async function getTicketSolutions(ticketId: string) {
  const solutions = await dbAdmin
    .select()
    .from(ticketSolutionsInCommonUtil)
    .where(and(eq(ticketSolutionsInCommonUtil.ticketId, ticketId), isNull(ticketSolutionsInCommonUtil.deletedAt)))
    .orderBy(desc(ticketSolutionsInCommonUtil.createdAt))

  return solutions
}

/**
 * Get a single solution by ID
 */
export async function getTicketSolution(solutionId: string) {
  const [solution] = await dbAdmin
    .select()
    .from(ticketSolutionsInCommonUtil)
    .where(and(eq(ticketSolutionsInCommonUtil.id, solutionId), isNull(ticketSolutionsInCommonUtil.deletedAt)))
    .limit(1)

  return solution || null
}

/**
 * Create a solution for a ticket
 */
export async function createTicketSolution(
  ticketId: string,
  title: string,
  description: string | null,
  checklistItems: any[] = [],
  createdBy: string | null = null
) {
  const [solution] = await dbAdmin
    .insert(ticketSolutionsInCommonUtil)
    .values({
      ticketId,
      title,
      description: description || null,
      checklistItems: checklistItems || [],
      isActive: true,
      createdBy,
    })
    .returning()

  return solution
}

/**
 * Update a solution
 */
export async function updateTicketSolution(
  solutionId: string,
  updates: {
    title?: string
    description?: string | null
    checklistItems?: any[]
    isActive?: boolean
  }
) {
  const [solution] = await dbAdmin
    .update(ticketSolutionsInCommonUtil)
    .set({
      ...updates,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(ticketSolutionsInCommonUtil.id, solutionId))
    .returning()

  return solution
}

/**
 * Delete a solution (soft delete)
 */
export async function deleteTicketSolution(solutionId: string) {
  const [solution] = await dbAdmin
    .update(ticketSolutionsInCommonUtil)
    .set({
      deletedAt: new Date().toISOString(),
    })
    .where(eq(ticketSolutionsInCommonUtil.id, solutionId))
    .returning()

  return solution
}

