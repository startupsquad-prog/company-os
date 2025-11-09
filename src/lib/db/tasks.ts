import { createServerClient } from '@/lib/supabase/server'
import type {
  Task,
  TaskInsert,
  TaskUpdate,
  TaskWithRelations,
  TaskCommentInsert,
  TaskAssigneeInsert,
  ActivityEventInsert,
} from '@/lib/types/supabase'
// Notification triggers are imported dynamically to avoid circular dependencies

export interface TaskFilter {
  status?: string
  priority?: string
  department_id?: string
  vertical_key?: string
  assigned_to?: string // profile_id
  created_by?: string // profile_id
  due_date_from?: string
  due_date_to?: string
}

/**
 * Get current user's profile ID
 */
async function getCurrentProfileId(supabase: Awaited<ReturnType<typeof createServerClient>>) {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  // Using public schema views for PostgREST compatibility
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!profile) {
    throw new Error('Profile not found')
  }

  return profile.id
}

/**
 * Log activity event
 */
async function logActivityEvent(
  supabase: Awaited<ReturnType<typeof createServerClient>>,
  event: Omit<ActivityEventInsert, 'created_by'>
) {
  const profileId = await getCurrentProfileId(supabase)

  // Note: activity_events view would need to be created if needed
  // For now, skipping activity logging if view doesn't exist
  // await supabase.from('activity_events').insert({
  //   ...event,
  //   created_by: profileId,
  // })
}

/**
 * Get tasks with filters
 */
export async function getTasks(filter: TaskFilter = {}) {
  const supabase = await createServerClient()
  let query = supabase
    .from('tasks')
    .select(`
      *,
      department:departments!tasks_department_id_fkey(*),
      created_by_profile:profiles!tasks_created_by_fkey(*),
      updated_by_profile:profiles!tasks_updated_by_fkey(*)
    `)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  // Apply filters
  if (filter.status) {
    query = query.eq('status', filter.status)
  }
  if (filter.priority) {
    query = query.eq('priority', filter.priority)
  }
  if (filter.department_id) {
    query = query.eq('department_id', filter.department_id)
  }
  if (filter.vertical_key) {
    query = query.eq('vertical_key', filter.vertical_key)
  }
  if (filter.created_by) {
    query = query.eq('created_by', filter.created_by)
  }
  if (filter.due_date_from) {
    query = query.gte('due_date', filter.due_date_from)
  }
  if (filter.due_date_to) {
    query = query.lte('due_date', filter.due_date_to)
  }

  const { data: tasks, error } = await query

  if (error) {
    throw new Error(`Failed to fetch tasks: ${error.message}`)
  }

  // If filtering by assigned_to, filter in memory (RLS handles access)
  let filteredTasks = tasks || []
  if (filter.assigned_to) {
    const assigneeQuery = await supabase
      .from('task_assignees')
      .select('task_id')
      .eq('profile_id', filter.assigned_to)

    if (assigneeQuery.data) {
      const assignedTaskIds = new Set(assigneeQuery.data.map((a) => a.task_id))
      filteredTasks = filteredTasks.filter((t) => assignedTaskIds.has(t.id))
    }
  }

  // Fetch assignees and latest status for each task
  const tasksWithRelations: TaskWithRelations[] = await Promise.all(
    filteredTasks.map(async (task) => {
      // Get assignees
      const { data: assignees } = await supabase
        .from('task_assignees')
        .select(`
          *,
          profile:profiles!task_assignees_profile_id_fkey(*)
        `)
        .eq('task_id', task.id)

      // Get latest status
      const { data: statusHistory } = await supabase
        .from('task_status_history')
        .select('*')
        .eq('task_id', task.id)
        .order('changed_at', { ascending: false })
        .limit(1)
        .single()

      return {
        ...task,
        assignees: assignees || [],
        latest_status: statusHistory || null,
        department: task.department || null,
        created_by_profile: task.created_by_profile || null,
        updated_by_profile: task.updated_by_profile || null,
      } as TaskWithRelations
    })
  )

  return tasksWithRelations
}

/**
 * Get task by ID
 */
