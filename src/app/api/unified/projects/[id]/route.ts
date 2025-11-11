import { NextRequest, NextResponse } from 'next/server'
import { fromCommonUtil, fromCore } from '@/lib/db/schema-helpers'
import { calculateProjectProgress, getProjectTasks } from '@/lib/db/projects'

/**
 * GET /api/unified/projects/[id]
 * Get a single project by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const { data: project, error } = await fromCommonUtil('projects')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Project not found' }, { status: 404 })
      }
      throw new Error(`Failed to fetch project: ${error.message}`)
    }

    const projectTyped = project as any

    // Fetch related data separately
    const [membersResult, departmentResult, createdByResult, updatedByResult, statusHistoryResult, tasksResult] =
      await Promise.all([
        // Fetch members
        fromCommonUtil('project_members')
          .select('*')
          .eq('project_id', id),
        // Fetch department
        projectTyped.department_id
          ? fromCore('departments')
              .select('id, name')
              .eq('id', projectTyped.department_id)
              .single()
          : Promise.resolve({ data: null }),
        // Fetch created_by profile
        projectTyped.created_by
          ? fromCore('profiles')
              .select('id, first_name, last_name, email, avatar_url')
              .eq('id', projectTyped.created_by)
              .single()
          : Promise.resolve({ data: null }),
        // Fetch updated_by profile
        projectTyped.updated_by
          ? fromCore('profiles')
              .select('id, first_name, last_name, email, avatar_url')
              .eq('id', projectTyped.updated_by)
              .single()
          : Promise.resolve({ data: null }),
        // Fetch status history
        fromCommonUtil('project_status_history')
          .select('*')
          .eq('project_id', id)
          .order('changed_at', { ascending: false }),
        // Fetch tasks
        getProjectTasks(id).catch(() => []),
      ])

    const members = membersResult.data || []
    const profileIds = [...new Set(members.map((m: any) => m.profile_id).filter(Boolean))]

    // Fetch profiles for members
    const { data: memberProfiles } = profileIds.length > 0
      ? await fromCore('profiles')
          .select('id, first_name, last_name, email, avatar_url')
          .in('id', profileIds)
      : { data: [] }

    const profilesMap = new Map((memberProfiles || []).map((p: any) => [p.id, p]))

    const membersWithProfiles = members.map((member: any) => ({
      ...member,
      profile: profilesMap.get(member.profile_id) || null,
    }))

    // Fetch changed_by profiles for status history
    const statusHistory = statusHistoryResult.data || []
    const changedByIds = [...new Set(statusHistory.map((h: any) => h.changed_by).filter(Boolean))]
    const { data: changedByProfiles } = changedByIds.length > 0
      ? await fromCore('profiles')
          .select('id, first_name, last_name, email, avatar_url')
          .in('id', changedByIds)
      : { data: [] }

    const changedByProfilesMap = new Map((changedByProfiles || []).map((p: any) => [p.id, p]))

    const statusHistoryWithProfiles = statusHistory.map((history: any) => ({
      ...history,
      changed_by_profile: history.changed_by ? changedByProfilesMap.get(history.changed_by) || null : null,
    }))

    // Calculate progress
    const progressData = await calculateProjectProgress(id).catch(() => ({
      progress: 0,
      total_tasks: 0,
      completed_tasks: 0,
    }))

    return NextResponse.json({
      data: {
        ...projectTyped,
        department: departmentResult.data,
        members: membersWithProfiles,
        created_by_profile: createdByResult.data,
        updated_by_profile: updatedByResult.data,
        status_history: statusHistoryWithProfiles,
        tasks: tasksResult || [],
        progress: progressData.progress,
        total_tasks: progressData.total_tasks,
        completed_tasks: progressData.completed_tasks,
      },
    })
  } catch (error: any) {
    console.error('Error fetching project:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch project' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/unified/projects/[id]
 * Update a project
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const updateData: Record<string, any> = {}
    if (body.name !== undefined) updateData.name = body.name
    if (body.description !== undefined) updateData.description = body.description
    if (body.category !== undefined) updateData.category = body.category
    if (body.status !== undefined) updateData.status = body.status
    if (body.start_date !== undefined) updateData.start_date = body.start_date
    if (body.due_date !== undefined) updateData.due_date = body.due_date
    if (body.department_id !== undefined) updateData.department_id = body.department_id
    if (body.vertical_key !== undefined) updateData.vertical_key = body.vertical_key
    if (body.updated_by !== undefined) updateData.updated_by = body.updated_by

    const { data: project, error } = await fromCommonUtil('projects')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update project: ${error.message}`)
    }

    // Update members if provided
    if (body.members !== undefined) {
      // Delete existing members
      await fromCommonUtil('project_members')
        .delete()
        .eq('project_id', id)

      // Insert new members
      if (body.members.length > 0) {
        const membersData = body.members.map((m: any) => ({
          project_id: id,
          profile_id: m.profile_id,
          role: m.role || 'collaborator',
        }))

        const { error: memberError } = await fromCommonUtil('project_members')
          .insert(membersData)

        if (memberError) {
          console.error('Error updating members:', memberError)
          // Don't fail the request
        }
      }
    }

    return NextResponse.json({ data: project })
  } catch (error: any) {
    console.error('Error updating project:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update project' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/unified/projects/[id]
 * Soft delete a project
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const { error } = await fromCommonUtil('projects')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)

    if (error) {
      throw new Error(`Failed to delete project: ${error.message}`)
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting project:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete project' },
      { status: 500 }
    )
  }
}

