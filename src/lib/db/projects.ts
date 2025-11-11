import { createServerClient } from '@/lib/supabase/server'
import { getClerkUserId } from '@/lib/auth/clerk'
import type {
  Project,
  ProjectInsert,
  ProjectUpdate,
  ProjectWithRelations,
  ProjectMemberInsert,
  ActivityEventInsert,
  TaskWithRelations,
} from '@/lib/types/supabase'
import type { ProjectFilter } from '@/lib/types/projects'
// Notification triggers are imported dynamically to avoid circular dependencies

/**
 * Get current user's profile ID using Clerk user ID
 */
async function getCurrentProfileId(supabase: Awaited<ReturnType<typeof createServerClient>>) {
  const userId = await getClerkUserId()

  if (!userId) {
    throw new Error('Unauthorized')
  }

  // Using public schema views for PostgREST compatibility
  const { data: profile } = await (supabase as any)
    .from('profiles')
    .select('id')
    .eq('user_id', userId)
    .single()

  const profileTyped = profile as any

  if (!profileTyped) {
    throw new Error('Profile not found')
  }

  return profileTyped.id
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
 * Calculate project progress from tasks
 */
export async function calculateProjectProgress(projectId: string): Promise<{
  progress: number
  total_tasks: number
  completed_tasks: number
}> {
  // Use schema-aware helper to prevent "relation does not exist" errors
  const { fromCommonUtil } = await import('@/lib/db/schema-helpers')
  
  const { data: tasks, error: tasksError } = await fromCommonUtil('tasks')
    .select('id, status')
    .eq('project_id', projectId)
    .is('deleted_at', null)

  if (tasksError) {
    throw new Error(`Failed to fetch tasks: ${tasksError.message}`)
  }

  const tasksTyped = (tasks || []) as any[]
  const totalTasks = tasksTyped.length
  const completedTasks = tasksTyped.filter((t: any) => t.status === 'completed').length

  const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  return {
    progress,
    total_tasks: totalTasks,
    completed_tasks: completedTasks,
  }
}

/**
 * Get projects with filters
 */
export async function getProjects(filter: ProjectFilter = {}): Promise<ProjectWithRelations[]> {
  const supabase = await createServerClient()
  let query = supabase
    .from('projects')
    .select(
      `
      *,
      department:departments!projects_department_id_fkey(*),
      created_by_profile:profiles!projects_created_by_fkey(*),
      updated_by_profile:profiles!projects_updated_by_fkey(*)
    `
    )
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  // Apply filters
  if (filter.status && filter.status.length > 0) {
    query = query.in('status', filter.status)
  }
  if (filter.category && filter.category.length > 0) {
    query = query.in('category', filter.category)
  }
  if (filter.department_id && filter.department_id.length > 0) {
    query = query.in('department_id', filter.department_id)
  }
  if (filter.vertical_key) {
    query = query.eq('vertical_key', filter.vertical_key)
  }
  if (filter.created_by && filter.created_by.length > 0) {
    query = query.in('created_by', filter.created_by)
  }
  if (filter.due_date_from) {
    query = query.gte('due_date', filter.due_date_from.toISOString())
  }
  if (filter.due_date_to) {
    query = query.lte('due_date', filter.due_date_to.toISOString())
  }
  if (filter.search) {
    query = query.or(`name.ilike.%${filter.search}%,description.ilike.%${filter.search}%`)
  }

  const { data: projects, error } = await query

  if (error) {
    throw new Error(`Failed to fetch projects: ${error.message}`)
  }

  // If filtering by assigned_to, filter in memory (RLS handles access)
  const projectsTyped = (projects || []) as any[]
  let filteredProjects = projectsTyped
  if (filter.assigned_to && filter.assigned_to.length > 0) {
    const memberQuery = await (supabase as any)
      .from('project_members')
      .select('project_id')
      .in('profile_id', filter.assigned_to)

    if (memberQuery.data) {
      const memberDataTyped = memberQuery.data as any[]
      const assignedProjectIds = new Set(memberDataTyped.map((m: any) => m.project_id))
      filteredProjects = filteredProjects.filter((p: any) => assignedProjectIds.has(p.id))
    }
  }

  // Fetch members and status history for each project
  const projectsWithRelations: ProjectWithRelations[] = await Promise.all(
    filteredProjects.map(async (project) => {
      // Get members
      const { data: members } = await supabase
        .from('project_members')
        .select(
          `
          *,
          profile:profiles!project_members_profile_id_fkey(*)
        `
        )
        .eq('project_id', project.id)

      // Get status history
      const { data: statusHistory } = await supabase
        .from('project_status_history')
        .select('*')
        .eq('project_id', project.id)
        .order('changed_at', { ascending: false })

      // Get changed_by profiles for status history
      const statusHistoryWithProfiles = await Promise.all(
        (statusHistory || []).map(async (history) => {
          if (!history.changed_by) {
            return { ...history, changed_by_profile: null }
          }
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', history.changed_by)
            .single()

          return {
            ...history,
            changed_by_profile: profile || null,
          }
        })
      )

      return {
        ...project,
        members: members || [],
        status_history: statusHistoryWithProfiles,
        department: project.department || null,
        created_by_profile: project.created_by_profile || null,
        updated_by_profile: project.updated_by_profile || null,
      } as ProjectWithRelations
    })
  )

  return projectsWithRelations
}

/**
 * Get project by ID
 */
export async function getProjectById(id: string): Promise<ProjectWithRelations | null> {
  const supabase = await createServerClient()

  const { data: project, error } = await supabase
    .from('projects')
    .select(
      `
      *,
      department:departments!projects_department_id_fkey(*),
      created_by_profile:profiles!projects_created_by_fkey(*),
      updated_by_profile:profiles!projects_updated_by_fkey(*)
    `
    )
    .eq('id', id)
    .is('deleted_at', null)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return null // Not found
    }
    throw new Error(`Failed to fetch project: ${error.message}`)
  }

  if (!project) {
    return null
  }

  const projectTyped = project as any

  // Get members
  const { data: members } = await supabase
    .from('project_members')
    .select(
      `
      *,
      profile:profiles!project_members_profile_id_fkey(*)
    `
    )
    .eq('project_id', id)

  // Get status history
  const { data: statusHistory } = await supabase
    .from('project_status_history')
    .select('*')
    .eq('project_id', id)
    .order('changed_at', { ascending: false })

  // Get changed_by profiles for status history
  const statusHistoryWithProfiles = await Promise.all(
    (statusHistory || []).map(async (history) => {
      if (!history.changed_by) {
        return { ...history, changed_by_profile: null }
      }
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', history.changed_by)
        .single()

      return {
        ...history,
        changed_by_profile: profile || null,
      }
    })
  )

  return {
    ...projectTyped,
    members: members || [],
    status_history: statusHistoryWithProfiles,
    department: projectTyped.department || null,
    created_by_profile: projectTyped.created_by_profile || null,
    updated_by_profile: projectTyped.updated_by_profile || null,
  } as ProjectWithRelations
}

