import { NextRequest, NextResponse } from 'next/server'
import { assignUser } from '@/lib/db/tasks'
import { createServerClient } from '@/lib/supabase/server'

/**
 * POST /api/tasks/[id]/assign
 * Assign a user to a task
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    if (!id) {
      return NextResponse.json({ error: 'Task ID is required' }, { status: 400 })
    }

    const body = await request.json()

    if (!body.profile_id) {
      return NextResponse.json({ error: 'profile_id is required' }, { status: 400 })
    }

    const role = body.role || 'collaborator'
    if (!['owner', 'collaborator', 'watcher'].includes(role)) {
      return NextResponse.json(
        { error: 'role must be one of: owner, collaborator, watcher' },
        { status: 400 }
      )
    }

    // Verify task exists
    const supabase = await createServerClient()
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select('id')
      .eq('id', id)
      .is('deleted_at', null)
      .single()

    if (taskError || !task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    // Verify profile exists
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', body.profile_id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    const assignee = await assignUser(id, body.profile_id, role as 'owner' | 'collaborator' | 'watcher')

    return NextResponse.json({ data: assignee }, { status: 201 })
  } catch (error) {
    console.error('Error assigning user:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to assign user' },
      { status: 500 }
    )
  }
}

