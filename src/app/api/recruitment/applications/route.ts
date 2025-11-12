import { NextRequest, NextResponse } from 'next/server'
import { fromAts } from '@/lib/db/schema-helpers'

/**
 * GET /api/recruitment/applications
 * Fetch applications with filters, pagination, and sorting
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '10')
    const candidateId = searchParams.get('candidate_id')

    // Build filters
    const filters: Record<string, any> = {}
    const statusFilter = searchParams.get('status')
    if (statusFilter) {
      filters.status = statusFilter.split(',')
    }
    if (candidateId) {
      filters.candidate_id = candidateId
    }

    let query = fromAts('applications')
      .select('*', { count: 'exact' })
      .is('deleted_at', null)

    if (filters.status && Array.isArray(filters.status)) {
      query = query.in('status', filters.status)
    }
    if (filters.candidate_id) {
      query = query.eq('candidate_id', filters.candidate_id)
    }

    const sortField = searchParams.get('sortField') || 'created_at'
    const sortDirection = searchParams.get('sortDirection') || 'desc'
    query = query.order(sortField, { ascending: sortDirection === 'asc' })

    const from = (page - 1) * pageSize
    const to = from + pageSize - 1
    query = query.range(from, to)

    const { data: applications, error, count } = await query

    if (error) {
      console.error('Error fetching applications:', error)
      throw new Error(`Failed to fetch applications: ${error.message || 'Unknown error'}`)
    }

    return NextResponse.json({
      applications: applications || [],
      total: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize),
    })
  } catch (error: any) {
    console.error('Error fetching applications:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch applications' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/recruitment/applications
 * Create a new application
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const applicationData = {
      candidate_id: body.candidate_id,
      job_id: body.job_id,
      job_title: body.job_title,
      status: body.status || 'applied',
      source: body.source,
      applied_at: body.applied_at || new Date().toISOString(),
      notes: body.notes,
      meta: body.meta || {},
      created_by: body.created_by,
    }

    const { data: application, error } = await fromAts('applications')
      .insert(applicationData)
      .select()
      .single()

    if (error) {
      console.error('Error creating application:', error)
      throw new Error(`Failed to create application: ${error.message || 'Unknown error'}`)
    }

    return NextResponse.json({ data: application }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating application:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create application' },
      { status: 500 }
    )
  }
}