/**
 * Get tasks for a project
 */
export async function getProjectTasks(projectId: string): Promise<TaskWithRelations[]> {
  const supabase = await createServerClient()

  const { data: tasks, error } = await supabase
    .from('tasks')
    .select(
      `
      *,
      department:departments!tasks_department_id_fkey(*),
      created_by_profile:profiles!tasks_created_by_fkey(*),
      updated_by_profile:profiles!tasks_updated_by_fkey(*)
    `
    )
    .eq('project_id', projectId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch project tasks: ${error.message}`)
  }

  const tasksTyped = (tasks || []) as any[]

  // Fetch assignees for each task
  const tasksWithRelations: TaskWithRelations[] = await Promise.all(
    tasksTyped.map(async (task) => {
      const { data: assignees } = await supabase
        .from('task_assignees')
        .select(
          `
          *,
          profile:profiles!task_assignees_profile_id_fkey(*)
        `
        )
        .eq('task_id', task.id)

      // Get latest status
      const { data: latestStatus } = await supabase
        .from('task_status_history')
        .select('*')
        .eq('task_id', task.id)
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
    })
  )

  return tasksWithRelations
}

/**
 * Create a new project
 */
export async function createProject(data: Omit<ProjectInsert, 'id' | 'created_at' | 'updated_at'>) {
  const supabase = await createServerClient()
  const profileId = await getCurrentProfileId(supabase)

  const projectData: ProjectInsert = {
    ...data,
    created_by: profileId,
    updated_by: profileId,
  }

  const { data: project, error } = await (supabase as any)
    .from('projects')
    .insert(projectData)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create project: ${error.message}`)
  }

  // Log activity
  await logActivityEvent(supabase, {
    entity_type: 'project',
    entity_id: project.id,
    action: 'created',
    metadata: { name: project.name },
  })

  return project
}

