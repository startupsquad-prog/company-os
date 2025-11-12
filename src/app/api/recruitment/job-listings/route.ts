import { NextRequest, NextResponse } from 'next/server'
import { fromAts } from '@/lib/db/schema-helpers'

/**
 * GET /api/recruitment/job-listings
 * Fetch job listings with filters, pagination, and sorting
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
    const roleFilter = searchParams.get('job_role_id')
    if (roleFilter) {
      filters.job_role_id = roleFilter.split(',')
    }
    const portalFilter = searchParams.get('job_portal_id')
    if (portalFilter) {
      filters.job_portal_id = portalFilter.split(',')
    }
    const dateFrom = searchParams.get('date_from')
    const dateTo = searchParams.get('date_to')

    let query = fromAts('job_listings')
      .select('*', { count: 'exact' })
      .is('deleted_at', null)

    if (filters.status && Array.isArray(filters.status)) {
      query = query.in('status', filters.status)
    }
    if (filters.job_role_id && Array.isArray(filters.job_role_id)) {
      query = query.in('job_role_id', filters.job_role_id)
    }
    if (filters.job_portal_id && Array.isArray(filters.job_portal_id)) {
      query = query.in('job_portal_id', filters.job_portal_id)
    }
    if (dateFrom) {
      query = query.gte('posted_at', dateFrom)
    }
    if (dateTo) {
      query = query.lte('posted_at', dateTo)
    }

    const sortField = searchParams.get('sortField') || 'created_at'
    const sortDirection = searchParams.get('sortDirection') || 'desc'
    query = query.order(sortField, { ascending: sortDirection === 'asc' })

    const from = (page - 1) * pageSize
    const to = from + pageSize - 1
    query = query.range(from, to)

    const { data: listings, error, count } = await query

    if (error) {
      console.error('Error fetching job listings:', error)
      throw new Error(`Failed to fetch job listings: ${error.message || 'Unknown error'}`)
    }

    // Fetch related data
    const roleIds = [...new Set((listings || []).map((l: any) => l.job_role_id).filter(Boolean))]
    const portalIds = [...new Set((listings || []).map((l: any) => l.job_portal_id).filter(Boolean))]

    let roles: any[] = []
    if (roleIds.length > 0) {
      const { data: rolesData } = await fromAts('job_roles')
        .select('id, title, department, location, status')
        .in('id', roleIds)
      roles = rolesData || []
    }

    let portals: any[] = []
    if (portalIds.length > 0) {
      const { data: portalsData } = await fromAts('job_portals')
        .select('id, name, portal_type, status')
        .in('id', portalIds)
      portals = portalsData || []
    }

    const rolesMap = new Map(roles.map((r: any) => [r.id, r]))
    const portalsMap = new Map(portals.map((p: any) => [p.id, p]))

    // Filter by search if provided
    let filteredListings = listings || []
    if (search) {
      const searchLower = search.toLowerCase()
      filteredListings = filteredListings.filter((listing: any) => {
        const role = rolesMap.get(listing.job_role_id)
        const portal = portalsMap.get(listing.job_portal_id)
        return (
          role?.title?.toLowerCase().includes(searchLower) ||
          portal?.name?.toLowerCase().includes(searchLower) ||
          listing.external_job_id?.toLowerCase().includes(searchLower) ||
          listing.notes?.toLowerCase().includes(searchLower)
        )
      })
    }

    const listingsWithRelations = filteredListings.map((listing: any) => ({
      ...listing,
      job_role: rolesMap.get(listing.job_role_id) || null,
      job_portal: portalsMap.get(listing.job_portal_id) || null,
    }))

    const finalCount = search ? listingsWithRelations.length : (count || 0)

    return NextResponse.json({
      listings: listingsWithRelations,
      total: finalCount,
      page,
      pageSize,
      totalPages: Math.ceil(finalCount / pageSize),
    })
  } catch (error: any) {
    console.error('Error fetching job listings:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch job listings' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/recruitment/job-listings
 * Create a new job listing
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const listingData = {
      job_role_id: body.job_role_id,
      job_portal_id: body.job_portal_id,
      external_job_id: body.external_job_id,
      listing_url: body.listing_url,
      status: body.status || 'draft',
      posted_at: body.posted_at,
      expires_at: body.expires_at,
      custom_description: body.custom_description,
      notes: body.notes,
      meta: body.meta || {},
      created_by: body.created_by,
    }

    const { data: listing, error } = await fromAts('job_listings')
      .insert(listingData)
      .select()
      .single()

    if (error) {
      console.error('Error creating job listing:', error)
      throw new Error(`Failed to create job listing: ${error.message || 'Unknown error'}`)
    }

    return NextResponse.json({ data: listing }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating job listing:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create job listing' },
      { status: 500 }
    )
  }
}

