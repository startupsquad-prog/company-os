/**
 * Mark All Notifications as Read API Route
 * Company OS: Mark all user notifications as read
 */

import { NextRequest, NextResponse } from 'next/server'
import { getClerkUserId } from '@/lib/auth/clerk'
import { markAllAsRead } from '@/lib/notifications/notifications'

/**
 * POST /api/notifications/read-all
 * Mark all notifications as read for the current user
 */
export async function POST(req: NextRequest) {
  try {
    const userId = await getClerkUserId()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const count = await markAllAsRead(userId)

    return NextResponse.json({
      success: true,
      count,
    })
  } catch (error) {
    console.error('Error marking all notifications as read:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to mark all notifications as read',
      },
      { status: 500 }
    )
  }
}