/**
 * Update a project
 */
export async function updateProject(id: string, data: ProjectUpdate) {
  const supabase = await createServerClient()
  const profileId = await getCurrentProfileId(supabase)

  const updateData: ProjectUpdate = {
    ...data,
    updated_by: profileId,
  }

  const { data: project, error } = await (supabase as any)
    .from('projects')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to update project: ${error.message}`)
  }

  // Log activity
  await logActivityEvent(supabase, {
    entity_type: 'project',
    entity_id: id,
    action: 'updated',
    metadata: { changes: data },
  })

  // Trigger notification for status change
  if (data.status) {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (user) {
      const { triggerNotification } = await import('@/lib/notifications/trigger-notification')
      triggerNotification('project', id, 'status_changed', 'project_status_changed', {
        actorId: user.id,
        metadata: { new_status: data.status },
      }).catch((err) => console.error('Failed to trigger status change notification:', err))
    }
  }

  return project
}

/**
 * Soft delete a project
 */
export async function deleteProject(id: string) {
  const supabase = await createServerClient()
  const profileId = await getCurrentProfileId(supabase)

  const { data: project, error } = await (supabase as any)
    .from('projects')
    .update({
      deleted_at: new Date().toISOString(),
      updated_by: profileId,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to delete project: ${error.message}`)
  }

  // Log activity
  await logActivityEvent(supabase, {
    entity_type: 'project',
    entity_id: id,
    action: 'deleted',
    metadata: { name: project.name },
  })

  return project
}

/**
 * Add a member to a project
 */
export async function addProjectMember(
  projectId: string,
  profileId: string,
  role: 'owner' | 'collaborator' | 'watcher' = 'collaborator'
) {
  const supabase = await createServerClient()
  const currentProfileId = await getCurrentProfileId(supabase)

  // Get user_id from profile_id for notification
  const { data: memberProfile } = await (supabase as any)
    .from('profiles')
    .select('user_id')
    .eq('id', profileId)
    .single()

  const memberProfileTyped = memberProfile as any

  const memberData: ProjectMemberInsert = {
    project_id: projectId,
    profile_id: profileId,
    role,
  }

  const { data: member, error } = await (supabase as any)
    .from('project_members')
    .insert(memberData)
    .select()
    .single()

  if (error) {
    // If duplicate, return existing
    if (error.code === '23505') {
      const { data: existing } = await (supabase as any)
        .from('project_members')
        .select()
        .eq('project_id', projectId)
        .eq('profile_id', profileId)
        .single()

      return existing
    }
    throw new Error(`Failed to add project member: ${error.message}`)
  }

  // Log activity
  await logActivityEvent(supabase, {
    entity_type: 'project',
    entity_id: projectId,
    action: 'member_added',
    metadata: { profile_id: profileId, role },
  })

  // Trigger notification for added member
  if (memberProfileTyped?.user_id) {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (user) {
      const { triggerNotification } = await import('@/lib/notifications/trigger-notification')
      triggerNotification('project', projectId, 'member_added', 'project_member_added', {
        actorId: user.id,
        recipients: [memberProfileTyped.user_id],
        metadata: { profile_id: profileId, role },
      }).catch((err) => console.error('Failed to trigger member addition notification:', err))
    }
  }

  return member
}

/**
 * Remove a member from a project
 */
export async function removeProjectMember(projectId: string, profileId: string) {
  const supabase = await createServerClient()

  const { error } = await (supabase as any)
    .from('project_members')
    .delete()
    .eq('project_id', projectId)
    .eq('profile_id', profileId)

  if (error) {
    throw new Error(`Failed to remove project member: ${error.message}`)
  }

  // Log activity
  await logActivityEvent(supabase, {
    entity_type: 'project',
    entity_id: projectId,
    action: 'member_removed',
    metadata: { profile_id: profileId },
  })

  return { success: true }
}

