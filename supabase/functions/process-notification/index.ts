/**
 * Process Notification Edge Function
 * Company OS: Processes events and creates notifications for users
 *
 * This function replaces the Trigger.dev notification processor.
 * It accepts POST requests with notification payload and creates notifications in the database.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.2'
import { corsHeaders } from '../_shared/cors.ts'

// Types
type NotificationType =
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

type EntityType = 'task' | 'lead' | 'order' | 'quotation' | 'shipment' | 'application' | 'interview'

interface NotificationProcessorInput {
  entity_type: EntityType
  entity_id: string
  action: string
  notification_type: NotificationType
  actor_id?: string
  recipients?: string[]
  exclude_user_id?: string
  metadata?: Record<string, unknown>
  custom_title?: string
  custom_message?: string
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get environment variables from Supabase Edge Function context
    // SUPABASE_URL is automatically provided by Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl) {
      console.error('❌ [Edge Function] Missing SUPABASE_URL environment variable')
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing SUPABASE_URL environment variable',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    if (!supabaseServiceKey) {
      console.error('❌ [Edge Function] Missing SUPABASE_SERVICE_ROLE_KEY environment variable')
      return new Response(
        JSON.stringify({
          success: false,
          error:
            'Missing SUPABASE_SERVICE_ROLE_KEY. Please set it in Supabase Dashboard > Edge Functions > Secrets',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    // Initialize Supabase client with service role
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Parse request body with error handling
    let payload: NotificationProcessorInput
    try {
      payload = await req.json()
    } catch (error) {
      console.error('❌ [Edge Function] Failed to parse request body', { error })
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid request body',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Validate required fields
    if (
      !payload.entity_type ||
      !payload.entity_id ||
      !payload.action ||
      !payload.notification_type
    ) {
      console.error('❌ [Edge Function] Missing required fields', { payload })
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing required fields: entity_type, entity_id, action, notification_type',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    console.log('🔔 [Edge Function] Notification processor started', {
      entity_type: payload.entity_type,
      entity_id: payload.entity_id,
      action: payload.action,
      notification_type: payload.notification_type,
    })

    // Step 1: Determine recipients
    let recipientUserIds: string[] = []

    if (payload.recipients && payload.recipients.length > 0) {
      // Use explicit recipients if provided
      recipientUserIds = payload.recipients
    } else {
      // Auto-determine recipients based on entity type and action
      recipientUserIds = await determineRecipientsForEntity(
        supabase,
        payload.entity_type,
        payload.entity_id,
        payload.action,
        payload.exclude_user_id
      )
    }

    // Remove excluded user
    if (payload.exclude_user_id) {
      recipientUserIds = recipientUserIds.filter((id) => id !== payload.exclude_user_id)
    }

    // Remove duplicates
    recipientUserIds = [...new Set(recipientUserIds)]

    if (recipientUserIds.length === 0) {
      console.log('⚠️ [Edge Function] No recipients found, skipping notification creation')
      return new Response(
        JSON.stringify({ success: true, notifications_created: 0, message: 'No recipients' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    console.log(`📬 [Edge Function] Found ${recipientUserIds.length} recipients`, {
      recipients: recipientUserIds,
    })

    // Step 2: Fetch entity data for message building
    let entityData: { title?: string; name?: string; id?: string } = {
      id: payload.entity_id,
    }
    let actorData: { name?: string; first_name?: string; last_name?: string } | undefined

    try {
      // Fetch entity based on type
      if (payload.entity_type === 'task') {
        const { data: task, error: taskError } = await supabase
          .from('tasks')
          .select('title')
          .eq('id', payload.entity_id)
          .single()

        if (!taskError && task?.title) {
          entityData.title = task.title
        }
      }

      // Fetch lead data
      if (payload.entity_type === 'lead') {
        const { data: lead, error: leadError } = await supabase
          .from('leads')
          .select('contact:contacts!leads_contact_id_fkey(name)')
          .eq('id', payload.entity_id)
          .single()

        if (!leadError && lead?.contact) {
          entityData.name = (lead.contact as any)?.name
        }
      }

      // Fetch actor data if provided
      if (payload.actor_id) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('first_name, last_name')
          .eq('user_id', payload.actor_id)
          .single()

        if (!profileError && profile) {
          actorData = {
            first_name: profile.first_name || undefined,
            last_name: profile.last_name || undefined,
          }
        }
      }
    } catch (error) {
      console.warn('⚠️ [Edge Function] Failed to fetch entity/actor data, using defaults', {
        error,
      })
    }

    // Step 3: Build notification message
    const { title, message } =
      payload.custom_title && payload.custom_message
        ? { title: payload.custom_title, message: payload.custom_message }
        : buildNotificationMessage(payload.notification_type, entityData, actorData)

    // Step 4: Build action URL
    const actionUrl = buildActionUrl(payload.entity_type, payload.entity_id)

    // Step 5: Check notification preferences and filter recipients
    const enabledRecipients: string[] = []

    for (const userId of recipientUserIds) {
      // Check if user has this notification type enabled
      const { data: preference } = await supabase
        .from('notification_preferences')
        .select('enabled')
        .eq('user_id', userId)
        .eq('notification_type', payload.notification_type)
        .single()

      // Default to enabled if no preference exists
      const isEnabled = preference?.enabled !== false

      if (isEnabled) {
        enabledRecipients.push(userId)
      }
    }

    if (enabledRecipients.length === 0) {
      console.log('⚠️ [Edge Function] No enabled recipients, skipping notification creation')
      return new Response(
        JSON.stringify({
          success: true,
          notifications_created: 0,
          message: 'All recipients have notifications disabled',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    // Step 6: Check for duplicate notifications (prevent spam)
    // Check if a similar notification was created in the last 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()
    const { data: recentNotifications } = await supabase
      .from('notifications')
      .select('id, user_id')
      .eq('entity_type', payload.entity_type)
      .eq('entity_id', payload.entity_id)
      .eq('type', payload.notification_type)
      .gte('created_at', fiveMinutesAgo)
      .in('user_id', enabledRecipients)

    // Filter out users who already received this notification recently
    const recentUserIds = new Set(recentNotifications?.map((n) => n.user_id) || [])
    const filteredRecipients = enabledRecipients.filter((userId) => !recentUserIds.has(userId))

    if (filteredRecipients.length === 0) {
      console.log(
        '⚠️ [Edge Function] All recipients already received this notification recently, skipping'
      )
      return new Response(
        JSON.stringify({
          success: true,
          notifications_created: 0,
          message: 'Duplicate notification prevented',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    // Step 7: Create notifications in batch
    const notifications = filteredRecipients.map((userId) => ({
      user_id: userId,
      type: payload.notification_type,
      title,
      message,
      entity_type: payload.entity_type,
      entity_id: payload.entity_id,
      action_url: actionUrl,
      metadata: payload.metadata || {},
    }))

    const { data: createdNotifications, error: insertError } = await supabase
      .from('notifications')
      .insert(notifications)
      .select('id')

    if (insertError) {
      console.error('❌ [Edge Function] Failed to create notifications', { error: insertError })
      // Return error but don't throw - prevent retries
      return new Response(
        JSON.stringify({
          success: false,
          error: `Failed to create notifications: ${insertError.message}`,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    console.log(`✅ [Edge Function] Created ${createdNotifications?.length || 0} notifications`, {
      notification_ids: createdNotifications?.map((n) => n.id),
    })

    return new Response(
      JSON.stringify({
        success: true,
        notifications_created: createdNotifications?.length || 0,
        notification_ids: createdNotifications?.map((n) => n.id) || [],
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('❌ [Edge Function] Notification processor failed', {
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
    })

    // Return error response - don't throw to prevent automatic retries
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
        // Don't include stack trace in production
        details:
          Deno.env.get('ENVIRONMENT') === 'development'
            ? error instanceof Error
              ? error.stack
              : undefined
            : undefined,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})

/**
 * Determine recipients for a notification based on entity type, entity ID, and action
 */
