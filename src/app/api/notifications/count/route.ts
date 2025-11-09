/**
 * Notification Count API Route
 * Company OS: Get unread notification count for the current user
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { getUnreadCount } from '@/lib/notifications/notifications'

/**
 * GET /api/notifications/count
 * Get unread notification count for the current user
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const count = await getUnreadCount(user.id)

    return NextResponse.json({ count })
  } catch (error) {
    console.error('Error getting unread count:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to get unread count'
    const errorDetails = error instanceof Error ? error.stack : String(error)
    console.error('Error details:', errorDetails)
    return NextResponse.json(
      { error: errorMessage, details: process.env.NODE_ENV === 'development' ? errorDetails : undefined },
      { status: 500 }
    )
  }
}
