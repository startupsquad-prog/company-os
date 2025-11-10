/**
 * Notification Service
 * Company OS: Core functions for creating, fetching, and managing notifications
 */

import { createServerClient } from '@/lib/supabase/server'
import type {
  NotificationInsert,
  NotificationRow,
  NotificationFilters,
  NotificationListResponse,
  NotificationPreferencesRow,
} from './notification-types'
import { buildActionUrl, buildNotificationMessage } from './notification-helpers'

/**
 * Create a single notification
 */
export async function createNotification(data: NotificationInsert): Promise<NotificationRow> {
  const supabase = await createServerClient()

  // Build action URL if not provided
  const actionUrl = data.action_url || buildActionUrl(data.entity_type, data.entity_id)

  const notificationData = {
    ...data,
    action_url: actionUrl,
  }

  const { data: notification, error } = await supabase
    .from('notifications')
    .insert(notificationData)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create notification: ${error.message}`)
  }

  return notification as NotificationRow
}

/**
 * Create notifications for multiple users (batch)
 */
export async function createNotificationsForUsers(
  userIds: string[],
  data: Omit<NotificationInsert, 'user_id'>
): Promise<NotificationRow[]> {
  const supabase = await createServerClient()

  // Build action URL if not provided
  const actionUrl = data.action_url || buildActionUrl(data.entity_type, data.entity_id)

  const notifications = userIds.map((userId) => ({
    ...data,
    user_id: userId,
    action_url: actionUrl,
  }))

  const { data: createdNotifications, error } = await supabase
    .from('notifications')
    .insert(notifications)
    .select()

  if (error) {
    throw new Error(`Failed to create notifications: ${error.message}`)
  }

  return (createdNotifications || []) as NotificationRow[]
}

/**
 * Get user notifications with filters and pagination
 */
export async function getUserNotifications(
  userId: string,
  filters: NotificationFilters = {}
): Promise<NotificationListResponse> {
  const supabase = await createServerClient()

  let query = supabase
    .from('notifications')
    .select('*', { count: 'exact' })
    .eq('user_id', userId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  // Apply filters
  if (filters.read !== undefined) {
    if (filters.read) {
      query = query.not('read_at', 'is', null)
    } else {
      query = query.is('read_at', null)
    }
  }

  if (filters.type) {
    query = query.eq('type', filters.type)
  }

  if (filters.entity_type) {
    query = query.eq('entity_type', filters.entity_type)
  }

  // Pagination
  const limit = filters.limit || 50
  const offset = filters.offset || 0
  query = query.range(offset, offset + limit - 1)

  const { data: notifications, error, count } = await query

  if (error) {
    throw new Error(`Failed to fetch notifications: ${error.message}`)
  }

  // Get unread count
  const { count: unreadCount } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .is('read_at', null)
    .is('deleted_at', null)

  return {
    notifications: (notifications || []) as NotificationRow[],
    total: count || 0,
    unread_count: unreadCount || 0,
  }
}

/**
 * Mark a notification as read
 */
export async function markAsRead(notificationId: string, userId: string): Promise<NotificationRow> {
  const supabase = await createServerClient()

  const { data: notification, error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', notificationId)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to mark notification as read: ${error.message}`)
  }

  return notification as NotificationRow
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllAsRead(userId: string): Promise<number> {
  const supabase = await createServerClient()

  // Use the database function for efficiency
  const { data, error } = await supabase.rpc('mark_all_notifications_read', {
    p_user_id: userId,
  })

  if (error) {
    // Fallback to direct update if function doesn't work
    const { error: updateError } = await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('user_id', userId)
      .is('read_at', null)
      .is('deleted_at', null)

    if (updateError) {
      throw new Error(`Failed to mark all notifications as read: ${updateError.message}`)
    }

    // Get count of updated rows
    const { count } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .not('read_at', 'is', null)
      .is('deleted_at', null)

    return count || 0
  }

  return data || 0
}

/**
 * Get unread notification count for a user
 */
export async function getUnreadCount(userId: string): Promise<number> {
  const supabase = await createServerClient()

  // Use the database function for efficiency
  const { data, error } = await supabase.rpc('get_unread_notification_count', {
    p_user_id: userId,
  })

  if (error) {
    // Fallback to direct query if function doesn't exist
    const { count, error: countError } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .is('read_at', null)
      .is('deleted_at', null)

    if (countError) {
      throw new Error(`Failed to get unread count: ${countError.message}`)
    }

    return count || 0
  }

  return data || 0
}

/**
 * Delete a notification (soft delete)
 */
export async function deleteNotification(notificationId: string, userId: string): Promise<void> {
  const supabase = await createServerClient()

  const { error } = await supabase
    .from('notifications')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', notificationId)
    .eq('user_id', userId)

  if (error) {
    throw new Error(`Failed to delete notification: ${error.message}`)
  }
}

/**
 * Get notification preferences for a user
 */
export async function getNotificationPreferences(
  userId: string
): Promise<NotificationPreferencesRow[]> {
  const supabase = await createServerClient()

  const { data: preferences, error } = await supabase
    .from('notification_preferences')
    .select('*')
    .eq('user_id', userId)

  if (error) {
    throw new Error(`Failed to fetch notification preferences: ${error.message}`)
  }

  return (preferences || []) as NotificationPreferencesRow[]
}

/**
 * Update notification preference for a user
 */
export async function updateNotificationPreference(
  userId: string,
  notificationType: string,
  updates: {
    enabled?: boolean
    email_enabled?: boolean
    whatsapp_enabled?: boolean
  }
): Promise<NotificationPreferencesRow> {
  const supabase = await createServerClient()

  // Try to update existing preference
  const { data: existing } = await supabase
    .from('notification_preferences')
    .select('*')
    .eq('user_id', userId)
    .eq('notification_type', notificationType)
    .single()

  if (existing) {
    const { data: preference, error } = await supabase
      .from('notification_preferences')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update notification preference: ${error.message}`)
    }

    return preference as NotificationPreferencesRow
  } else {
    // Create new preference
    const { data: preference, error } = await supabase
      .from('notification_preferences')
      .insert({
        user_id: userId,
        notification_type: notificationType,
        ...updates,
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create notification preference: ${error.message}`)
    }

    return preference as NotificationPreferencesRow
  }
}

/**
 * Check if user has notification type enabled
 */
export async function isNotificationEnabled(
  userId: string,
  notificationType: string
): Promise<boolean> {
  const supabase = await createServerClient()

  const { data: preference } = await supabase
    .from('notification_preferences')
    .select('enabled')
    .eq('user_id', userId)
    .eq('notification_type', notificationType)
    .single()

  // Default to enabled if no preference exists
  return preference?.enabled !== false
}
