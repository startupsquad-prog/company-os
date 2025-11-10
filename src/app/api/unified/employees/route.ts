import { NextRequest, NextResponse } from 'next/server'
import { getUnifiedClient } from '@/lib/db/unified-client'

/**
 * GET /api/unified/employees
 * Fetch employees with filters, pagination, and sorting
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const supabase = getUnifiedClient()

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

    // Build query - fetch employees only (fetch related data separately)
    // PostgREST can't resolve foreign keys across schemas, so we fetch separately
    let query = supabase
      .from('employees')
      .select('*', { count: 'exact' })
      .is('deleted_at', null)

    // Apply filters
    if (filters.status && Array.isArray(filters.status)) {
      query = query.in('status', filters.status)
    }

    // Apply search (will filter client-side for nested fields)
    // For now, we'll fetch all and filter client-side

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

    const { data: employees, error, count } = await query

    if (error) {
      throw new Error(`Failed to fetch employees: ${error.message}`)
    }

    // Fetch related profiles separately
    const profileIds = [...new Set((employees || []).map((e: any) => e.profile_id).filter(Boolean))]
    const { data: profiles } = profileIds.length > 0
      ? await supabase
          .from('profiles')
          .select('id, first_name, last_name, email, phone, avatar_url, department_id')
          .in('id', profileIds)
      : { data: [] }

    // Fetch departments for profiles
    const departmentIds = [...new Set((profiles || []).map((p: any) => p.department_id).filter(Boolean))]
    const { data: departments } = departmentIds.length > 0
      ? await supabase
          .from('departments')
          .select('id, name')
          .in('id', departmentIds)
      : { data: [] }

    // Create lookup maps
    const profilesMap = new Map((profiles || []).map((p: any) => [p.id, p]))
    const departmentsMap = new Map((departments || []).map((d: any) => [d.id, d]))

    // Transform data to match Employee type
    const transformedEmployees = (employees || []).map((emp: any) => {
      const profile = profilesMap.get(emp.profile_id)
      return {
        id: emp.id,
        employee_id: emp.employee_id,
        profile_id: emp.profile_id,
        status: emp.status || 'active',
        hire_date: emp.hire_date,
        termination_date: emp.termination_date,
        first_name: profile?.first_name || '',
        last_name: profile?.last_name || '',
        email: profile?.email || '',
        phone: profile?.phone || '',
        avatar_url: profile?.avatar_url || null,
        department: profile?.department_id ? departmentsMap.get(profile.department_id) || null : null,
        created_at: emp.created_at,
        updated_at: emp.updated_at,
      }
    })

    // Apply client-side search if needed
    let filteredEmployees = transformedEmployees
    if (search) {
      const searchLower = search.toLowerCase()
      filteredEmployees = transformedEmployees.filter(
        (emp) =>
          `${emp.first_name} ${emp.last_name}`.toLowerCase().includes(searchLower) ||
          emp.email.toLowerCase().includes(searchLower) ||
          emp.employee_id?.toLowerCase().includes(searchLower) ||
          emp.phone?.toLowerCase().includes(searchLower)
      )
    }

    return NextResponse.json({
      data: filteredEmployees,
      count: count || 0,
      page,
      pageSize,
      totalPages: view === 'kanban' ? 1 : Math.ceil((count || 0) / pageSize),
    })
  } catch (error: any) {
    console.error('Error fetching employees:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch employees' },
      { status: 500 }
    )
  }
}

