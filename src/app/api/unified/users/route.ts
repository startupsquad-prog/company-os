import { NextRequest, NextResponse } from 'next/server'
import { getUnifiedClient } from '@/lib/db/unified-client'

/**
 * GET /api/unified/users
 * Fetch users (profiles) with filters, pagination, and sorting
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const supabase = getUnifiedClient()

    // Parse query parameters
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '10')
    const search = searchParams.get('search') || ''

    // Build query - fetch profiles only (fetch related data separately)
    // PostgREST can't resolve foreign keys across schemas, so we fetch separately
    let query = supabase
      .from('profiles')
      .select('*', { count: 'exact' })
      .is('deleted_at', null)

    // Apply search
    if (search) {
      query = query.or(
        `first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`
      )
    }

    // Apply sorting
    const sortField = searchParams.get('sortField') || 'created_at'
    const sortDirection = searchParams.get('sortDirection') || 'desc'
    query = query.order(sortField, { ascending: sortDirection === 'asc' })

    // Apply pagination
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1
    query = query.range(from, to)

    const { data: profiles, error, count } = await query

    if (error) {
      throw new Error(`Failed to fetch users: ${error.message}`)
    }

    // Fetch departments separately
    const departmentIds = [...new Set((profiles || []).map((p: any) => p.department_id).filter(Boolean))]
    const { data: departments } = departmentIds.length > 0
      ? await supabase
          .from('departments')
          .select('id, name')
          .in('id', departmentIds)
      : { data: [] }

    // Fetch roles for each user
    const userIds = [...new Set((profiles || []).map((p: any) => p.user_id).filter(Boolean))]
    const { data: roleBindings } =
      userIds.length > 0
        ? await supabase
            .from('user_role_bindings')
            .select('user_id, role_id')
            .in('user_id', userIds)
        : { data: [] }

    const roleIds = [...new Set((roleBindings || []).map((rb: any) => rb.role_id).filter(Boolean))]
    const { data: roles } =
      roleIds.length > 0
        ? await supabase
            .from('roles')
            .select('id, name, description')
            .in('id', roleIds)
            .is('deleted_at', null)
        : { data: [] }

    // Create lookup maps
    const departmentsMap = new Map((departments || []).map((d: any) => [d.id, d]))
    const rolesMap = new Map((roles || []).map((r: any) => [r.id, r]))
    const userRolesMap = new Map<string, any[]>()
    ;(roleBindings || []).forEach((rb: any) => {
      if (!userRolesMap.has(rb.user_id)) {
        userRolesMap.set(rb.user_id, [])
      }
      const role = rolesMap.get(rb.role_id)
      if (role) {
        userRolesMap.get(rb.user_id)!.push(role)
      }
    })

    // Combine profiles with relations
    const usersWithRoles = (profiles || []).map((profile: any) => ({
      ...profile,
      department: profile.department_id ? departmentsMap.get(profile.department_id) || null : null,
      roles: userRolesMap.get(profile.user_id) || [],
      clerk_user_id: profile.user_id,
    }))

    return NextResponse.json({
      data: usersWithRoles,
      count: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize),
    })
  } catch (error: any) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch users' },
      { status: 500 }
    )
  }
}