async function determineRecipientsForEntity(
  supabaseClient: ReturnType<typeof createClient>,
  entityType: EntityType,
  entityId: string,
  action: string,
  excludeUserId?: string
): Promise<string[]> {
  const recipients: string[] = []

  try {
    if (entityType === 'task') {
      // Get task assignees
      const { data: assignees } = await supabaseClient
        .from('task_assignees')
        .select('profile_id')
        .eq('task_id', entityId)

      if (assignees && assignees.length > 0) {
        const profileIds = assignees.map((a) => a.profile_id)
        const { data: profiles } = await supabaseClient
          .from('profiles')
          .select('user_id')
          .in('id', profileIds)

        if (profiles) {
          for (const profile of profiles) {
            if (profile.user_id && profile.user_id !== excludeUserId) {
              recipients.push(profile.user_id)
            }
          }
        }
      }

      // For task creation, also notify department members if task has department
      if (action === 'created') {
        const { data: task } = await supabaseClient
          .from('tasks')
          .select('department_id')
          .eq('id', entityId)
          .single()

        if (task?.department_id) {
          const { data: departmentMembers } = await supabaseClient
            .from('profiles')
            .select('user_id')
            .eq('department_id', task.department_id)

          if (departmentMembers) {
            for (const member of departmentMembers) {
              if (
                member.user_id &&
                member.user_id !== excludeUserId &&
                !recipients.includes(member.user_id)
              ) {
                recipients.push(member.user_id)
              }
            }
          }
        }
      }
    }

    // Lead recipients
    if (entityType === 'lead') {
      const { data: lead } = await supabaseClient
        .from('leads')
        .select('owner_id')
        .eq('id', entityId)
        .single()

      if (lead?.owner_id && lead.owner_id !== excludeUserId) {
        recipients.push(lead.owner_id)
      }
    }

    return [...new Set(recipients)] // Remove duplicates
  } catch (error) {
    console.warn('⚠️ [Edge Function] Error determining recipients', { error })
    return []
  }
}

/**
 * Build notification message based on type, entity, and actor
 */
function buildNotificationMessage(
  type: NotificationType,
  entity: { title?: string; name?: string; id?: string },
  actor?: { name?: string; first_name?: string; last_name?: string }
): { title: string; message: string } {
  const entityName = entity.title || entity.name || `#${entity.id?.slice(0, 8)}` || 'item'
  const actorName =
    actor?.name ||
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

  return (
    messages[type] || {
      title: 'Notification',
      message: entityName,
    }
  )
}

/**
 * Build action URL for a notification
 */
function buildActionUrl(entityType: EntityType, entityId: string): string | null {
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
