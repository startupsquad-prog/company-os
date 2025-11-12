import { NextRequest, NextResponse } from 'next/server'
import { fromAts, fromCommonUtil } from '@/lib/db/schema-helpers'

/**
 * GET /api/recruitment/job-portals
 * Fetch job portals with filters, pagination, and sorting
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '10')
    const search = searchParams.get('search') || ''

    // Build filters
    const filters: Record<string, any> = {}
    const statusFilter = searchParams.get('status')
    if (statusFilter) {
      filters.status = statusFilter.split(',')
    }
    const typeFilter = searchParams.get('portal_type')
    if (typeFilter) {
      filters.portal_type = typeFilter.split(',')
    }
    const subscriptionFilter = searchParams.get('subscription_id')
    if (subscriptionFilter) {
      filters.subscription_id = subscriptionFilter.split(',')
    }

    let query = fromAts('job_portals')
      .select('*', { count: 'exact' })
      .is('deleted_at', null)

    if (filters.status && Array.isArray(filters.status)) {
      query = query.in('status', filters.status)
    }
    if (filters.portal_type && Array.isArray(filters.portal_type)) {
      query = query.in('portal_type', filters.portal_type)
    }
    if (filters.subscription_id && Array.isArray(filters.subscription_id)) {
      query = query.in('subscription_id', filters.subscription_id)
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,url.ilike.%${search}%,notes.ilike.%${search}%`)
    }

    const sortField = searchParams.get('sortField') || 'created_at'
    const sortDirection = searchParams.get('sortDirection') || 'desc'
    query = query.order(sortField, { ascending: sortDirection === 'asc' })

    const from = (page - 1) * pageSize
    const to = from + pageSize - 1
    query = query.range(from, to)

    const { data: portals, error, count } = await query

    if (error) {
      console.error('Error fetching job portals:', error)
      throw new Error(`Failed to fetch job portals: ${error.message || 'Unknown error'}`)
    }

    // Fetch subscriptions
    const subscriptionIds = [...new Set((portals || []).map((p: any) => p.subscription_id).filter(Boolean))]
    let subscriptions: any[] = []
    if (subscriptionIds.length > 0) {
      const { data: subsData } = await fromCommonUtil('subscriptions')
        .select('id, name, status')
        .in('id', subscriptionIds)
      subscriptions = subsData || []
    }

    const subscriptionsMap = new Map(subscriptions.map((s: any) => [s.id, s]))

    const portalsWithRelations = (portals || []).map((portal: any) => ({
      ...portal,
      subscription: portal.subscription_id ? subscriptionsMap.get(portal.subscription_id) || null : null,
    }))

    return NextResponse.json({
      portals: portalsWithRelations,
      total: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize),
    })
  } catch (error: any) {
    console.error('Error fetching job portals:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch job portals' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/recruitment/job-portals
 * Create a new job portal
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const portalData = {
      name: body.name,
      url: body.url,
      subscription_id: body.subscription_id,
      status: body.status || 'active',
      portal_type: body.portal_type,
      api_key: body.api_key,
      api_secret: body.api_secret,
      credentials_jsonb: body.credentials_jsonb || {},
      notes: body.notes,
      meta: body.meta || {},
      created_by: body.created_by,
    }

    const { data: portal, error } = await fromAts('job_portals')
      .insert(portalData)
      .select()
      .single()

    if (error) {
      console.error('Error creating job portal:', error)
      throw new Error(`Failed to create job portal: ${error.message || 'Unknown error'}`)
    }

    return NextResponse.json({ data: portal }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating job portal:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create job portal' },
      { status: 500 }
    )
  }
}

