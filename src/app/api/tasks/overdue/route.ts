import { NextRequest, NextResponse } from 'next/server'
import { getOverdueTasksCount, getOverdueTasks } from '@/lib/db/tasks'
import { getClerkUserId, getCurrentProfileId } from '@/lib/auth/clerk'
import { createServerClient } from '@/lib/supabase/server'

/**
 * GET /api/tasks/overdue
 * Get overdue tasks count and optionally list
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const includeList = searchParams.get('include_list') === 'true'
    const assignedToMe = searchParams.get('assigned_to_me') === 'true'

    let assignedTo: string | undefined

    if (assignedToMe) {
      const profileId = await getCurrentProfileId()
      if (profileId) {
        assignedTo = profileId
      }
    }

    const count = await getOverdueTasksCount(assignedTo)

    const response: { count: number; tasks?: any[] } = { count }

    if (includeList) {
      const tasks = await getOverdueTasks(assignedTo)
      response.tasks = tasks
    }

    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    console.error('Error fetching overdue tasks:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch overdue tasks' },
      { status: 500 }
    )
  }
}
