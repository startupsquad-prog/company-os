export type Role = {
  role_id: string
  role_name: string
  description?: string
}

export type RoleContextValue = {
  activeRole: Role | null
  setActiveRole: (role: Role | null) => void
  roles: Role[]
  allowedModules: string[]
  permissions: string[]
  can: (permission: string, module?: string) => boolean
  loading: boolean
}
