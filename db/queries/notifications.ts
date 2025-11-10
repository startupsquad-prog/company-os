/**
 * Authorized Notification Queries using Drizzle ORM
 *
 * These queries replicate RLS policy logic to maintain security
 * when using Drizzle ORM (which bypasses PostgREST RLS).
 */

import { db, schema } from '../client'
import { getAuthContext } from '../auth-context'
import { eq, and, isNull, inArray, desc, sql } from 'drizzle-orm'

export interface NotificationFilters {
  read?: boolean
  type?: string
  entityType?: string
  limit?: number
  offset?: number
}

/**
 * Get user notifications with RLS enforcement
 * Users can only view their own notifications
 */
export async function getUserNotifications(userId: string, filters: NotificationFilters = {}) {
  const context = await getAuthContext()
  if (!context) {
    throw new Error('Unauthorized')
  }

  // RLS: Users can only view their own notifications
  if (context.userId !== userId) {
    throw new Error('Unauthorized: Cannot view other user notifications')
  }

  const conditions: any[] = [
    eq(schema.notifications.userId, userId),
    isNull(schema.notifications.deletedAt),
  ]

  if (filters.read !== undefined) {
    if (filters.read) {
      // Read notifications (read_at is not null)
      conditions.push(sql`${schema.notifications.readAt} IS NOT NULL`)
    } else {
      // Unread notifications (read_at is null)
      conditions.push(isNull(schema.notifications.readAt))
    }
  }

  if (filters.type) {
    conditions.push(eq(schema.notifications.type, filters.type))
  }

  if (filters.entityType) {
    conditions.push(eq(schema.notifications.entityType, filters.entityType))
  }

  let query = db
    .select()
    .from(schema.notifications)
    .where(and(...conditions))
    .orderBy(desc(schema.notifications.createdAt))

  // Apply pagination
  if (filters.limit) {
    query = query.limit(filters.limit)
  }
  if (filters.offset) {
    query = query.offset(filters.offset)
  }

  const notifications = await query

  // Get unread count
  const unreadCount = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.notifications)
    .where(
      and(
        eq(schema.notifications.userId, userId),
        isNull(schema.notifications.readAt),
        isNull(schema.notifications.deletedAt)
      )
    )

  return {
    notifications,
    total: notifications.length,
    unread_count: Number(unreadCount[0]?.count || 0),
  }
}

/**
 * Create a notification
 * RLS: Anyone can create notifications (system function)
 */
export async function createNotification(data: {
  userId: string
  type: string
  title: string
  message: string
  entityType?: string
  entityId?: string
  actionUrl?: string
  metadata?: any
}) {
  const context = await getAuthContext()
  if (!context) {
    throw new Error('Unauthorized')
  }

  const [notification] = await db
    .insert(schema.notifications)
    .values({
      userId: data.userId,
      type: data.type,
      title: data.title,
      message: data.message,
      entityType: data.entityType || null,
      entityId: data.entityId || null,
      actionUrl: data.actionUrl || null,
      metadata: data.metadata || null,
    })
    .returning()

  return notification
}

/**
 * Create notifications for multiple users (batch)
 */
export async function createNotificationsForUsers(
  userIds: string[],
  data: {
    type: string
    title: string
    message: string
    entityType?: string
    entityId?: string
    actionUrl?: string
    metadata?: any
  }
) {
  const context = await getAuthContext()
  if (!context) {
    throw new Error('Unauthorized')
  }

  const notifications = userIds.map((userId) => ({
    userId,
    type: data.type,
    title: data.title,
    message: data.message,
    entityType: data.entityType || null,
    entityId: data.entityId || null,
    actionUrl: data.actionUrl || null,
    metadata: data.metadata || null,
  }))

  const created = await db.insert(schema.notifications).values(notifications).returning()

  return created
}

/**
 * Mark a notification as read
 * RLS: Users can only mark their own notifications as read
 */
