import { NextRequest, NextResponse } from 'next/server'
import { fromAts, fromCore } from '@/lib/db/schema-helpers'

/**
 * GET /api/recruitment/interviews
 * Fetch interviews with filters, pagination, and sorting
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '10')
    const search = searchParams.get('search') || ''

    // Build filters
    const filters: Record<string, any> = {}
    const typeFilter = searchParams.get('type')
    if (typeFilter) {
      filters.type = typeFilter.split(',')
    }
    const statusFilter = searchParams.get('status')
    if (statusFilter) {
      filters.status = statusFilter.split(',')
    }
    const interviewerIdFilter = searchParams.get('interviewer_id')
    if (interviewerIdFilter) {
      filters.interviewer_id = interviewerIdFilter.split(',')
    }
    const dateFrom = searchParams.get('date_from')
    const dateTo = searchParams.get('date_to')

    let query = fromAts('interviews')
      .select('*', { count: 'exact' })
      .is('deleted_at', null)

    if (filters.type && Array.isArray(filters.type)) {
      query = query.in('interview_type', filters.type)
    }
    if (filters.status && Array.isArray(filters.status)) {
      query = query.in('status', filters.status)
    }
    if (dateFrom) {
      query = query.gte('scheduled_at', dateFrom)
    }
    if (dateTo) {
      query = query.lte('scheduled_at', dateTo)
    }

    const sortField = searchParams.get('sortField') || 'scheduled_at'
    const sortDirection = searchParams.get('sortDirection') || 'desc'
    query = query.order(sortField, { ascending: sortDirection === 'asc' })

    const from = (page - 1) * pageSize
    const to = from + pageSize - 1
    query = query.range(from, to)

    const { data: interviews, error, count } = await query

    if (error) {
      console.error('Error fetching interviews:', error)
      throw new Error(`Failed to fetch interviews: ${error.message || 'Unknown error'}`)
    }

    // Fetch related data
    const candidateIds = [...new Set((interviews || []).map((i: any) => i.candidate_id).filter(Boolean))]
    const interviewerIds = [...new Set((interviews || []).flatMap((i: any) => i.interviewer_ids || []))]

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

    let interviewers: any[] = []
    if (interviewerIds.length > 0) {
      const { data: interviewersData } = await fromCore('profiles')
        .select('id, first_name, last_name, email')
        .in('id', interviewerIds)
      interviewers = interviewersData || []
    }

    const candidatesMap = new Map(candidates.map((c: any) => [c.id, c]))
    const interviewersMap = new Map(interviewers.map((i: any) => [i.id, i]))

    // Filter by interviewer if provided
    let filteredInterviews = interviews || []
    if (filters.interviewer_id && Array.isArray(filters.interviewer_id)) {
      filteredInterviews = filteredInterviews.filter((interview: any) => {
        return interview.interviewer_ids?.some((id: string) => filters.interviewer_id.includes(id))
      })
    }

    // Filter by search (candidate name)
    if (search) {
      const searchLower = search.toLowerCase()
      filteredInterviews = filteredInterviews.filter((interview: any) => {
        const candidate = candidatesMap.get(interview.candidate_id)
        const contact = candidate?.contact
        return contact?.name?.toLowerCase().includes(searchLower) ||
               contact?.email?.toLowerCase().includes(searchLower)
      })
    }

    const interviewsWithRelations = filteredInterviews.map((interview: any) => ({
      ...interview,
      candidate: candidatesMap.get(interview.candidate_id) || null,
      interviewers: (interview.interviewer_ids || []).map((id: string) => interviewersMap.get(id)).filter(Boolean),
    }))

    const finalCount = (filters.interviewer_id || search) ? interviewsWithRelations.length : (count || 0)

    return NextResponse.json({
      interviews: interviewsWithRelations,
      total: finalCount,
      page,
      pageSize,
      totalPages: Math.ceil(finalCount / pageSize),
    })
  } catch (error: any) {
    console.error('Error fetching interviews:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch interviews' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/recruitment/interviews
 * Create a new interview
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const interviewData = {
      application_id: body.application_id,
      candidate_id: body.candidate_id,
      interview_type: body.interview_type,
      status: body.status || 'scheduled',
      scheduled_at: body.scheduled_at,
      duration_minutes: body.duration_minutes,
      location: body.location,
      interviewer_ids: body.interviewer_ids || [],
      notes: body.notes,
      feedback_summary: body.feedback_summary,
      meta: body.meta || {},
      created_by: body.created_by,
    }

    const { data: interview, error } = await fromAts('interviews')
      .insert(interviewData)
      .select()
      .single()

    if (error) {
      console.error('Error creating interview:', error)
      throw new Error(`Failed to create interview: ${error.message || 'Unknown error'}`)
    }

    return NextResponse.json({ data: interview }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating interview:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create interview' },
      { status: 500 }
    )
  }
}

