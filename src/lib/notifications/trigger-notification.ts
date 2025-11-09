/**
 * Trigger Notification Helper
 * Company OS: Helper function to trigger notification processor via Supabase Edge Function
 */

import type { NotificationType, EntityType } from './notification-types'

/**
 * Trigger a notification via Supabase Edge Function
 * This is a non-blocking call that triggers the notification processor
 */
// Rate limiting: prevent duplicate calls within a short time window
const notificationCache = new Map<string, number>()
const RATE_LIMIT_MS = 5000 // 5 seconds between duplicate calls

function getCacheKey(
  entityType: EntityType,
  entityId: string,
  action: string,
  notificationType: NotificationType,
  userId?: string
): string {
  return `${entityType}:${entityId}:${action}:${notificationType}:${userId || ''}`
}

export async function triggerNotification(
  entityType: EntityType,
  entityId: string,
  action: string,
  notificationType: NotificationType,
  options?: {
    actorId?: string
    recipients?: string[]
    excludeUserId?: string
    metadata?: Record<string, unknown>
    customTitle?: string
    customMessage?: string
  }
): Promise<void> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Missing Supabase environment variables for notification trigger')
      return
    }

    // Rate limiting: prevent duplicate calls
    const cacheKey = getCacheKey(entityType, entityId, action, notificationType, options?.actorId)
    const lastCall = notificationCache.get(cacheKey)
    const now = Date.now()

    if (lastCall && now - lastCall < RATE_LIMIT_MS) {
      console.log(`⏭️ [Notification] Rate limited duplicate call for ${cacheKey}`)
      return
    }

    notificationCache.set(cacheKey, now)

    // Clean up old cache entries (older than 1 minute)
    if (notificationCache.size > 100) {
      for (const [key, timestamp] of notificationCache.entries()) {
        if (now - timestamp > 60000) {
          notificationCache.delete(key)
        }
      }
    }

    // Call the Edge Function asynchronously (fire and forget)
    // Don't await - let it run in the background
    fetch(`${supabaseUrl}/functions/v1/process-notification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${supabaseAnonKey}`,
      },
      body: JSON.stringify({
        entity_type: entityType,
        entity_id: entityId,
        action,
        notification_type: notificationType,
        actor_id: options?.actorId,
        recipients: options?.recipients,
        exclude_user_id: options?.excludeUserId,
        metadata: options?.metadata,
        custom_title: options?.customTitle,
        custom_message: options?.customMessage,
      }),
    })
      .then(async (response) => {
        if (!response.ok) {
          const errorText = await response.text().catch(() => 'Unknown error')
          console.error(`❌ [Notification] Edge Function returned ${response.status}:`, errorText)
        }
      })
      .catch((error) => {
        // Log error but don't throw - notification failure shouldn't break the main operation
        console.error('❌ [Notification] Failed to trigger notification:', error)
      })
  } catch (error) {
    // Log error but don't throw - notification failure shouldn't break the main operation
    console.error('❌ [Notification] Error triggering notification:', error)
  }
}

/**
 * Legacy function for task notifications (backward compatibility)
 * @deprecated Use triggerNotification instead
 */
export async function triggerTaskNotification(
  taskId: string,
  action: string,
  actorId?: string,
  recipients?: string[],
  metadata?: Record<string, unknown>
): Promise<void> {
  const notificationTypeMap: Record<string, NotificationType> = {
    assigned: 'task_assigned',
    commented: 'task_commented',
    status_changed: 'task_status_changed',
  }

  const notificationType = notificationTypeMap[action] || 'task_assigned'

  return triggerNotification('task', taskId, action, notificationType, {
    actorId,
    recipients,
    metadata,
  })
}