export async function markAsRead(notificationId: string, userId: string) {
  const context = await getAuthContext()
  if (!context) {
    throw new Error('Unauthorized')
  }

  // RLS: Users can only update their own notifications
  if (context.userId !== userId) {
    throw new Error('Unauthorized: Cannot update other user notifications')
  }

  const [notification] = await db
    .update(schema.notifications)
    .set({ readAt: new Date().toISOString() })
    .where(
      and(eq(schema.notifications.id, notificationId), eq(schema.notifications.userId, userId))
    )
    .returning()

  if (!notification) {
    throw new Error('Notification not found or access denied')
  }

  return notification
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllAsRead(userId: string) {
  const context = await getAuthContext()
  if (!context) {
    throw new Error('Unauthorized')
  }

  // RLS: Users can only update their own notifications
  if (context.userId !== userId) {
    throw new Error('Unauthorized: Cannot update other user notifications')
  }

  const updated = await db
    .update(schema.notifications)
    .set({ readAt: new Date().toISOString() })
    .where(
      and(
        eq(schema.notifications.userId, userId),
        isNull(schema.notifications.readAt),
        isNull(schema.notifications.deletedAt)
      )
    )
    .returning()

  return updated.length
}

/**
 * Get unread notification count for a user
 */
export async function getUnreadCount(userId: string): Promise<number> {
  const context = await getAuthContext()
  if (!context) {
    throw new Error('Unauthorized')
  }

  // RLS: Users can only view their own notification count
  if (context.userId !== userId) {
    throw new Error('Unauthorized: Cannot view other user notification count')
  }

  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.notifications)
    .where(
      and(
        eq(schema.notifications.userId, userId),
        isNull(schema.notifications.readAt),
        isNull(schema.notifications.deletedAt)
      )
    )

  return Number(result[0]?.count || 0)
}

/**
 * Delete a notification (soft delete)
 * RLS: Users can only delete their own notifications
 */
export async function deleteNotification(notificationId: string, userId: string) {
  const context = await getAuthContext()
  if (!context) {
    throw new Error('Unauthorized')
  }

  // RLS: Users can only delete their own notifications
  if (context.userId !== userId) {
    throw new Error('Unauthorized: Cannot delete other user notifications')
  }

  await db
    .update(schema.notifications)
    .set({ deletedAt: new Date().toISOString() })
    .where(
      and(eq(schema.notifications.id, notificationId), eq(schema.notifications.userId, userId))
    )
}

/**
 * Get notification preferences for a user
 */
export async function getNotificationPreferences(userId: string) {
  const context = await getAuthContext()
  if (!context) {
    throw new Error('Unauthorized')
  }

  // RLS: Users can only view their own preferences
  if (context.userId !== userId) {
    throw new Error('Unauthorized: Cannot view other user preferences')
  }

  const preferences = await db
    .select()
    .from(schema.notificationPreferences)
    .where(eq(schema.notificationPreferences.userId, userId))

  return preferences
}

/**
 * Update notification preference for a user
 */
export async function updateNotificationPreference(
  userId: string,
  notificationType: string,
  updates: {
    enabled?: boolean
    emailEnabled?: boolean
    whatsappEnabled?: boolean
  }
) {
  const context = await getAuthContext()
  if (!context) {
    throw new Error('Unauthorized')
  }

  // RLS: Users can only update their own preferences
  if (context.userId !== userId) {
    throw new Error('Unauthorized: Cannot update other user preferences')
  }

  // Check if preference exists
  const existing = await db
    .select()
    .from(schema.notificationPreferences)
    .where(
      and(
        eq(schema.notificationPreferences.userId, userId),
        eq(schema.notificationPreferences.notificationType, notificationType)
      )
    )
    .limit(1)

  if (existing.length > 0) {
    // Update existing
    const [preference] = await db
      .update(schema.notificationPreferences)
      .set({
        ...updates,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(schema.notificationPreferences.id, existing[0].id))
      .returning()

    return preference
  } else {
    // Create new
    const [preference] = await db
      .insert(schema.notificationPreferences)
      .values({
        userId,
        notificationType,
        enabled: updates.enabled ?? true,
        emailEnabled: updates.emailEnabled ?? false,
        whatsappEnabled: updates.whatsappEnabled ?? false,
      })
      .returning()

    return preference
  }
}

/**
 * Check if user has notification type enabled
 */
export async function isNotificationEnabled(
  userId: string,
  notificationType: string
): Promise<boolean> {
  const context = await getAuthContext()
  if (!context) {
    throw new Error('Unauthorized')
  }

  // RLS: Users can only view their own preferences
  if (context.userId !== userId) {
    throw new Error('Unauthorized: Cannot view other user preferences')
  }

  const preference = await db
    .select()
    .from(schema.notificationPreferences)
    .where(
      and(
        eq(schema.notificationPreferences.userId, userId),
        eq(schema.notificationPreferences.notificationType, notificationType)
      )
    )
    .limit(1)

  // Default to enabled if no preference exists
  return preference[0]?.enabled !== false
}
