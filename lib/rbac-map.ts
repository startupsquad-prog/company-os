/**
 * Centralized RBAC Map
 *
 * This file contains ALL permission rules and role definitions.
 * Keep this as the single source of truth for access control logic.
 *
 * IMPORTANT: When adding new permissions or roles, update this file first.
 */

/**
 * Resource types in the system
 */
export type Resource =
  | 'contacts'
  | 'companies'
  | 'leads'
  | 'opportunities'
  | 'tasks'
  | 'orders'
  | 'quotations'
  | 'shipments'
  | 'applications'
  | 'candidates'
  | 'interviews'
  | 'users'
  | 'roles'
  | 'permissions'
  | 'departments'
  | 'teams'
  | 'employees'
  | 'notifications'
  | 'files'
  | 'sops'
  | 'password_vault'
  | 'subscriptions'

/**
 * Action types
 */
export type Action = 'read' | 'create' | 'update' | 'delete' | 'manage' | 'export'

/**
 * Role definitions with their default permissions
 */
export const ROLE_PERMISSIONS: Record<string, Array<`${Resource}:${Action}`>> = {
  // Super Admin - Full access to everything
  superadmin: [
    'contacts:manage',
    'companies:manage',
    'leads:manage',
    'opportunities:manage',
    'tasks:manage',
    'orders:manage',
    'quotations:manage',
    'shipments:manage',
    'applications:manage',
    'candidates:manage',
    'interviews:manage',
    'users:manage',
    'roles:manage',
    'permissions:manage',
    'departments:manage',
    'teams:manage',
    'employees:manage',
    'notifications:manage',
    'files:manage',
    'sops:manage',
    'password_vault:manage',
    'subscriptions:manage',
  ],

  // Admin - Full access except user management
  admin: [
    'contacts:manage',
    'companies:manage',
    'leads:manage',
    'opportunities:manage',
    'tasks:manage',
    'orders:manage',
    'quotations:manage',
    'shipments:manage',
    'applications:manage',
    'candidates:manage',
    'interviews:manage',
    'users:read',
    'roles:read',
    'permissions:read',
    'departments:read',
    'teams:read',
    'employees:read',
    'notifications:manage',
    'files:manage',
    'sops:read',
    'password_vault:read',
    'subscriptions:read',
  ],

  // Manager - Department-level access
  manager: [
    'contacts:read',
    'contacts:create',
    'contacts:update',
    'companies:read',
    'companies:create',
    'companies:update',
    'leads:read',
    'leads:create',
    'leads:update',
    'opportunities:read',
    'opportunities:create',
    'opportunities:update',
    'tasks:read',
    'tasks:create',
    'tasks:update',
    'orders:read',
    'orders:create',
    'orders:update',
    'quotations:read',
    'quotations:create',
    'quotations:update',
    'shipments:read',
    'shipments:create',
    'shipments:update',
    'applications:read',
    'candidates:read',
    'interviews:read',
    'notifications:read',
    'notifications:update',
    'files:read',
    'files:create',
    'sops:read',
  ],

  // Employee - Own records only
  employee: [
    'contacts:read',
    'companies:read',
    'leads:read',
    'leads:create',
    'leads:update', // Own leads only
    'opportunities:read',
    'tasks:read',
    'tasks:create',
    'tasks:update', // Own/assigned tasks only
    'orders:read',
    'quotations:read',
    'shipments:read',
    'applications:read',
    'applications:create',
    'candidates:read',
    'candidates:create',
    'interviews:read',
    'notifications:read',
    'notifications:update',
    'files:read',
    'files:create',
    'sops:read',
  ],

  // Sales Executive - CRM-focused access
  sales_exec: [
    'contacts:read',
    'contacts:create',
    'contacts:update',
    'companies:read',
    'companies:create',
    'companies:update',
    'leads:read',
    'leads:create',
    'leads:update',
    'opportunities:read',
    'opportunities:create',
    'opportunities:update',
    'tasks:read',
    'tasks:create',
    'tasks:update',
    'notifications:read',
    'notifications:update',
    'files:read',
    'files:create',
  ],

  // Client Ops - Operations-focused access
  client_ops: [
    'contacts:read',
    'companies:read',
    'leads:read',
    'orders:read',
    'orders:create',
    'orders:update',
    'quotations:read',
    'quotations:create',
    'quotations:update',
    'shipments:read',
    'shipments:create',
    'shipments:update',
    'tasks:read',
    'tasks:create',
    'tasks:update',
    'notifications:read',
    'notifications:update',
    'files:read',
    'files:create',
  ],

  // Creative - Limited access
  creative: [
    'tasks:read',
    'tasks:update', // Own tasks only
    'files:read',
    'files:create',
    'notifications:read',
    'notifications:update',
  ],
}

