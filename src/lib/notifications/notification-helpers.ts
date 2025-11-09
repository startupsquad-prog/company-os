/**
 * Notification Helpers
 * Company OS: Helper functions for notification system
 */

import type { NotificationType, EntityType, NotificationMetadata } from './notification-types'

/**
 * Build action URL for a notification based on entity type and ID
 */
export function buildActionUrl(entityType: EntityType | null | undefined, entityId: string | null | undefined): string | null {
  if (!entityType || !entityId) {
    return null
  }

  const urlMap: Record<EntityType, string> = {
    task: `/tasks?task=${entityId}`, // Tasks use query parameter format
    lead: `/dashboard/crm/leads/${entityId}`,
    order: `/dashboard/ops/orders/${entityId}`,
    quotation: `/dashboard/ops/quotations/${entityId}`,
    shipment: `/dashboard/ops/shipments/${entityId}`,
    application: `/dashboard/ats/applications/${entityId}`,
    interview: `/dashboard/ats/interviews/${entityId}`,
  }

  return urlMap[entityType] || null
}

/**
 * Build notification message based on type, entity, and actor
 */
export function buildNotificationMessage(
  type: NotificationType,
  entity: { title?: string; name?: string; id?: string },
  actor?: { name?: string; first_name?: string; last_name?: string }
): { title: string; message: string } {
  const entityName = entity.title || entity.name || `#${entity.id?.slice(0, 8)}` || 'item'
  const actorName = actor?.name || 
    (actor?.first_name && actor?.last_name 
      ? `${actor.first_name} ${actor.last_name}` 
      : actor?.first_name || 'Someone')

  const messages: Record<NotificationType, { title: string; message: string }> = {
    task_assigned: {
      title: 'New Task Assigned',
      message: `You have been assigned to task: ${entityName}`,
    },
    task_commented: {
      title: 'New Comment',
      message: `${actorName} commented on task: ${entityName}`,
    },
    task_status_changed: {
      title: 'Task Status Changed',
      message: `Task "${entityName}" status has been updated`,
    },
    task_due_soon: {
      title: 'Task Due Soon',
      message: `Task "${entityName}" is due soon`,
    },
    task_overdue: {
      title: 'Task Overdue',
      message: `Task "${entityName}" is overdue`,
    },
    task_mentioned: {
      title: 'You Were Mentioned',
      message: `${actorName} mentioned you in a comment on task: ${entityName}`,
    },
    lead_assigned: {
      title: 'New Lead Assigned',
      message: `New lead assigned to you: ${entityName}`,
    },
    lead_status_changed: {
      title: 'Lead Status Changed',
      message: `Lead "${entityName}" status has been updated`,
    },
    order_created: {
      title: 'New Order Created',
      message: `New order created: ${entityName}`,
    },
    order_status_changed: {
      title: 'Order Status Changed',
      message: `Order "${entityName}" status has been updated`,
    },
    quotation_approved: {
      title: 'Quotation Approved',
      message: `Quotation ${entityName} has been approved`,
    },
    quotation_rejected: {
      title: 'Quotation Rejected',
      message: `Quotation ${entityName} has been rejected`,
    },
    shipment_delivered: {
      title: 'Shipment Delivered',
      message: `Shipment ${entityName} has been delivered`,
    },
    system: {
      title: 'System Notification',
      message: entityName,
    },
    mention: {
      title: 'You Were Mentioned',
      message: `${actorName} mentioned you`,
    },
  }

  return messages[type] || {
    title: 'Notification',
    message: entityName,
  }
}

/**
 * Determine recipients for a notification based on entity type, entity ID, and action
 * Returns array of user IDs (from auth.users, not profiles)
 */
export async function determineRecipients(
  supabase: any,
  entityType: EntityType,
  entityId: string,
  action: string,
  excludeUserId?: string
): Promise<string[]> {
  const recipients: string[] = []

  try {
    if (entityType === 'task') {
      // Get task assignees (owners, collaborators, watchers)
      const { data: assignees } = await supabase
        .from('task_assignees')
        .select('profile_id, profiles!inner(user_id)')
        .eq('task_id', entityId)

      if (assignees) {
        for (const assignee of assignees) {
          const userId = assignee.profiles?.user_id
          if (userId && userId !== excludeUserId) {
            recipients.push(userId)
          }
        }
      }

      // For task creation, also notify department members if task has department
      if (action === 'created') {
        const { data: task } = await supabase
          .from('tasks')
          .select('department_id, departments!inner(id)')
          .eq('id', entityId)
          .single()

        if (task?.department_id) {
          const { data: departmentMembers } = await supabase
            .from('profiles')
            .select('user_id')
            .eq('department_id', task.department_id)

          if (departmentMembers) {
            for (const member of departmentMembers) {
              if (member.user_id && member.user_id !== excludeUserId && !recipients.includes(member.user_id)) {
                recipients.push(member.user_id)
              }
            }
          }
        }
      }
    }

    // Future: Add logic for other entity types (leads, orders, etc.)
    // if (entityType === 'lead') { ... }
    // if (entityType === 'order') { ... }

    return [...new Set(recipients)] // Remove duplicates
  } catch (error) {
    console.error('Error determining recipients:', error)
    return []
  }
}

/**
 * Parse mentions from text (e.g., "@username" or "@John Doe")
 * Returns array of mentioned user IDs
 */
export async function parseMentions(
  supabase: any,
  text: string
): Promise<string[]> {
  const mentionRegex = /@(\w+)/g
  const matches = text.match(mentionRegex)
  
  if (!matches) {
    return []
  }

  const mentionedUsernames = matches.map(m => m.slice(1)) // Remove @
  const mentionedUserIds: string[] = []

  try {
    // Search for users by first_name, last_name, or email
    for (const username of mentionedUsernames) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name, email')
        .or(`first_name.ilike.%${username}%,last_name.ilike.%${username}%,email.ilike.%${username}%`)

      if (profiles) {
        for (const profile of profiles) {
          if (profile.user_id && !mentionedUserIds.includes(profile.user_id)) {
            mentionedUserIds.push(profile.user_id)
          }
        }
      }
    }

    return mentionedUserIds
  } catch (error) {
    console.error('Error parsing mentions:', error)
    return []
  }
}
