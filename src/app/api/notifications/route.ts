/**
 * Notifications API Route
 * Company OS: Handle GET (list) and POST (create) requests for notifications
 */

import { NextRequest, NextResponse } from 'next/server'
import { getClerkUserId } from '@/lib/auth/clerk'
import { getUserNotifications, createNotification } from '@/lib/notifications/notifications'
import type { NotificationInsert, NotificationType, EntityType } from '@/lib/notifications/notification-types'

/**
 * GET /api/notifications
 * List user notifications with filters and pagination
 */
export async function GET(req: NextRequest) {
  try {
    const userId = await getClerkUserId()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse query parameters
    const searchParams = req.nextUrl.searchParams
    const read = searchParams.get('read')
    const type = searchParams.get('type')
    const entityType = searchParams.get('entity_type')
    const limit = parseInt(searchParams.get('limit') || '50', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)

    const filters = {
      read: read === 'true' ? true : read === 'false' ? false : undefined,
      type: (type as NotificationType) || undefined,
      entity_type: (entityType as EntityType) || undefined,
      limit,
      offset,
    }

    const result = await getUserNotifications(userId, filters)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching notifications:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch notifications'
    const errorDetails = error instanceof Error ? error.stack : String(error)
    console.error('Error details:', errorDetails)
    return NextResponse.json(
      {
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? errorDetails : undefined,
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/notifications
 * Create a notification (admin/system use)
 * Note: In practice, notifications are created via Supabase Edge Functions
 */
export async function POST(req: NextRequest) {
  try {
    const userId = await getClerkUserId()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const notificationData: NotificationInsert = {
      user_id: body.user_id || userId,
      type: body.type,
      title: body.title,
      message: body.message,
      entity_type: body.entity_type,
      entity_id: body.entity_id,
      action_url: body.action_url,
      metadata: body.metadata,
    }

    const notification = await createNotification(notificationData)

    return NextResponse.json({ data: notification }, { status: 201 })
  } catch (error) {
    console.error('Error creating notification:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create notification' },
      { status: 500 }
    )
  }
}
