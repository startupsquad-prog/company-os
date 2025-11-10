import { useContext } from 'react'
import { RoleContext } from './role-context'
import type { RoleContextValue } from './types'

export function useRole(): RoleContextValue {
  const context = useContext(RoleContext)

  if (context === undefined) {
    throw new Error('useRole must be used within a RoleProvider')
  }

  return context
}
