import { NextRequest, NextResponse } from 'next/server'
import { fromAts } from '@/lib/db/schema-helpers'

/**
 * GET /api/recruitment/job-roles
 * Fetch job roles with filters, pagination, and sorting
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
    const departmentFilter = searchParams.get('department')
    if (departmentFilter) {
      filters.department = departmentFilter.split(',')
    }
    const locationFilter = searchParams.get('location')
    if (locationFilter) {
      filters.location = locationFilter.split(',')
    }
    const employmentTypeFilter = searchParams.get('employment_type')
    if (employmentTypeFilter) {
      filters.employment_type = employmentTypeFilter.split(',')
    }

    let query = fromAts('job_roles')
      .select('*', { count: 'exact' })
      .is('deleted_at', null)

    if (filters.status && Array.isArray(filters.status)) {
      query = query.in('status', filters.status)
    }
    if (filters.department && Array.isArray(filters.department)) {
      query = query.in('department', filters.department)
    }
    if (filters.location && Array.isArray(filters.location)) {
      query = query.in('location', filters.location)
    }
    if (filters.employment_type && Array.isArray(filters.employment_type)) {
      query = query.in('employment_type', filters.employment_type)
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%,department.ilike.%${search}%,location.ilike.%${search}%`)
    }

    const sortField = searchParams.get('sortField') || 'created_at'
    const sortDirection = searchParams.get('sortDirection') || 'desc'
    query = query.order(sortField, { ascending: sortDirection === 'asc' })

    const from = (page - 1) * pageSize
    const to = from + pageSize - 1
    query = query.range(from, to)

    const { data: roles, error, count } = await query

    if (error) {
      console.error('Error fetching job roles:', error)
      throw new Error(`Failed to fetch job roles: ${error.message || 'Unknown error'}`)
    }

    // Get listing and application counts for each role
    const roleIds = (roles || []).map((r: any) => r.id)
    let listingCounts: Record<string, number> = {}
    let applicationCounts: Record<string, number> = {}

    if (roleIds.length > 0) {
      // Get active listings count
      const { data: listingsData } = await fromAts('job_listings')
        .select('job_role_id')
        .in('job_role_id', roleIds)
        .eq('status', 'active')
        .is('deleted_at', null)

      listingsData?.forEach((l: any) => {
        listingCounts[l.job_role_id] = (listingCounts[l.job_role_id] || 0) + 1
      })

      // Get applications count
      const { data: applicationsData } = await fromAts('applications')
        .select('job_listing_id')
        .is('deleted_at', null)

      const listingIds = [...new Set(applicationsData?.map((a: any) => a.job_listing_id).filter(Boolean) || [])]
      if (listingIds.length > 0) {
        const { data: listingsForApps } = await fromAts('job_listings')
          .select('id, job_role_id')
          .in('id', listingIds)
          .in('job_role_id', roleIds)

        listingsForApps?.forEach((l: any) => {
          const appCount = applicationsData?.filter((a: any) => a.job_listing_id === l.id).length || 0
          applicationCounts[l.job_role_id] = (applicationCounts[l.job_role_id] || 0) + appCount
        })
      }
    }

    const rolesWithCounts = (roles || []).map((role: any) => ({
      ...role,
      active_listings_count: listingCounts[role.id] || 0,
      total_applications_count: applicationCounts[role.id] || 0,
    }))

    return NextResponse.json({
      roles: rolesWithCounts,
      total: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize),
    })
  } catch (error: any) {
    console.error('Error fetching job roles:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch job roles' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/recruitment/job-roles
 * Create a new job role
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const roleData = {
      title: body.title,
      department: body.department,
      location: body.location,
      employment_type: body.employment_type,
      status: body.status || 'active',
      description: body.description,
      requirements: body.requirements,
      responsibilities: body.responsibilities,
      salary_range_min: body.salary_range_min,
      salary_range_max: body.salary_range_max,
      currency: body.currency || 'INR',
      experience_required_years: body.experience_required_years,
      tags: body.tags || [],
      notes: body.notes,
      meta: body.meta || {},
      created_by: body.created_by,
    }

    const { data: role, error } = await fromAts('job_roles')
      .insert(roleData)
      .select()
      .single()

    if (error) {
      console.error('Error creating job role:', error)
      throw new Error(`Failed to create job role: ${error.message || 'Unknown error'}`)
    }

    return NextResponse.json({ data: role }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating job role:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create job role' },
      { status: 500 }
    )
  }
}

