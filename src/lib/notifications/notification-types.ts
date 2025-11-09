/**
 * Notification Types and Constants
 * Company OS: Type definitions and constants for notification system
 */

export type NotificationType =
  | 'task_assigned'
  | 'task_commented'
  | 'task_status_changed'
  | 'task_due_soon'
  | 'task_overdue'
  | 'task_mentioned'
  | 'lead_assigned'
  | 'lead_status_changed'
  | 'order_created'
  | 'order_status_changed'
  | 'quotation_approved'
  | 'quotation_rejected'
  | 'shipment_delivered'
  | 'system'
  | 'mention'

export type EntityType = 'task' | 'lead' | 'order' | 'quotation' | 'shipment' | 'application' | 'interview'

export interface NotificationMetadata {
  actor_id?: string
  actor_name?: string
  action?: string
  [key: string]: unknown
}

export interface NotificationInsert {
  user_id: string
  type: NotificationType
  title: string
  message: string
  entity_type?: EntityType
  entity_id?: string
  action_url?: string
  metadata?: NotificationMetadata
}

export interface NotificationRow {
  id: string
  user_id: string
  type: NotificationType
  title: string
  message: string
  entity_type: EntityType | null
  entity_id: string | null
  read_at: string | null
  action_url: string | null
  metadata: NotificationMetadata | null
  created_at: string
  deleted_at: string | null
}

export interface NotificationPreferencesRow {
  id: string
  user_id: string
  notification_type: NotificationType
  enabled: boolean
  email_enabled: boolean
  whatsapp_enabled: boolean
  created_at: string
  updated_at: string
}

export interface NotificationFilters {
  read?: boolean // true = only read, false = only unread, undefined = all
  type?: NotificationType
  entity_type?: EntityType
  limit?: number
  offset?: number
}

export interface NotificationListResponse {
  notifications: NotificationRow[]
  total: number
  unread_count: number
}
