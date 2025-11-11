/**
 * useNotificationCount Hook
 * Company OS: Lightweight hook for unread notification count only
 */

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { createClient } from '@/lib/supabase/client'

export function useNotificationCount() {
  const { user: clerkUser } = useUser()
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true
    let debounceTimer: ReturnType<typeof setTimeout> | null = null

    const fetchCount = async () => {
      if (!isMounted || !clerkUser) return

      try {
        const supabase = createClient()

        // Use RPC function for efficiency
        // Note: Notifications will be rebuilt later with a better approach
        const { data: count, error } = await (supabase as any).rpc('get_unread_notification_count', {
          p_user_id: clerkUser.id,
        })

        if (error) {
          // Silently fail for now - notifications will be rebuilt later
          console.warn('Notification count fetch failed (will be rebuilt later):', error.message)
          if (isMounted) {
            setCount(0)
            setLoading(false)
          }
          return
        }

        if (isMounted) {
          setCount(count || 0)
          setLoading(false)
        }
      } catch (error) {
        console.error('Error fetching notification count:', error)
        if (isMounted) {
          setCount(0)
          setLoading(false)
        }
      }
    }

    // Initial fetch
    fetchCount()

    // Set up real-time subscription for count updates
    const supabase = createClient()
    let channel: ReturnType<typeof supabase.channel> | null = null

    const setupSubscription = async () => {
      if (!clerkUser || !isMounted) return

      channel = supabase
        .channel(`notification-count:${clerkUser.id}`)
        .on(
          'postgres_changes',
          {
            event: '*', // Listen to all changes (INSERT, UPDATE, DELETE)
            schema: 'core',
            table: 'notifications',
            filter: `user_id=eq.${clerkUser.id}`,
          },
          () => {
            // Debounce: wait 1 second before refetching to avoid rapid-fire calls
            if (debounceTimer) {
              clearTimeout(debounceTimer)
            }
            debounceTimer = setTimeout(() => {
              if (isMounted) {
                fetchCount()
              }
            }, 1000)
          }
        )
        .subscribe()
    }

    setupSubscription()

    // Refresh count every 30 seconds as fallback
    const interval = setInterval(() => {
      if (isMounted) {
        fetchCount()
      }
    }, 30000)

    return () => {
      isMounted = false
      if (debounceTimer) {
        clearTimeout(debounceTimer)
      }
      if (channel) {
        supabase.removeChannel(channel)
      }
      clearInterval(interval)
    }
  }, [clerkUser]) // Run when clerkUser changes

  const refresh = async () => {
    try {
      setLoading(true)
      if (!clerkUser) {
        setCount(0)
        setLoading(false)
        return
      }

      const supabase = createClient()
      const { data: count, error } = await (supabase as any).rpc('get_unread_notification_count', {
        p_user_id: clerkUser.id,
      })

      if (error) {
        // Silently fail for now - notifications will be rebuilt later
        console.warn('Notification count refresh failed (will be rebuilt later):', error.message)
        setCount(0)
        setLoading(false)
        return
      }

      setCount(count || 0)
    } catch (error) {
      console.error('Error fetching notification count:', error)
      setCount(0)
    } finally {
      setLoading(false)
    }
  }

  return { count, loading, refresh }
}
