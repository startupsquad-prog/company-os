/**
 * Mark All Notifications as Read API Route
 * Company OS: Mark all user notifications as read
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { markAllAsRead } from '@/lib/notifications/notifications'

/**
 * POST /api/notifications/read-all
 * Mark all notifications as read for the current user
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const count = await markAllAsRead(user.id)

    return NextResponse.json({ 
      success: true, 
      count 
    })
  } catch (error) {
    console.error('Error marking all notifications as read:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to mark all notifications as read' },
      { status: 500 }
    )
  }
}
