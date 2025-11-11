import { NextRequest, NextResponse } from 'next/server'
import { getProjectTasks } from '@/lib/db/projects'

/**
 * GET /api/unified/projects/[id]/tasks
 * Get all tasks for a project
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const tasks = await getProjectTasks(id)

    return NextResponse.json({ data: tasks })
  } catch (error: any) {
    console.error('Error fetching project tasks:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch project tasks' },
      { status: 500 }
    )
  }
}