/**
 * Role hierarchy (higher number = more permissions)
 */
export const ROLE_HIERARCHY: Record<string, number> = {
  superadmin: 100,
  admin: 90,
  manager: 50,
  sales_exec: 40,
  client_ops: 40,
  employee: 10,
  creative: 10,
}

/**
 * Check if a role has a specific permission
 */
export function roleHasPermission(role: string, resource: Resource, action: Action): boolean {
  const permissions = ROLE_PERMISSIONS[role] || []
  const permission = `${resource}:${action}` as const
  const managePermission = `${resource}:manage` as const

  // Check exact permission or manage permission
  return permissions.includes(permission) || permissions.includes(managePermission)
}

/**
 * Check if role1 has higher or equal hierarchy than role2
 */
export function roleHasAccess(role1: string, role2: string): boolean {
  const level1 = ROLE_HIERARCHY[role1] || 0
  const level2 = ROLE_HIERARCHY[role2] || 0
  return level1 >= level2
}

/**
 * Get all permissions for a role
 */
export function getRolePermissions(role: string): Array<`${Resource}:${Action}`> {
  return ROLE_PERMISSIONS[role] || []
}

/**
 * Get all roles that have a specific permission
 */
export function getRolesWithPermission(resource: Resource, action: Action): string[] {
  const permission = `${resource}:${action}` as const
  const managePermission = `${resource}:manage` as const

  return Object.entries(ROLE_PERMISSIONS)
    .filter(
      ([_, permissions]) =>
        permissions.includes(permission) || permissions.includes(managePermission)
    )
    .map(([role]) => role)
}

/**
 * Module access rules (which roles can access which modules)
 */
export const MODULE_ACCESS: Record<string, string[]> = {
  crm: ['superadmin', 'admin', 'manager', 'sales_exec', 'employee'],
  ats: ['superadmin', 'admin', 'manager', 'employee'],
  ops: ['superadmin', 'admin', 'manager', 'client_ops', 'employee'],
  import_ops: ['superadmin', 'admin', 'manager', 'client_ops'],
  tasks: ['superadmin', 'admin', 'manager', 'sales_exec', 'client_ops', 'employee', 'creative'],
  admin: ['superadmin', 'admin'],
}

/**
 * Check if a role can access a module
 */
export function canAccessModule(role: string, module: string): boolean {
  const allowedRoles = MODULE_ACCESS[module] || []
  return allowedRoles.includes(role)
}

/**
 * Resource ownership rules (which columns indicate ownership)
 */
export const OWNERSHIP_COLUMNS: Record<Resource, string[]> = {
  contacts: ['createdBy'],
  companies: ['createdBy'],
  leads: ['ownerId', 'createdBy'],
  opportunities: ['ownerId', 'createdBy'],
  tasks: ['createdBy'],
  orders: ['ownerId', 'createdBy'],
  quotations: ['createdBy'],
  shipments: ['createdBy'],
  applications: ['candidateId'], // Links to contact
  candidates: ['contactId'],
  interviews: ['applicationId'],
  users: ['id'], // Only admins
  roles: [], // Only admins
  permissions: [], // Only admins
  departments: [], // Only admins
  teams: [], // Only admins
  employees: ['profileId'],
  notifications: ['userId'],
  files: ['createdBy'],
  sops: ['createdBy'],
  password_vault: ['createdBy'],
  subscriptions: ['ownerTeamId'],
}

/**
 * Get ownership column for a resource
 */
export function getOwnershipColumn(resource: Resource): string | null {
  const columns = OWNERSHIP_COLUMNS[resource]
  return columns[0] || null
}

/**
 * Department-based access rules
 */
export const DEPARTMENT_COLUMNS: Record<Resource, string[]> = {
  contacts: [],
  companies: [],
  leads: ['departmentId'],
  opportunities: ['departmentId'],
  tasks: ['departmentId'],
  orders: ['departmentId'],
  quotations: [],
  shipments: [],
  applications: [],
  candidates: [],
  interviews: [],
  users: [],
  roles: [],
  permissions: [],
  departments: [],
  teams: ['departmentId'],
  employees: ['departmentId'],
  notifications: [],
  files: [],
  sops: [],
  password_vault: [],
  subscriptions: [],
}

/**
 * Get department column for a resource
 */
export function getDepartmentColumn(resource: Resource): string | null {
  const columns = DEPARTMENT_COLUMNS[resource]
  return columns[0] || null
}

