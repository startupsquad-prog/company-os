import { NextRequest, NextResponse } from 'next/server'
import { fromAts, fromCommonUtil } from '@/lib/db/schema-helpers'

/**
 * GET /api/hr/job-portals
 * Fetch job portals with filters, pagination, and sorting
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams

    // Parse query parameters
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '10')
    const search = searchParams.get('search') || ''

    // Build filters
    const filters: Record<string, any> = {}
    const statusFilter = searchParams.get('status')
    if (statusFilter) {
      filters.status = statusFilter.split(',')
    }
    const portalTypeFilter = searchParams.get('portal_type')
    if (portalTypeFilter) {
      filters.portal_type = portalTypeFilter.split(',')
    }

    // Build query using schema-aware helper
    let query = fromAts('job_portals')
      .select('*', { count: 'exact' })
      .is('deleted_at', null)

    // Apply filters
    if (filters.status && Array.isArray(filters.status)) {
      query = query.in('status', filters.status)
    }
    if (filters.portal_type && Array.isArray(filters.portal_type)) {
      query = query.in('portal_type', filters.portal_type)
    }

    // Apply sorting
    const sortField = searchParams.get('sortField') || 'created_at'
    const sortDirection = searchParams.get('sortDirection') || 'desc'
    query = query.order(sortField, { ascending: sortDirection === 'asc' })

    // Apply pagination
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1
    query = query.range(from, to)

    const { data: portals, error, count } = await query

    if (error) {
      throw new Error(`Failed to fetch job portals: ${error.message}`)
    }

    // Fetch related subscriptions
    const subscriptionIds = [...new Set((portals || []).map((p: any) => p.subscription_id).filter(Boolean))]
    const { data: subscriptions } = subscriptionIds.length > 0
      ? await fromCommonUtil('subscriptions')
          .select('id, name, status')
          .in('id', subscriptionIds)
      : { data: [] }

    // Create lookup map
    const subscriptionsMap = new Map((subscriptions || []).map((s: any) => [s.id, s]))

    // Transform data
    const transformedPortals = (portals || []).map((portal: any) => {
      const subscription = portal.subscription_id ? subscriptionsMap.get(portal.subscription_id) : null

      return {
        ...portal,
        subscription: subscription
          ? {
              id: subscription.id,
              name: subscription.name,
              status: subscription.status,
            }
          : null,
      }
    })

    // Apply client-side search if needed
    let filteredPortals = transformedPortals
    if (search) {
      const searchLower = search.toLowerCase()
      filteredPortals = transformedPortals.filter(
        (portal: any) =>
          portal.name?.toLowerCase().includes(searchLower) ||
          portal.url?.toLowerCase().includes(searchLower) ||
          portal.notes?.toLowerCase().includes(searchLower)
      )
    }

    return NextResponse.json({
      portals: filteredPortals,
      count: count || 0,
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
 * POST /api/hr/job-portals
 * Create a new job portal
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const { data: portal, error } = await fromAts('job_portals')
      .insert({
        name: body.name,
        url: body.url || null,
        subscription_id: body.subscription_id || null,
        status: body.status || 'active',
        portal_type: body.portal_type || null,
        api_key: body.api_key || null,
        api_secret: body.api_secret || null,
        credentials_jsonb: body.credentials_jsonb || {},
        notes: body.notes || null,
        meta: body.meta || {},
        created_by: body.created_by || null,
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create job portal: ${error.message}`)
    }

    return NextResponse.json({ portal }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating job portal:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create job portal' },
      { status: 500 }
    )
  }
}

