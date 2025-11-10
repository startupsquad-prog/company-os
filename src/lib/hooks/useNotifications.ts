/**
 * useNotifications Hook
 * Company OS: Main hook for fetching and managing notifications
 */

import { useState, useEffect, useCallback } from 'react'
import { useUser } from '@clerk/nextjs'
import { createClient } from '@/lib/supabase/client'
import type {
  NotificationRow,
  NotificationFilters,
  NotificationListResponse,
} from '@/lib/notifications/notification-types'

interface UseNotificationsOptions {
  filters?: NotificationFilters
  autoRefresh?: boolean
  refreshInterval?: number
}

export function useNotifications(options: UseNotificationsOptions = {}) {
  const { filters = {}, autoRefresh = false, refreshInterval = 30000 } = options
  const { user: clerkUser } = useUser()
  const [notifications, setNotifications] = useState<NotificationRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [unreadCount, setUnreadCount] = useState(0)
  const [total, setTotal] = useState(0)

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      if (!clerkUser) {
        setLoading(false)
        return
      }

      const supabase = createClient()

      // Build query directly using Supabase client (like tasks)
      let query = supabase
        .from('notifications')
        .select('*', { count: 'exact' })
        .eq('user_id', clerkUser.id)
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

      // Apply pagination
      const limit = filters.limit || 50
      const offset = filters.offset || 0
      query = query.range(offset, offset + limit - 1)

      const { data: notificationsData, error, count } = await query

      if (error) {
        throw new Error(`Failed to fetch notifications: ${error.message}`)
      }

      // Calculate unread count
      const unreadCount = (notificationsData || []).filter((n) => !n.read_at).length

      setNotifications(notificationsData || [])
      setUnreadCount(unreadCount)
      setTotal(count || 0)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'))
      console.error('Error fetching notifications:', err)
    } finally {
      setLoading(false)
    }
  }, [filters.read, filters.type, filters.entity_type, filters.limit, filters.offset]) // Only depend on individual filter properties, not the object

  const markAsRead = useCallback(
    async (notificationId: string) => {
      try {
        if (!clerkUser) {
          throw new Error('Unauthorized')
        }

        const supabase = createClient()
        const { error } = await supabase
          .from('notifications')
          .update({ read_at: new Date().toISOString() })
          .eq('id', notificationId)
          .eq('user_id', clerkUser.id)

        if (error) {
          throw new Error(`Failed to mark notification as read: ${error.message}`)
        }

        // Update local state
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notificationId ? { ...n, read_at: new Date().toISOString() } : n
          )
        )
        setUnreadCount((prev) => Math.max(0, prev - 1))
      } catch (err) {
        console.error('Error marking notification as read:', err)
        throw err
      }
    },
    [clerkUser]
  )

  const markAllAsRead = useCallback(async () => {
    try {
      if (!clerkUser) {
        throw new Error('Unauthorized')
      }

      const supabase = createClient()
      // Use the RPC function for efficiency
      const { error } = await supabase.rpc('mark_all_notifications_read', {
        p_user_id: clerkUser.id,
      })

      if (error) {
        throw new Error(`Failed to mark all notifications as read: ${error.message}`)
      }

      // Update local state
      const now = new Date().toISOString()
      setNotifications((prev) => prev.map((n) => ({ ...n, read_at: n.read_at || now })))
      setUnreadCount(0)
    } catch (err) {
      console.error('Error marking all notifications as read:', err)
      throw err
    }
  }, [clerkUser])

  const deleteNotification = useCallback(
    async (notificationId: string) => {
      try {
        if (!clerkUser) {
          throw new Error('Unauthorized')
        }

        const supabase = createClient()
        // Soft delete by setting deleted_at
        const { error } = await supabase
          .from('notifications')
          .update({ deleted_at: new Date().toISOString() })
          .eq('id', notificationId)
          .eq('user_id', clerkUser.id)

        if (error) {
          throw new Error(`Failed to delete notification: ${error.message}`)
        }

        // Update local state
        setNotifications((prev) => prev.filter((n) => n.id !== notificationId))
        // Decrement unread count if notification was unread
        const notification = notifications.find((n) => n.id === notificationId)
        if (notification && !notification.read_at) {
          setUnreadCount((prev) => Math.max(0, prev - 1))
        }
      } catch (err) {
        console.error('Error deleting notification:', err)
        throw err
      }
    },
    [notifications]
  )

  // Initial fetch - only when filters or user change
  useEffect(() => {
    if (clerkUser) {
      fetchNotifications()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clerkUser, filters.read, filters.type, filters.entity_type, filters.limit, filters.offset])

  // Auto-refresh if enabled
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      fetchNotifications()
    }, refreshInterval)

    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRefresh, refreshInterval])

  // Set up real-time subscription
  useEffect(() => {
    let isMounted = true
    if (!clerkUser) return

    const supabase = createClient()
    let channel: ReturnType<typeof supabase.channel> | null = null

    const setupSubscription = async () => {
      if (!isMounted) return

      channel = supabase
        .channel(`notifications:${clerkUser.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'core',
            table: 'notifications',
            filter: `user_id=eq.${clerkUser.id}`,
          },
          (payload) => {
            if (!isMounted) return
            // Add new notification to the list
            setNotifications((prev) => [payload.new as NotificationRow, ...prev])
            setUnreadCount((prev) => prev + 1)
            setTotal((prev) => prev + 1)
          }
        )
        .subscribe()
    }

    setupSubscription()

    return () => {
      isMounted = false
      if (channel) {
        supabase.removeChannel(channel)
      }
    }
  }, [clerkUser])

  return {
    notifications,
    loading,
    error,
    unreadCount,
    total,
    refresh: fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  }
}
