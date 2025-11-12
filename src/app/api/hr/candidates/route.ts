import { NextRequest, NextResponse } from 'next/server'
import { fromAts, fromCore } from '@/lib/db/schema-helpers'

/**
 * GET /api/hr/candidates
 * Fetch candidates with filters, pagination, and sorting
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams

    // Parse query parameters
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '10')
    const search = searchParams.get('search') || ''
    const view = searchParams.get('view') || 'table' // 'table' | 'kanban'

    // Build filters
    const filters: Record<string, any> = {}
    const statusFilter = searchParams.get('status')
    if (statusFilter) {
      filters.status = statusFilter.split(',')
    }
    const sourceFilter = searchParams.get('source')
    if (sourceFilter) {
      filters.source = sourceFilter.split(',')
    }
    const recruiterIdFilter = searchParams.get('recruiter_id')
    if (recruiterIdFilter) {
      filters.recruiter_id = recruiterIdFilter.split(',')
    }

    // Build query using schema-aware helper
    let query = fromAts('candidates')
      .select('*', { count: 'exact' })
      .is('deleted_at', null)

    // Apply filters
    if (filters.status && Array.isArray(filters.status)) {
      query = query.in('status', filters.status)
    }
    if (filters.source && Array.isArray(filters.source)) {
      query = query.in('source', filters.source)
    }
    if (filters.recruiter_id && Array.isArray(filters.recruiter_id)) {
      query = query.in('recruiter_id', filters.recruiter_id)
    }

    // Apply sorting
    const sortField = searchParams.get('sortField') || 'created_at'
    const sortDirection = searchParams.get('sortDirection') || 'desc'
    query = query.order(sortField, { ascending: sortDirection === 'asc' })

    // Apply pagination (only for table view)
    if (view !== 'kanban') {
      const from = (page - 1) * pageSize
      const to = from + pageSize - 1
      query = query.range(from, to)
    }

    const { data: candidates, error, count } = await query

    if (error) {
      throw new Error(`Failed to fetch candidates: ${error.message}`)
    }

    // Fetch related data separately
    const contactIds = [...new Set((candidates || []).map((c: any) => c.contact_id).filter(Boolean))]
    const recruiterIds = [...new Set((candidates || []).map((c: any) => c.recruiter_id).filter(Boolean))]

    // Fetch contacts
    const { data: contacts } = contactIds.length > 0
      ? await fromCore('contacts')
          .select('id, name, email, phone')
          .in('id', contactIds)
      : { data: [] }

    // Fetch recruiters (profiles)
    const { data: recruiters } = recruiterIds.length > 0
      ? await fromCore('profiles')
          .select('id, first_name, last_name, email')
          .in('id', recruiterIds)
      : { data: [] }

    // Create lookup maps
    const contactsMap = new Map((contacts || []).map((c: any) => [c.id, c]))
    const recruitersMap = new Map((recruiters || []).map((p: any) => [p.id, p]))

    // Transform data
    const transformedCandidates = (candidates || []).map((candidate: any) => {
      const contact = contactsMap.get(candidate.contact_id)
      const recruiter = candidate.recruiter_id ? recruitersMap.get(candidate.recruiter_id) : null

      return {
        ...candidate,
        contact: contact
          ? {
              id: contact.id,
              name: contact.name,
              email: contact.email,
              phone: contact.phone,
            }
          : null,
        recruiter: recruiter
          ? {
              id: recruiter.id,
              first_name: recruiter.first_name,
              last_name: recruiter.last_name,
              email: recruiter.email,
            }
          : null,
      }
    })

    // Apply client-side search if needed
    let filteredCandidates = transformedCandidates
    if (search) {
      const searchLower = search.toLowerCase()
      filteredCandidates = transformedCandidates.filter(
        (candidate: any) =>
          candidate.contact?.name?.toLowerCase().includes(searchLower) ||
          candidate.contact?.email?.toLowerCase().includes(searchLower) ||
          candidate.contact?.phone?.toLowerCase().includes(searchLower) ||
          candidate.notes?.toLowerCase().includes(searchLower) ||
          candidate.tags?.some((tag: string) => tag.toLowerCase().includes(searchLower))
      )
    }

    return NextResponse.json({
      candidates: filteredCandidates,
      count: count || 0,
      page,
      pageSize,
      totalPages: view === 'kanban' ? 1 : Math.ceil((count || 0) / pageSize),
    })
  } catch (error: any) {
    console.error('Error fetching candidates:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch candidates' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/hr/candidates
 * Create a new candidate
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const { data: candidate, error } = await fromAts('candidates')
      .insert({
        contact_id: body.contact_id,
        status: body.status || 'new',
        source: body.source || null,
        recruiter_id: body.recruiter_id || null,
        resume_url: body.resume_url || null,
        cover_letter_url: body.cover_letter_url || null,
        tags: body.tags || [],
        notes: body.notes || null,
        meta: body.meta || {},
        created_by: body.created_by || null,
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create candidate: ${error.message}`)
    }

    return NextResponse.json({ candidate }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating candidate:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create candidate' },
      { status: 500 }
    )
  }
}

