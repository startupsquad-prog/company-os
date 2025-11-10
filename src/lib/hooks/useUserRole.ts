'use client'

import { useEffect, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { createClient } from '@/lib/supabase/client'

export type UserRole = 'employee' | 'manager' | 'admin' | 'superadmin' | null

interface UseUserRoleReturn {
  role: UserRole
  isLoading: boolean
  error: Error | null
}

export function useUserRole(): UseUserRoleReturn {
  const [role, setRole] = useState<UserRole>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const { user: clerkUser, isLoaded: userLoaded } = useUser()

  useEffect(() => {
    async function fetchUserRole() {
      try {
        setIsLoading(true)
        setError(null)

        // Check for missing environment variables
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
          console.warn('Supabase environment variables not set, defaulting to employee role')
          setRole('employee')
          setIsLoading(false)
          return
        }

        if (!userLoaded || !clerkUser) {
          // Default to employee role when not authenticated
          setRole('employee')
          setIsLoading(false)
          return
        }

        console.log('[useUserRole] Clerk user ID:', clerkUser.id)
        console.log('[useUserRole] Clerk user email:', clerkUser.emailAddresses[0]?.emailAddress)

        const supabase = createClient()

        // Set Clerk user ID in Supabase session for RLS policies
        try {
          await supabase.rpc('set_clerk_user_id', { p_user_id: clerkUser.id })
        } catch (e) {
          console.warn('Failed to set Clerk user ID in Supabase session:', e)
        }

        // Use RPC function to get user roles (more reliable with RLS)
        console.log('[useUserRole] Calling get_user_roles with user_id:', clerkUser.id)
        const { data: rolesData, error: rolesError } = await supabase.rpc('get_user_roles', {
          p_user_id: clerkUser.id,
        })
        
        console.log('[useUserRole] RPC response - data:', rolesData, 'error:', rolesError)

        if (rolesError) {
          console.error('Error fetching roles:', rolesError)
          // Default to employee on error - don't break the UI
          setRole('employee')
          setIsLoading(false)
          return
        }

        if (!rolesData || rolesData.length === 0) {
          setRole('employee') // Default to employee if no role assigned
          setIsLoading(false)
          return
        }

        // Find the highest role (superadmin > admin > manager > employee)
        const roleNames = (rolesData || []).map((r: any) => r.role_name) as string[]

        console.log('[useUserRole] Fetched roles data:', rolesData)
        console.log('[useUserRole] Role names:', roleNames)

        let userRole: UserRole = 'employee'

        if (roleNames.includes('superadmin')) {
          userRole = 'superadmin'
        } else if (roleNames.includes('admin')) {
          userRole = 'admin'
        } else if (roleNames.includes('manager')) {
          userRole = 'manager'
        }

        console.log('[useUserRole] Setting role to:', userRole)
        setRole(userRole)
      } catch (err) {
        console.error('Error in useUserRole:', err)
        setError(err instanceof Error ? err : new Error('Unknown error'))
        // Always default to employee role on any error - ensures UI doesn't break
        setRole('employee')
      } finally {
        setIsLoading(false)
      }
    }

    if (userLoaded) {
      fetchUserRole()
    }
  }, [userLoaded, clerkUser?.id])

  return { role, isLoading, error }
}
