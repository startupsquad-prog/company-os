import { NextRequest, NextResponse } from 'next/server'
import { fromCommonUtil, fromCore } from '@/lib/db/schema-helpers'
import { calculateProjectProgress } from '@/lib/db/projects'

/**
 * GET /api/unified/projects
 * Fetch projects with filters, pagination, and sorting
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams

    // Parse query parameters
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '10')
    const search = searchParams.get('search') || ''
    const view = searchParams.get('view') || 'grid' // 'grid' | 'table'
    const verticalId = searchParams.get('verticalId') || undefined

    // Build filters
    const filters: Record<string, any> = {}
    const statusFilter = searchParams.get('status')
    if (statusFilter) {
      filters.status = statusFilter.split(',')
    }
    const categoryFilter = searchParams.get('category')
    if (categoryFilter) {
      filters.category = categoryFilter.split(',')
    }
    const departmentId = searchParams.get('department_id')
    if (departmentId) {
      filters.department_id = departmentId
    }
    if (verticalId && verticalId !== 'all') {
      filters.vertical_key = verticalId
    }

    // Build query using schema-aware helper
    // Note: We fetch departments separately because foreign key references
    // across schemas (common_util -> core) don't work reliably in Supabase
    let query = fromCommonUtil('projects')
      .select('*', { count: 'exact' })
      .is('deleted_at', null)

    // Apply filters
    if (filters.status && Array.isArray(filters.status)) {
      query = query.in('status', filters.status)
    }
    if (filters.category && Array.isArray(filters.category)) {
      query = query.in('category', filters.category)
    }
    if (filters.department_id) {
      query = query.eq('department_id', filters.department_id)
    }
    if (filters.vertical_key) {
      query = query.eq('vertical_key', filters.vertical_key)
    }

    // Apply search
    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`)
    }

    // Apply sorting
    const sortField = searchParams.get('sortField') || 'created_at'
    const sortDirection = searchParams.get('sortDirection') || 'desc'
    query = query.order(sortField, { ascending: sortDirection === 'asc' })

    // Apply pagination (only for table view)
    if (view !== 'grid') {
      const from = (page - 1) * pageSize
      const to = from + pageSize - 1
      query = query.range(from, to)
    }

    const { data: projects, error, count } = await query

    if (error) {
      console.error('Projects query error:', error)
      throw new Error(`Failed to fetch projects: ${error.message || JSON.stringify(error)}`)
    }

    // Fetch related data separately
    const projectIds = (projects || []).map((p: any) => p.id)

    // Fetch all members for all projects
    const { data: allMembers } = projectIds.length > 0
      ? await fromCommonUtil('project_members')
          .select('*')
          .in('project_id', projectIds)
      : { data: [] }

    // Fetch all departments
    const departmentIds = [...new Set((projects || []).map((p: any) => p.department_id).filter(Boolean))]
    const { data: departments } = departmentIds.length > 0
      ? await fromCore('departments')
          .select('id, name')
          .in('id', departmentIds)
      : { data: [] }

    // Fetch all profiles
    const profileIds = [
      ...new Set([
        ...(projects || []).map((p: any) => p.created_by).filter(Boolean),
        ...(projects || []).map((p: any) => p.updated_by).filter(Boolean),
        ...(allMembers || []).map((m: any) => m.profile_id).filter(Boolean),
      ]),
    ]
    const { data: profiles } = profileIds.length > 0
      ? await fromCore('profiles')
          .select('id, first_name, last_name, email, avatar_url')
          .in('id', profileIds)
      : { data: [] }

    // Create lookup maps
    const departmentsMap = new Map((departments || []).map((d: any) => [d.id, d]))
    const profilesMap = new Map((profiles || []).map((p: any) => [p.id, p]))
    const membersByProject = new Map<string, any[]>()
    ;(allMembers || []).forEach((member: any) => {
      if (!membersByProject.has(member.project_id)) {
        membersByProject.set(member.project_id, [])
      }
      membersByProject.get(member.project_id)!.push({
        ...member,
        profile: profilesMap.get(member.profile_id) || null,
      })
    })

    // Calculate progress for each project
    const projectsWithProgress = await Promise.all(
      (projects || []).map(async (project: any) => {
        try {
          const progressData = await calculateProjectProgress(project.id)
          return {
            ...project,
            progress: progressData.progress,
            total_tasks: progressData.total_tasks,
            completed_tasks: progressData.completed_tasks,
          }
        } catch (error) {
          console.error(`Error calculating progress for project ${project.id}:`, error)
          return {
            ...project,
            progress: 0,
            total_tasks: 0,
            completed_tasks: 0,
          }
        }
      })
    )

    // Combine projects with relations
    const projectsWithRelations = projectsWithProgress.map((project: any) => ({
      ...project,
      department: project.department_id ? departmentsMap.get(project.department_id) || null : null,
      members: membersByProject.get(project.id) || [],
      created_by_profile: project.created_by ? profilesMap.get(project.created_by) || null : null,
      updated_by_profile: project.updated_by ? profilesMap.get(project.updated_by) || null : null,
    }))

    return NextResponse.json({
      data: projectsWithRelations,
      count: count || 0,
      page,
      pageSize,
      totalPages: view === 'grid' ? 1 : Math.ceil((count || 0) / pageSize),
    })
  } catch (error: any) {
    console.error('Error fetching projects:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch projects' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/unified/projects
 * Create a new project
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const projectData = {
      name: body.name,
      description: body.description,
      category: body.category,
      status: body.status || 'planning',
      start_date: body.start_date,
      due_date: body.due_date,
      department_id: body.department_id,
      vertical_key: body.vertical_key,
      created_by: body.created_by,
      updated_by: body.updated_by || body.created_by,
    }

    const { data: project, error } = await fromCommonUtil('projects')
      .insert(projectData)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create project: ${error.message}`)
    }

    // Add members if provided
    if (body.members && body.members.length > 0) {
      const membersData = body.members.map((m: any) => ({
        project_id: project.id,
        profile_id: m.profile_id,
        role: m.role || 'collaborator',
      }))

      const { error: memberError } = await fromCommonUtil('project_members')
        .insert(membersData)

      if (memberError) {
        console.error('Error adding members:', memberError)
        // Don't fail the request, just log the error
      }
    }

    return NextResponse.json({ data: project }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating project:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create project' },
      { status: 500 }
    )
  }
}

