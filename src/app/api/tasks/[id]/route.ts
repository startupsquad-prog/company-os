import { NextRequest, NextResponse } from 'next/server'
import { getTaskById, updateTask } from '@/lib/db/tasks'
import type { TaskUpdate } from '@/lib/types/supabase'

/**
 * GET /api/tasks/[id]
 * Get a single task by ID
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    if (!id) {
      return NextResponse.json({ error: 'Task ID is required' }, { status: 400 })
    }

    const task = await getTaskById(id)

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    return NextResponse.json({ data: task }, { status: 200 })
  } catch (error) {
    console.error('Error fetching task:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch task' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/tasks/[id]
 * Update a task
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    if (!id) {
      return NextResponse.json({ error: 'Task ID is required' }, { status: 400 })
    }

    const body = await request.json()

    // Check if task exists
    const existingTask = await getTaskById(id)
    if (!existingTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    const updateData: TaskUpdate = {
      title: body.title,
      description: body.description,
      priority: body.priority,
      status: body.status,
      department_id: body.department_id,
      vertical_key: body.vertical_key,
      due_date: body.due_date,
    }

    // Remove undefined values
    Object.keys(updateData).forEach((key) => {
      if (updateData[key as keyof TaskUpdate] === undefined) {
        delete updateData[key as keyof TaskUpdate]
      }
    })

    const task = await updateTask(id, updateData)

    return NextResponse.json({ data: task }, { status: 200 })
  } catch (error) {
    console.error('Error updating task:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update task' },
      { status: 500 }
    )
  }
}