export async function getTaskById(id: string): Promise<TaskWithRelations | null> {
  const supabase = await createServerClient()

  const { data: task, error } = await supabase
    .from('tasks')
    .select(`
      *,
      department:departments!tasks_department_id_fkey(*),
      created_by_profile:profiles!tasks_created_by_fkey(*),
      updated_by_profile:profiles!tasks_updated_by_fkey(*)
    `)
    .eq('id', id)
    .is('deleted_at', null)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return null // Not found
    }
    throw new Error(`Failed to fetch task: ${error.message}`)
  }

  if (!task) {
    return null
  }

  // Get assignees
  const { data: assignees } = await supabase
    .from('task_assignees')
    .select(`
      *,
      profile:profiles!task_assignees_profile_id_fkey(*)
    `)
    .eq('task_id', id)

  // Get latest status
  const { data: latestStatus } = await supabase
    .from('task_status_history')
    .select('*')
    .eq('task_id', id)
    .order('changed_at', { ascending: false })
    .limit(1)
    .single()

  return {
    ...task,
    assignees: assignees || [],
    latest_status: latestStatus || null,
    department: task.department || null,
    created_by_profile: task.created_by_profile || null,
    updated_by_profile: task.updated_by_profile || null,
  } as TaskWithRelations
}

/**
 * Create a new task
 */
export async function createTask(data: Omit<TaskInsert, 'id' | 'created_at' | 'updated_at'>) {
  const supabase = await createServerClient()
  const profileId = await getCurrentProfileId(supabase)

  const taskData: TaskInsert = {
    ...data,
    created_by: profileId,
    updated_by: profileId,
  }

  const { data: task, error } = await supabase
    .from('tasks')
    .insert(taskData)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create task: ${error.message}`)
  }

  // Log activity
  await logActivityEvent(supabase, {
    entity_type: 'task',
    entity_id: task.id,
    action: 'created',
    metadata: { title: task.title },
  })

  // Trigger notification for task creation (will notify assignees if any)
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    const { triggerNotification } = await import('@/lib/notifications/trigger-notification')
    // Notification will be created for assignees when they're added
    // For now, just trigger if task has assignees
    triggerNotification('task', task.id, 'created', 'task_assigned', {
      actorId: user.id,
    }).catch((err) => console.error('Failed to trigger task creation notification:', err))
  }

  return task
}

/**
 * Update a task
 */
export async function updateTask(id: string, data: TaskUpdate) {
  const supabase = await createServerClient()
  const profileId = await getCurrentProfileId(supabase)

  const updateData: TaskUpdate = {
    ...data,
    updated_by: profileId,
  }

  const { data: task, error } = await supabase
    .from('tasks')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to update task: ${error.message}`)
  }

  // Log activity
  await logActivityEvent(supabase, {
    entity_type: 'task',
    entity_id: id,
    action: 'updated',
    metadata: { changes: data },
  })

  // Trigger notification for status change
  if (data.status) {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { triggerNotification } = await import('@/lib/notifications/trigger-notification')
      triggerNotification('task', id, 'status_changed', 'task_status_changed', {
        actorId: user.id,
        metadata: { new_status: data.status },
      }).catch((err) => console.error('Failed to trigger status change notification:', err))
    }
  }

  return task
}

/**
 * Add a comment to a task
 */
