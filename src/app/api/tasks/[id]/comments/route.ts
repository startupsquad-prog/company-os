import { NextRequest, NextResponse } from 'next/server'
import { addComment } from '@/lib/db/tasks'
import { fromCommonUtil } from '@/lib/db/schema-helpers'

/**
 * POST /api/tasks/[id]/comments
 * Add a comment to a task
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    if (!id) {
      return NextResponse.json({ error: 'Task ID is required' }, { status: 400 })
    }

    const body = await request.json()

    if (!body.body || typeof body.body !== 'string' || body.body.trim().length === 0) {
      return NextResponse.json({ error: 'Comment body is required' }, { status: 400 })
    }

    // Verify task exists
    const { data: task, error: taskError } = await fromCommonUtil('tasks')
      .select('id')
      .eq('id', id)
      .is('deleted_at', null)
      .single()

    if (taskError || !task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    const comment = await addComment(id, body.body.trim())

    return NextResponse.json({ data: comment }, { status: 201 })
  } catch (error) {
    console.error('Error adding comment:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to add comment' },
      { status: 500 }
    )
  }
}
