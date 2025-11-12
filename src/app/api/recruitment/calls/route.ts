import { NextRequest, NextResponse } from 'next/server'
import { fromAts, fromCore } from '@/lib/db/schema-helpers'

/**
 * GET /api/recruitment/calls
 * Fetch recruitment calls with filters, pagination, and sorting
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '10')
    const candidateId = searchParams.get('candidate_id')

    // Build filters
    const filters: Record<string, any> = {}
    const typeFilter = searchParams.get('call_type')
    if (typeFilter) {
      filters.call_type = typeFilter.split(',')
    }
    const statusFilter = searchParams.get('status')
    if (statusFilter) {
      filters.status = statusFilter.split(',')
    }
    const callerIdFilter = searchParams.get('caller_id')
    if (callerIdFilter) {
      filters.caller_id = callerIdFilter.split(',')
    }
    const dateFrom = searchParams.get('date_from')
    const dateTo = searchParams.get('date_to')

    let query = fromAts('calls')
      .select('*', { count: 'exact' })
      .is('deleted_at', null)

    if (candidateId) {
      query = query.eq('candidate_id', candidateId)
    }
    if (filters.call_type && Array.isArray(filters.call_type)) {
      query = query.in('call_type', filters.call_type)
    }
    if (filters.status && Array.isArray(filters.status)) {
      query = query.in('status', filters.status)
    }
    if (filters.caller_id && Array.isArray(filters.caller_id)) {
      query = query.in('caller_id', filters.caller_id)
    }
    if (dateFrom) {
      query = query.gte('scheduled_at', dateFrom)
    }
    if (dateTo) {
      query = query.lte('scheduled_at', dateTo)
    }

    const sortField = searchParams.get('sortField') || 'created_at'
    const sortDirection = searchParams.get('sortDirection') || 'desc'
    query = query.order(sortField, { ascending: sortDirection === 'asc' })

    const from = (page - 1) * pageSize
    const to = from + pageSize - 1
    query = query.range(from, to)

    const { data: calls, error, count } = await query

    if (error) {
      console.error('Error fetching calls:', error)
      throw new Error(`Failed to fetch calls: ${error.message || 'Unknown error'}`)
    }

    // Fetch related data
    const candidateIds = [...new Set((calls || []).map((c: any) => c.candidate_id).filter(Boolean))]
    const callerIds = [...new Set((calls || []).map((c: any) => c.caller_id).filter(Boolean))]

    let candidates: any[] = []
    if (candidateIds.length > 0) {
      const { data: candidatesData } = await fromAts('candidates')
        .select('id, contact_id')
        .in('id', candidateIds)
      
      const contactIds = [...new Set((candidatesData || []).map((c: any) => c.contact_id).filter(Boolean))]
      if (contactIds.length > 0) {
        const { data: contactsData } = await fromCore('contacts')
          .select('id, name, email, phone')
          .in('id', contactIds)
        candidates = (candidatesData || []).map((c: any) => ({
          ...c,
          contact: (contactsData || []).find((ct: any) => ct.id === c.contact_id),
        }))
      }
    }

    let callers: any[] = []
    if (callerIds.length > 0) {
      const { data: callersData } = await fromCore('profiles')
        .select('id, first_name, last_name, email, phone, avatar_url')
        .in('id', callerIds)
      callers = callersData || []
    }

    const candidatesMap = new Map(candidates.map((c: any) => [c.id, c]))
    const callersMap = new Map(callers.map((c: any) => [c.id, c]))

    const callsWithRelations = (calls || []).map((call: any) => ({
      ...call,
      candidate: candidatesMap.get(call.candidate_id) || null,
      caller: call.caller_id ? callersMap.get(call.caller_id) || null : null,
    }))

    return NextResponse.json({
      calls: callsWithRelations,
      total: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize),
    })
  } catch (error: any) {
    console.error('Error fetching calls:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch calls' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/recruitment/calls
 * Create a new recruitment call
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const callData = {
      candidate_id: body.candidate_id,
      application_id: body.application_id,
      caller_id: body.caller_id,
      call_type: body.call_type,
      direction: body.direction,
      phone_number: body.phone_number,
      duration_seconds: body.duration_seconds || 0,
      status: body.status || 'completed',
      outcome: body.outcome,
      subject: body.subject,
      notes: body.notes,
      recording_url: body.recording_url,
      scheduled_at: body.scheduled_at,
      started_at: body.started_at,
      ended_at: body.ended_at,
      meta: body.meta || {},
      created_by: body.created_by,
    }

    const { data: call, error } = await fromAts('calls')
      .insert(callData)
      .select()
      .single()

    if (error) {
      console.error('Error creating call:', error)
      throw new Error(`Failed to create call: ${error.message || 'Unknown error'}`)
    }

    return NextResponse.json({ data: call }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating call:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create call' },
      { status: 500 }
    )
  }
}