export async function addComment(taskId: string, body: string) {
  const supabase = await createServerClient()
  const profileId = await getCurrentProfileId(supabase)
  const { data: currentUser } = await supabase.auth.getUser()

  const commentData: TaskCommentInsert = {
    task_id: taskId,
    author_id: profileId,
    body,
  }

  const { data: comment, error } = await supabase
    .from('task_comments')
    .insert(commentData)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to add comment: ${error.message}`)
  }

  // Log activity
  await logActivityEvent(supabase, {
    entity_type: 'task',
    entity_id: taskId,
    action: 'comment_added',
    metadata: { comment_id: comment.id },
  })

  // Trigger notification for task assignees
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    const { triggerNotification } = await import('@/lib/notifications/trigger-notification')
    triggerNotification('task', taskId, 'commented', 'task_commented', {
      actorId: user.id,
      metadata: { comment_id: comment.id, comment_body: body },
    }).catch((err) => console.error('Failed to trigger comment notification:', err))
  }

  return comment
}

/**
 * Assign a user to a task
 */
export async function assignUser(
  taskId: string,
  profileId: string,
  role: 'owner' | 'collaborator' | 'watcher' = 'collaborator'
) {
  const supabase = await createServerClient()
  const currentProfileId = await getCurrentProfileId(supabase)

  // Get user_id from profile_id for notification
  const { data: assigneeProfile } = await supabase
    .from('profiles')
    .select('user_id')
    .eq('id', profileId)
    .single()

  const assigneeData: TaskAssigneeInsert = {
    task_id: taskId,
    profile_id: profileId,
    role,
  }

  const { data: assignee, error } = await supabase
    .from('task_assignees')
    .insert(assigneeData)
    .select()
    .single()

  if (error) {
    // If duplicate, return existing
    if (error.code === '23505') {
      const { data: existing } = await supabase
        .from('task_assignees')
        .select()
        .eq('task_id', taskId)
        .eq('profile_id', profileId)
        .single()

      return existing
    }
    throw new Error(`Failed to assign user: ${error.message}`)
  }

  // Log activity
  await logActivityEvent(supabase, {
    entity_type: 'task',
    entity_id: taskId,
    action: 'user_assigned',
    metadata: { profile_id: profileId, role },
  })

  // Trigger notification for assigned user
  if (assigneeProfile?.user_id) {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { triggerNotification } = await import('@/lib/notifications/trigger-notification')
      triggerNotification('task', taskId, 'assigned', 'task_assigned', {
        actorId: user.id,
        recipients: [assigneeProfile.user_id],
        metadata: { profile_id: profileId, role },
      }).catch((err) => console.error('Failed to trigger assignment notification:', err))
    }
  }

  return assignee
}

/**
 * Get overdue tasks count
 * Returns count of tasks that are past their due date and not completed
 */
export async function getOverdueTasksCount(assignedTo?: string): Promise<number> {
  const supabase = await createServerClient()
  const now = new Date().toISOString()

  // If filtering by assigned_to, we need to get assigned task IDs first
  if (assignedTo) {
    const { data: assignedTasks, error: assigneeError } = await supabase
      .from('task_assignees')
      .select('task_id')
      .eq('profile_id', assignedTo)

    if (assigneeError) {
      throw new Error(`Failed to fetch assigned tasks: ${assigneeError.message}`)
    }

    if (!assignedTasks || assignedTasks.length === 0) {
      return 0
    }

    const assignedTaskIds = assignedTasks.map((a) => a.task_id)
    
    const { count, error } = await supabase
      .from('tasks')
      .select('id', { count: 'exact', head: true })
      .is('deleted_at', null)
      .not('due_date', 'is', null)
      .lt('due_date', now)
      .neq('status', 'completed')
      .in('id', assignedTaskIds)

    if (error) {
      throw new Error(`Failed to fetch overdue tasks count: ${error.message}`)
    }

    return count || 0
  }

  // No assigned_to filter - get all overdue tasks
  const { count, error } = await supabase
    .from('tasks')
    .select('id', { count: 'exact', head: true })
    .is('deleted_at', null)
    .not('due_date', 'is', null)
    .lt('due_date', now)
    .neq('status', 'completed')

  if (error) {
    throw new Error(`Failed to fetch overdue tasks count: ${error.message}`)
  }

  return count || 0
}

/**
 * Get overdue tasks list
 * Returns list of tasks that are past their due date and not completed
 */
export async function getOverdueTasks(assignedTo?: string): Promise<TaskWithRelations[]> {
  const supabase = await createServerClient()
  const now = new Date().toISOString()

  let query = supabase
    .from('tasks')
    .select(`
      *,
      department:departments!tasks_department_id_fkey(*),
      created_by_profile:profiles!tasks_created_by_fkey(*),
      updated_by_profile:profiles!tasks_updated_by_fkey(*)
    `)
    .is('deleted_at', null)
    .not('due_date', 'is', null)
    .lt('due_date', now)
    .neq('status', 'completed')
    .order('due_date', { ascending: true })

  const { data: tasks, error } = await query

  if (error) {
    throw new Error(`Failed to fetch overdue tasks: ${error.message}`)
  }

  // If filtering by assigned_to, filter in memory
  let filteredTasks = tasks || []
  if (assignedTo) {
    const { data: assignedTasks } = await supabase
      .from('task_assignees')
      .select('task_id')
      .eq('profile_id', assignedTo)

    if (assignedTasks) {
      const assignedTaskIds = new Set(assignedTasks.map((a) => a.task_id))
      filteredTasks = filteredTasks.filter((t) => assignedTaskIds.has(t.id))
    }
  }

  // Fetch assignees for each task
  const tasksWithRelations: TaskWithRelations[] = await Promise.all(
    filteredTasks.map(async (task) => {
      const { data: assignees } = await supabase
        .from('task_assignees')
        .select(`
          *,
          profile:profiles!task_assignees_profile_id_fkey(*)
        `)
        .eq('task_id', task.id)

      return {
        ...task,
        assignees: assignees || [],
        latest_status: null,
        department: task.department || null,
        created_by_profile: task.created_by_profile || null,
        updated_by_profile: task.updated_by_profile || null,
      } as TaskWithRelations
    })
  )

  return tasksWithRelations
}

