import { NextRequest, NextResponse } from 'next/server'
import { getUnifiedClient } from '@/lib/db/unified-client'

/**
 * GET /api/unified/tasks
 * Fetch tasks with filters, pagination, and sorting
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
    const verticalId = searchParams.get('verticalId') || undefined

    // Build filters
    const filters: Record<string, any> = {}
    const statusFilter = searchParams.get('status')
    if (statusFilter) {
      filters.status = statusFilter.split(',')
    }
    const priorityFilter = searchParams.get('priority')
    if (priorityFilter) {
      filters.priority = priorityFilter.split(',')
    }
    const departmentId = searchParams.get('department_id')
    if (departmentId) {
      filters.department_id = departmentId
    }
    if (verticalId && verticalId !== 'all') {
      filters.vertical_id = verticalId
    }

    // Build query
    let query = supabase
      .from('tasks')
      .select(
        `
        *,
        department:departments!tasks_department_id_fkey(id, name)
      `,
        { count: 'exact' }
      )
      .is('deleted_at', null)

    // Apply filters
    if (filters.status && Array.isArray(filters.status)) {
      query = query.in('status', filters.status)
    }
    if (filters.priority && Array.isArray(filters.priority)) {
      query = query.in('priority', filters.priority)
    }
    if (filters.department_id) {
      query = query.eq('department_id', filters.department_id)
    }
    if (filters.vertical_id) {
      query = query.eq('vertical_id', filters.vertical_id)
    }

    // Apply search
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`)
    }

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

    const { data: tasks, error, count } = await query

    if (error) {
      throw new Error(`Failed to fetch tasks: ${error.message}`)
    }

    // Fetch related data separately (PostgREST can't resolve cross-schema foreign keys)
    const taskIds = (tasks || []).map((t: any) => t.id)
    
    // Fetch all assignees for all tasks in one query
    const { data: allAssignees } = taskIds.length > 0
      ? await supabase
          .from('task_assignees')
          .select('*')
          .in('task_id', taskIds)
      : { data: [] }

    // Fetch all departments
    const departmentIds = [...new Set((tasks || []).map((t: any) => t.department_id).filter(Boolean))]
    const { data: departments } = departmentIds.length > 0
      ? await supabase
          .from('departments')
          .select('id, name')
          .in('id', departmentIds)
      : { data: [] }

    // Fetch all profiles (created_by, updated_by, assignees)
    const profileIds = [
      ...new Set([
        ...(tasks || []).map((t: any) => t.created_by).filter(Boolean),
        ...(tasks || []).map((t: any) => t.updated_by).filter(Boolean),
        ...(allAssignees || []).map((a: any) => a.profile_id).filter(Boolean),
      ]),
    ]
    const { data: profiles } = profileIds.length > 0
      ? await supabase
          .from('profiles')
          .select('id, first_name, last_name, email, avatar_url')
          .in('id', profileIds)
      : { data: [] }

    // Create lookup maps
    const departmentsMap = new Map((departments || []).map((d: any) => [d.id, d]))
    const profilesMap = new Map((profiles || []).map((p: any) => [p.id, p]))
    const assigneesByTask = new Map<string, any[]>()
    ;(allAssignees || []).forEach((assignee: any) => {
      if (!assigneesByTask.has(assignee.task_id)) {
        assigneesByTask.set(assignee.task_id, [])
      }
      assigneesByTask.get(assignee.task_id)!.push({
        ...assignee,
        profile: profilesMap.get(assignee.profile_id) || null,
      })
    })

    // Combine tasks with relations
    const tasksWithRelations = (tasks || []).map((task: any) => ({
      ...task,
      department: task.department_id ? departmentsMap.get(task.department_id) || null : null,
      assignees: assigneesByTask.get(task.id) || [],
      created_by_profile: task.created_by ? profilesMap.get(task.created_by) || null : null,
      updated_by_profile: task.updated_by ? profilesMap.get(task.updated_by) || null : null,
    }))

    return NextResponse.json({
      data: tasksWithRelations,
      count: count || 0,
      page,
      pageSize,
      totalPages: view === 'kanban' ? 1 : Math.ceil((count || 0) / pageSize),
    })
  } catch (error: any) {
    console.error('Error fetching tasks:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch tasks' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/unified/tasks
 * Create a new task
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const supabase = getUnifiedClient()

    const taskData = {
      title: body.title,
      description: body.description,
      priority: body.priority || 'medium',
      status: body.status || 'pending',
      department_id: body.department_id,
      vertical_id: body.vertical_id,
      vertical_key: body.vertical_key,
      due_date: body.due_date,
      estimated_duration: body.estimated_duration,
      important_links: body.important_links || [],
      created_by: body.created_by,
      updated_by: body.updated_by || body.created_by,
    }

    const { data: task, error } = await supabase
      .from('tasks')
      .insert(taskData)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create task: ${error.message}`)
    }

      // Add assignees if provided
      if (body.assignees && body.assignees.length > 0) {
        const assigneesData = body.assignees.map((a: any) => ({
          task_id: task.id,
          profile_id: a.profile_id,
          role: a.role || 'collaborator',
        }))

        const { error: assigneeError } = await supabase
          .from('task_assignees')
        .insert(assigneesData)

      if (assigneeError) {
        console.error('Error adding assignees:', assigneeError)
        // Don't fail the request, just log the error
      }
    }

    return NextResponse.json({ data: task }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating task:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create task' },
      { status: 500 }
    )
  }
}

