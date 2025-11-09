'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Role, RoleContextValue } from './types'

export const RoleContext = createContext<RoleContextValue | undefined>(undefined)

const ACTIVE_ROLE_STORAGE_KEY = 'active_role'

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [roles, setRoles] = useState<Role[]>([])
  const [activeRole, setActiveRoleState] = useState<Role | null>(null)
  const [allowedModules, setAllowedModules] = useState<string[]>([])
  const [permissions, setPermissions] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  // Load roles and modules
  const loadRoleData = useCallback(async () => {
    try {
      setLoading(true)
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        setRoles([])
        setAllowedModules([])
        setPermissions([])
        setActiveRoleState(null)
        setLoading(false)
        if (userError) {
          console.error('Error getting user:', userError)
        }
        return
      }

      // Fetch user roles (using public wrapper function)
      const { data: rolesData, error: rolesError } = await supabase.rpc('get_user_roles', {
        p_user_id: user.id,
      })

      if (rolesError) {
        console.error('Error fetching roles:', {
          message: rolesError.message || 'Unknown error',
          code: rolesError.code,
          details: rolesError.details,
          hint: rolesError.hint,
          error: rolesError,
        })
        setRoles([])
        setAllowedModules([])
        setPermissions([])
        setActiveRoleState(null)
        setLoading(false)
        return
      }

      const parsedRoles: Role[] = rolesData || []
      setRoles(parsedRoles)

      // Fetch allowed modules (using public wrapper function)
      const { data: modulesData, error: modulesError } = await supabase.rpc('get_allowed_modules', {
        p_user_id: user.id,
      })

      if (modulesError) {
        console.error('Error fetching modules:', {
          message: modulesError.message || 'Unknown error',
          code: modulesError.code,
          details: modulesError.details,
          error: modulesError,
        })
        setAllowedModules([])
      } else {
        setAllowedModules(modulesData || [])
      }

      // Fetch permissions (using public wrapper function)
      const { data: permissionsData, error: permissionsError } = await supabase.rpc('get_user_permissions', {
        p_user_id: user.id,
        p_module_name: null,
      })

      if (permissionsError) {
        console.error('Error fetching permissions:', {
          message: permissionsError.message || 'Unknown error',
          code: permissionsError.code,
          details: permissionsError.details,
          error: permissionsError,
        })
        setPermissions([])
      } else {
        setPermissions(permissionsData || [])
      }

      // Set active role
      if (parsedRoles.length > 0) {
        // Try to load from localStorage
        const storedRoleId = localStorage.getItem(ACTIVE_ROLE_STORAGE_KEY)
        const storedRole = storedRoleId
          ? parsedRoles.find(r => r.role_id === storedRoleId)
          : null
        
        // Use stored role if valid, otherwise use first role
        const initialRole = storedRole || parsedRoles[0]
        setActiveRoleState(initialRole)
        localStorage.setItem(ACTIVE_ROLE_STORAGE_KEY, initialRole.role_id)
      } else {
        setActiveRoleState(null)
        localStorage.removeItem(ACTIVE_ROLE_STORAGE_KEY)
      }
    } catch (error) {
      console.error('Error loading role data:', error)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  // Set active role and persist to localStorage
  const setActiveRole = useCallback((role: Role | null) => {
    setActiveRoleState(role)
    if (role) {
      localStorage.setItem(ACTIVE_ROLE_STORAGE_KEY, role.role_id)
      // Reload modules and permissions for the new role
      loadRoleData()
    } else {
      localStorage.removeItem(ACTIVE_ROLE_STORAGE_KEY)
    }
  }, [loadRoleData])

  // Permission check helper
  const can = useCallback((permission: string, module?: string): boolean => {
    // Check if user has the permission
    const hasPermission = permissions.includes(permission)
    
    // If module specified, also check if user has access to that module
    if (module) {
      const hasModuleAccess = allowedModules.includes(module)
      return hasPermission && hasModuleAccess
    }
    
    return hasPermission
  }, [permissions, allowedModules])

  // Load data on mount and when auth state changes
  useEffect(() => {
    loadRoleData()

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      loadRoleData()
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [loadRoleData, supabase])

  const value: RoleContextValue = {
    activeRole,
    setActiveRole,
    roles,
    allowedModules,
    permissions,
    can,
    loading,
  }

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>
}

