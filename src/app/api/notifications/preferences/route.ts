/**
 * Notification Preferences API Route
 * Company OS: Handle GET and PATCH requests for notification preferences
 */

import { NextRequest, NextResponse } from 'next/server'
import { getClerkUserId } from '@/lib/auth/clerk'
import {
  getNotificationPreferences,
  updateNotificationPreference,
} from '@/lib/notifications/notifications'

/**
 * GET /api/notifications/preferences
 * Get notification preferences for the current user
 */
export async function GET(req: NextRequest) {
  try {
    const userId = await getClerkUserId()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const preferences = await getNotificationPreferences(userId)

    return NextResponse.json({ data: preferences })
  } catch (error) {
    console.error('Error fetching notification preferences:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch preferences' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/notifications/preferences
 * Update notification preference for the current user
 * Body: { notification_type: string, enabled?: boolean, email_enabled?: boolean, whatsapp_enabled?: boolean }
 */
export async function PATCH(req: NextRequest) {
  try {
    const userId = await getClerkUserId()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { notification_type, ...updates } = body

    if (!notification_type) {
      return NextResponse.json({ error: 'notification_type is required' }, { status: 400 })
    }

    const preference = await updateNotificationPreference(userId, notification_type, updates)

    return NextResponse.json({ data: preference })
  } catch (error) {
    console.error('Error updating notification preference:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update preference' },
      { status: 500 }
    )
  }
}
