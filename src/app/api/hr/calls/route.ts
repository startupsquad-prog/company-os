import { NextRequest, NextResponse } from 'next/server'
import { fromAts, fromCore } from '@/lib/db/schema-helpers'

/**
 * GET /api/hr/calls
 * Fetch recruitment calls with filters, pagination, and sorting
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams

    // Parse query parameters
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '10')
    const search = searchParams.get('search') || ''
    const candidateId = searchParams.get('candidate_id')

    // Build filters
    const filters: Record<string, any> = {}
    const statusFilter = searchParams.get('status')
    if (statusFilter) {
      filters.status = statusFilter.split(',')
    }
    const callTypeFilter = searchParams.get('call_type')
    if (callTypeFilter) {
      filters.call_type = callTypeFilter.split(',')
    }

    // Build query using schema-aware helper
    let query = fromAts('calls')
      .select('*', { count: 'exact' })
      .is('deleted_at', null)

    // Apply filters
    if (candidateId) {
      query = query.eq('candidate_id', candidateId)
    }
    if (filters.status && Array.isArray(filters.status)) {
      query = query.in('status', filters.status)
    }
    if (filters.call_type && Array.isArray(filters.call_type)) {
      query = query.in('call_type', filters.call_type)
    }

    // Apply sorting
    const sortField = searchParams.get('sortField') || 'created_at'
    const sortDirection = searchParams.get('sortDirection') || 'desc'
    query = query.order(sortField, { ascending: sortDirection === 'asc' })

    // Apply pagination
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1
    query = query.range(from, to)

    const { data: calls, error, count } = await query

    if (error) {
      throw new Error(`Failed to fetch calls: ${error.message}`)
    }

    // Fetch related data separately
    const candidateIds = [...new Set((calls || []).map((c: any) => c.candidate_id).filter(Boolean))]
    const callerIds = [...new Set((calls || []).map((c: any) => c.caller_id).filter(Boolean))]

    // Fetch candidates with contacts
    const { data: candidates } = candidateIds.length > 0
      ? await fromAts('candidates')
          .select('id, contact_id, status')
          .in('id', candidateIds)
      : { data: [] }

    const contactIds = [...new Set((candidates || []).map((c: any) => c.contact_id).filter(Boolean))]
    const { data: contacts } = contactIds.length > 0
      ? await fromCore('contacts')
          .select('id, name, email, phone')
          .in('id', contactIds)
      : { data: [] }

    // Fetch callers (profiles)
    const { data: callers } = callerIds.length > 0
      ? await fromCore('profiles')
          .select('id, first_name, last_name, email, phone, avatar_url')
          .in('id', callerIds)
      : { data: [] }

    // Create lookup maps
    const candidatesMap = new Map((candidates || []).map((c: any) => [c.id, c]))
    const contactsMap = new Map((contacts || []).map((c: any) => [c.id, c]))
    const callersMap = new Map((callers || []).map((p: any) => [p.id, p]))

    // Transform data
    const transformedCalls = (calls || []).map((call: any) => {
      const candidate = candidatesMap.get(call.candidate_id)
      const contact = candidate ? contactsMap.get(candidate.contact_id) : null
      const caller = call.caller_id ? callersMap.get(call.caller_id) : null

      return {
        ...call,
        candidate: contact
          ? {
              id: candidate.id,
              contact: {
                id: contact.id,
                name: contact.name,
                email: contact.email,
                phone: contact.phone,
              },
              status: candidate.status,
            }
          : null,
        caller: caller
          ? {
              id: caller.id,
              first_name: caller.first_name,
              last_name: caller.last_name,
              email: caller.email,
              phone: caller.phone,
              avatar_url: caller.avatar_url,
            }
          : null,
      }
    })

    // Apply client-side search if needed
    let filteredCalls = transformedCalls
    if (search) {
      const searchLower = search.toLowerCase()
      filteredCalls = transformedCalls.filter(
        (call: any) =>
          call.subject?.toLowerCase().includes(searchLower) ||
          call.notes?.toLowerCase().includes(searchLower) ||
          call.phone_number?.toLowerCase().includes(searchLower) ||
          call.candidate?.contact?.name?.toLowerCase().includes(searchLower) ||
          call.candidate?.contact?.email?.toLowerCase().includes(searchLower)
      )
    }

    return NextResponse.json({
      calls: filteredCalls,
      count: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize),
    })
  } catch (error: any) {
    console.error('Error fetching calls:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch calls' }, { status: 500 })
  }
}

/**
 * POST /api/hr/calls
 * Create a new recruitment call
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const { data: call, error } = await fromAts('calls')
      .insert({
        candidate_id: body.candidate_id,
        application_id: body.application_id || null,
        caller_id: body.caller_id || null,
        call_type: body.call_type,
        direction: body.direction || null,
        phone_number: body.phone_number || null,
        duration_seconds: body.duration_seconds || 0,
        status: body.status || 'completed',
        outcome: body.outcome || null,
        subject: body.subject || null,
        notes: body.notes || null,
        recording_url: body.recording_url || null,
        scheduled_at: body.scheduled_at || null,
        started_at: body.started_at || null,
        ended_at: body.ended_at || null,
        meta: body.meta || {},
        created_by: body.created_by || null,
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create call: ${error.message}`)
    }

    return NextResponse.json({ call }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating call:', error)
    return NextResponse.json({ error: error.message || 'Failed to create call' }, { status: 500 })
  }
}

