/**
 * Notification by ID API Route
 * Company OS: Handle PATCH (mark as read) and DELETE requests for a specific notification
 */

import { NextRequest, NextResponse } from 'next/server'
import { getClerkUserId } from '@/lib/auth/clerk'
import { markAsRead, deleteNotification } from '@/lib/notifications/notifications'

/**
 * PATCH /api/notifications/[id]
 * Mark a notification as read
 */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getClerkUserId()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const notification = await markAsRead(id, userId)

    return NextResponse.json({ data: notification })
  } catch (error) {
    console.error('Error marking notification as read:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to mark notification as read' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/notifications/[id]
 * Delete a notification (soft delete)
 */
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getClerkUserId()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    await deleteNotification(id, userId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting notification:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete notification' },
      { status: 500 }
    )
  }
}
