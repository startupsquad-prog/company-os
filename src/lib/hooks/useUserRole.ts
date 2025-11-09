"use client"

import { useEffect, useState } from 'react'
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

        const supabase = createClient()
        
        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        if (userError || !user) {
          // Default to employee role when not authenticated
          setRole('employee')
          setIsLoading(false)
          return
        }

        // Get user's role bindings
        const { data: roleBindings, error: roleError } = await supabase
          .from('user_role_bindings')
          .select('role_id')
          .eq('user_id', user.id)

        if (roleError) {
          console.error('Error fetching role bindings:', roleError)
          // Default to employee on error - don't break the UI
          setRole('employee')
          setIsLoading(false)
          return
        }

        if (!roleBindings || roleBindings.length === 0) {
          setRole('employee') // Default to employee if no role assigned
          setIsLoading(false)
          return
        }

        // Get role names for each role_id
        const roleIds = roleBindings.map((rb: any) => rb.role_id)
        const { data: roles, error: rolesError } = await supabase
          .from('roles')
          .select('name')
          .in('id', roleIds)

        if (rolesError) {
          console.error('Error fetching roles:', rolesError)
          setRole('employee') // Default to employee
          setIsLoading(false)
          return
        }

        // Find the highest role (superadmin > admin > manager > employee)
        const roleNames = (roles || []).map((r: any) => r.name) as string[]

        let userRole: UserRole = 'employee'
        
        if (roleNames.includes('superadmin')) {
          userRole = 'superadmin'
        } else if (roleNames.includes('admin')) {
          userRole = 'admin'
        } else if (roleNames.includes('manager')) {
          userRole = 'manager'
        }

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

    fetchUserRole()
  }, [])

  return { role, isLoading, error }
}

