import { NextRequest, NextResponse } from 'next/server'
import { getTasks, createTask } from '@/lib/db/tasks'
import type { TaskInsert } from '@/lib/types/supabase'

/**
 * GET /api/tasks
 * Get tasks with optional filters
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams

    const filter = {
      status: searchParams.get('status') || undefined,
      priority: searchParams.get('priority') || undefined,
      department_id: searchParams.get('department_id') || undefined,
      vertical_key: searchParams.get('vertical_key') || undefined,
      assigned_to: searchParams.get('assigned_to') || undefined,
      created_by: searchParams.get('created_by') || undefined,
      due_date_from: searchParams.get('due_date_from') || undefined,
      due_date_to: searchParams.get('due_date_to') || undefined,
    }

    // Remove undefined values
    Object.keys(filter).forEach((key) => {
      if (filter[key as keyof typeof filter] === undefined) {
        delete filter[key as keyof typeof filter]
      }
    })

    const tasks = await getTasks(filter)

    return NextResponse.json({ data: tasks }, { status: 200 })
  } catch (error) {
    console.error('Error fetching tasks:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch tasks' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/tasks
 * Create a new task
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate required fields
    if (!body.title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    const taskData: Omit<TaskInsert, 'id' | 'created_at' | 'updated_at'> = {
      title: body.title,
      description: body.description || null,
      priority: body.priority || null,
      status: body.status || 'pending',
      department_id: body.department_id || null,
      vertical_key: body.vertical_key || null,
      due_date: body.due_date || null,
    }

    const task = await createTask(taskData)

    return NextResponse.json({ data: task }, { status: 201 })
  } catch (error) {
    console.error('Error creating task:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create task' },
      { status: 500 }
    )
  }
}

