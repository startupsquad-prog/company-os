import { NextRequest, NextResponse } from 'next/server'
import { fromAts, fromCore } from '@/lib/db/schema-helpers'

/**
 * GET /api/recruitment/evaluations
 * Fetch evaluations with filters, pagination, and sorting
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '10')
    const search = searchParams.get('search') || ''

    // Build filters
    const filters: Record<string, any> = {}
    const recommendationFilter = searchParams.get('recommendation')
    if (recommendationFilter) {
      filters.recommendation = recommendationFilter.split(',')
    }
    const statusFilter = searchParams.get('status')
    if (statusFilter) {
      filters.status = statusFilter.split(',')
    }
    const evaluatorIdFilter = searchParams.get('evaluator_id')
    if (evaluatorIdFilter) {
      filters.evaluator_id = evaluatorIdFilter.split(',')
    }

    let query = fromAts('evaluations')
      .select('*', { count: 'exact' })

    if (filters.recommendation && Array.isArray(filters.recommendation)) {
      query = query.in('recommendation', filters.recommendation)
    }
    if (filters.status && Array.isArray(filters.status)) {
      query = query.in('status', filters.status)
    }
    if (filters.evaluator_id && Array.isArray(filters.evaluator_id)) {
      query = query.in('evaluator_id', filters.evaluator_id)
    }

    const sortField = searchParams.get('sortField') || 'created_at'
    const sortDirection = searchParams.get('sortDirection') || 'desc'
    query = query.order(sortField, { ascending: sortDirection === 'asc' })

    const from = (page - 1) * pageSize
    const to = from + pageSize - 1
    query = query.range(from, to)

    const { data: evaluations, error, count } = await query

    if (error) {
      console.error('Error fetching evaluations:', error)
      throw new Error(`Failed to fetch evaluations: ${error.message || 'Unknown error'}`)
    }

    // Fetch related data
    const candidateIds = [...new Set((evaluations || []).map((e: any) => e.candidate_id).filter(Boolean))]
    const evaluatorIds = [...new Set((evaluations || []).map((e: any) => e.evaluator_id).filter(Boolean))]
    const interviewIds = [...new Set((evaluations || []).map((e: any) => e.interview_id).filter(Boolean))]

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

    let evaluators: any[] = []
    if (evaluatorIds.length > 0) {
      const { data: evaluatorsData } = await fromCore('profiles')
        .select('id, first_name, last_name, email')
        .in('id', evaluatorIds)
      evaluators = evaluatorsData || []
    }

    let interviews: any[] = []
    if (interviewIds.length > 0) {
      const { data: interviewsData } = await fromAts('interviews')
        .select('id, interview_type, scheduled_at')
        .in('id', interviewIds)
      interviews = interviewsData || []
    }

    const candidatesMap = new Map(candidates.map((c: any) => [c.id, c]))
    const evaluatorsMap = new Map(evaluators.map((e: any) => [e.id, e]))
    const interviewsMap = new Map(interviews.map((i: any) => [i.id, i]))

    // Filter by search (candidate name)
    let filteredEvaluations = evaluations || []
    if (search) {
      const searchLower = search.toLowerCase()
      filteredEvaluations = filteredEvaluations.filter((evaluation: any) => {
        const candidate = candidatesMap.get(evaluation.candidate_id)
        const contact = candidate?.contact
        return contact?.name?.toLowerCase().includes(searchLower) ||
               contact?.email?.toLowerCase().includes(searchLower)
      })
    }

    const evaluationsWithRelations = filteredEvaluations.map((evaluation: any) => ({
      ...evaluation,
      candidate: candidatesMap.get(evaluation.candidate_id) || null,
      evaluator: evaluatorsMap.get(evaluation.evaluator_id) || null,
      interview: interviewsMap.get(evaluation.interview_id) || null,
    }))

    const finalCount = search ? evaluationsWithRelations.length : (count || 0)

    return NextResponse.json({
      evaluations: evaluationsWithRelations,
      total: finalCount,
      page,
      pageSize,
      totalPages: Math.ceil(finalCount / pageSize),
    })
  } catch (error: any) {
    console.error('Error fetching evaluations:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch evaluations' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/recruitment/evaluations
 * Create a new evaluation
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const evaluationData = {
      interview_id: body.interview_id,
      candidate_id: body.candidate_id,
      evaluator_id: body.evaluator_id,
      status: body.status || 'draft',
      overall_rating: body.overall_rating,
      scores: body.scores || {},
      strengths: body.strengths || [],
      weaknesses: body.weaknesses || [],
      recommendation: body.recommendation,
      notes: body.notes,
      meta: body.meta || {},
      created_by: body.created_by,
    }

    const { data: evaluation, error } = await fromAts('evaluations')
      .insert(evaluationData)
      .select()
      .single()

    if (error) {
      console.error('Error creating evaluation:', error)
      throw new Error(`Failed to create evaluation: ${error.message || 'Unknown error'}`)
    }

    return NextResponse.json({ data: evaluation }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating evaluation:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create evaluation' },
      { status: 500 }
    )
  }
}

