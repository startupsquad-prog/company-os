import { NextRequest, NextResponse } from 'next/server'
import { getUnifiedClient } from '@/lib/db/unified-client'

/**
 * GET /api/unified/tasks/[id]
 * Get a single task by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = getUnifiedClient()

    const { data: task, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Task not found' }, { status: 404 })
      }
      throw new Error(`Failed to fetch task: ${error.message}`)
    }

    // Fetch related data separately (PostgREST can't resolve cross-schema foreign keys)
    const [assigneesResult, departmentResult, createdByResult, updatedByResult] = await Promise.all([
      // Fetch assignees
      supabase
        .from('task_assignees')
        .select('*')
        .eq('task_id', id),
      // Fetch department
      task.department_id
        ? supabase
            .from('departments')
            .select('id, name')
            .eq('id', task.department_id)
            .single()
        : Promise.resolve({ data: null }),
      // Fetch created_by profile
      task.created_by
        ? supabase
            .from('profiles')
            .select('id, first_name, last_name, email, avatar_url')
            .eq('id', task.created_by)
            .single()
        : Promise.resolve({ data: null }),
      // Fetch updated_by profile
      task.updated_by
        ? supabase
            .from('profiles')
            .select('id, first_name, last_name, email, avatar_url')
            .eq('id', task.updated_by)
            .single()
        : Promise.resolve({ data: null }),
    ])

    const assignees = assigneesResult.data || []
    const profileIds = [...new Set(assignees.map((a: any) => a.profile_id).filter(Boolean))]
    
    // Fetch profiles for assignees
    const { data: assigneeProfiles } = profileIds.length > 0
      ? await supabase
          .from('profiles')
          .select('id, first_name, last_name, email, avatar_url')
          .in('id', profileIds)
      : { data: [] }

    const profilesMap = new Map((assigneeProfiles || []).map((p: any) => [p.id, p]))

    const assigneesWithProfiles = assignees.map((assignee: any) => ({
      ...assignee,
      profile: profilesMap.get(assignee.profile_id) || null,
    }))

    return NextResponse.json({
      data: {
        ...task,
        department: departmentResult.data,
        assignees: assigneesWithProfiles,
        created_by_profile: createdByResult.data,
        updated_by_profile: updatedByResult.data,
      },
    })
  } catch (error: any) {
    console.error('Error fetching task:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch task' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/unified/tasks/[id]
 * Update a task
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const supabase = getUnifiedClient()

    const updateData: Record<string, any> = {}
    if (body.title !== undefined) updateData.title = body.title
    if (body.description !== undefined) updateData.description = body.description
    if (body.priority !== undefined) updateData.priority = body.priority
    if (body.status !== undefined) updateData.status = body.status
    if (body.department_id !== undefined) updateData.department_id = body.department_id
    if (body.vertical_id !== undefined) updateData.vertical_id = body.vertical_id
    if (body.vertical_key !== undefined) updateData.vertical_key = body.vertical_key
    if (body.due_date !== undefined) updateData.due_date = body.due_date
    if (body.estimated_duration !== undefined) updateData.estimated_duration = body.estimated_duration
    if (body.important_links !== undefined) updateData.important_links = body.important_links
    if (body.position !== undefined) updateData.position = body.position
    if (body.updated_by !== undefined) updateData.updated_by = body.updated_by

    const { data: task, error } = await supabase
      .from('tasks')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update task: ${error.message}`)
    }

    // Update assignees if provided
    if (body.assignees !== undefined) {
      // Delete existing assignees
      await supabase
        .from('task_assignees')
        .delete()
        .eq('task_id', id)

      // Insert new assignees
      if (body.assignees.length > 0) {
        const assigneesData = body.assignees.map((a: any) => ({
          task_id: id,
          profile_id: a.profile_id,
          role: a.role || 'collaborator',
        }))

        const { error: assigneeError } = await supabase
          .from('task_assignees')
          .insert(assigneesData)

        if (assigneeError) {
          console.error('Error updating assignees:', assigneeError)
          // Don't fail the request
        }
      }
    }

    return NextResponse.json({ data: task })
  } catch (error: any) {
    console.error('Error updating task:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update task' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/unified/tasks/[id]
 * Soft delete a task
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = getUnifiedClient()

    const { error } = await supabase
      .from('tasks')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)

    if (error) {
      throw new Error(`Failed to delete task: ${error.message}`)
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting task:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete task' },
      { status: 500 }
    )
  }
}

