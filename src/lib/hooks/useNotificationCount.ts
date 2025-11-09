/**
 * useNotificationCount Hook
 * Company OS: Lightweight hook for unread notification count only
 */

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export function useNotificationCount() {
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true
    let debounceTimer: ReturnType<typeof setTimeout> | null = null

    const fetchCount = async () => {
      if (!isMounted) return
      
      try {
        const supabase = createClient()
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          if (isMounted) {
            setCount(0)
            setLoading(false)
          }
          return
        }

        // Use RPC function for efficiency
        const { data: count, error } = await supabase.rpc('get_unread_notification_count', {
          user_id_param: user.id,
        })

        if (error) {
          throw new Error(`Failed to fetch notification count: ${error.message}`)
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
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user || !isMounted) return

      channel = supabase
        .channel(`notification-count:${user.id}`)
        .on(
          'postgres_changes',
          {
            event: '*', // Listen to all changes (INSERT, UPDATE, DELETE)
            schema: 'core',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`,
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
  }, []) // Empty dependency array - only run once on mount

  const refresh = async () => {
    try {
      setLoading(true)
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setCount(0)
        setLoading(false)
        return
      }

      const { data: count, error } = await supabase.rpc('get_unread_notification_count', {
        user_id_param: user.id,
      })

      if (error) {
        throw new Error(`Failed to fetch notification count: ${error.message}`)
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
