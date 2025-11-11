/**
 * Generic Query Builders
 *
 * Reusable query functions that reduce boilerplate and enforce best practices.
 * These functions automatically apply RLS, ownership checks, and common patterns.
 *
 * Usage:
 *   import { dbGet, dbFind, dbCreate, dbUpdate, dbDelete } from '@/lib/query-builders'
 *
 *   const tasks = await dbGet('tasks', { status: 'active' })
 *   const task = await dbFind('tasks', taskId)
 *   const newTask = await dbCreate('tasks', { title: 'New Task' })
 */

import { db, schema } from '@/db/client'
import { getAuthContext, type AuthContext } from '@/db/auth-context'
import {
  getOwnershipColumn,
  getDepartmentColumn,
  roleHasPermission,
  type Resource,
  type Action,
} from '@/lib/rbac-map'
import { withAuthQuery, type PermissionRequirement } from '@/lib/dbGuard'
import { eq, and, isNull, SQL } from 'drizzle-orm'

/**
 * Generic get query with automatic RLS enforcement
 *
 * @example
 * ```ts
 * // Get all active tasks
 * const tasks = await dbGet('tasks', {
 *   filters: { status: 'active' },
 *   orderBy: 'createdAt',
 *   limit: 10
 * })
 * ```
 */
export async function dbGet<T = any>(
  resource: Resource,
  options?: {
    filters?: Record<string, any>
    orderBy?: string
    limit?: number
    offset?: number
  }
): Promise<T[]> {
  return withAuthQuery(
    {
      permission: {
        resource,
        action: 'read',
      },
    },
    async (context) => {
      const tableName = resource as keyof typeof schema
      const tableSchema = schema[tableName] as any

      if (!tableSchema) {
        throw new Error(`Table ${resource} not found in schema`)
      }

      // Build WHERE conditions
      const conditions: SQL[] = []

      // Always filter out deleted records
      if (tableSchema.deletedAt) {
        conditions.push(isNull(tableSchema.deletedAt))
      }

      // Apply ownership filter if applicable
      const ownerColumn = getOwnershipColumn(resource)
      if (ownerColumn && tableSchema[ownerColumn]) {
        // Admins can see all, others see only their own
        const userRoles = await getUserRoles(context.userId)
        const isAdmin = userRoles.includes('admin') || userRoles.includes('superadmin')

        if (!isAdmin) {
          conditions.push(eq(tableSchema[ownerColumn], context.profileId))
        }
      }

      // Apply department filter for managers
      const deptColumn = getDepartmentColumn(resource)
      if (deptColumn && context.departmentId && tableSchema[deptColumn]) {
        const userRoles = await getUserRoles(context.userId)
        const isManager = userRoles.includes('manager') || userRoles.includes('admin')

        if (isManager && !isAdmin) {
          conditions.push(eq(tableSchema[deptColumn], context.departmentId))
        }
      }

      // Apply custom filters
      if (options?.filters) {
        for (const [key, value] of Object.entries(options.filters)) {
          if (value !== undefined && value !== null && tableSchema[key]) {
            conditions.push(eq(tableSchema[key], value))
          }
        }
      }

      // Build query
      let query = db.select().from(tableSchema)

      if (conditions.length > 0) {
        query = query.where(and(...conditions)) as any
      }

      // Apply ordering
      if (options?.orderBy && tableSchema[options.orderBy]) {
        query = query.orderBy(tableSchema[options.orderBy]) as any
      }

      // Apply limit
      if (options?.limit) {
        query = query.limit(options.limit) as any
      }

      // Apply offset
      if (options?.offset) {
        query = query.offset(options.offset) as any
      }

      return query as Promise<T[]>
    }
  )
}

/**
 * Find a single record by ID with RLS enforcement
 *
 * @example
 * ```ts
 * const task = await dbFind('tasks', taskId)
 * ```
 */
export async function dbFind<T = any>(resource: Resource, id: string): Promise<T | null> {
  return withAuthQuery(
    {
      permission: {
        resource,
        action: 'read',
      },
    },
    async (context) => {
      const tableName = resource as keyof typeof schema
      const tableSchema = schema[tableName] as any

      if (!tableSchema) {
        throw new Error(`Table ${resource} not found in schema`)
      }

      const conditions: SQL[] = [eq(tableSchema.id, id)]

      // Always filter out deleted records
      if (tableSchema.deletedAt) {
        conditions.push(isNull(tableSchema.deletedAt))
      }

      // Apply ownership filter
      const ownerColumn = getOwnershipColumn(resource)
      if (ownerColumn && tableSchema[ownerColumn]) {
        const userRoles = await getUserRoles(context.userId)
        const isAdmin = userRoles.includes('admin') || userRoles.includes('superadmin')

        if (!isAdmin) {
          conditions.push(eq(tableSchema[ownerColumn], context.profileId))
        }
      }

      const result = await db
        .select()
        .from(tableSchema)
        .where(and(...conditions))
        .limit(1)

      return (result[0] as T) || null
    }
  )
}

/**
 * Create a new record with automatic ownership assignment
 *
 * @example
 * ```ts
 * const task = await dbCreate('tasks', {
 *   title: 'New Task',
 *   status: 'pending'
 * })
 * ```
 */
export async function dbCreate<T = any>(resource: Resource, data: Record<string, any>): Promise<T> {
  return withAuthQuery(
    {
      permission: {
        resource,
        action: 'create',
      },
    },
    async (context) => {
      const tableName = resource as keyof typeof schema
      const tableSchema = schema[tableName] as any

      if (!tableSchema) {
        throw new Error(`Table ${resource} not found in schema`)
      }

      // Automatically set owner if column exists
      const ownerColumn = getOwnershipColumn(resource)
      if (ownerColumn && tableSchema[ownerColumn] && !data[ownerColumn]) {
        data[ownerColumn] = context.profileId
      }

      // Automatically set createdBy if column exists
      if (tableSchema.createdBy && !data.createdBy) {
        data.createdBy = context.profileId
      }

      // Automatically set department if user has one
      const deptColumn = getDepartmentColumn(resource)
      if (deptColumn && context.departmentId && tableSchema[deptColumn] && !data[deptColumn]) {
        data[deptColumn] = context.departmentId
      }

      const [result] = await db.insert(tableSchema).values(data).returning()

      return result as T
    }
  )
}

/**
 * Update a record with RLS enforcement
 *
 * @example
 * ```ts
 * const updated = await dbUpdate('tasks', taskId, {
 *   status: 'completed'
 * })
 * ```
 */
export async function dbUpdate<T = any>(
  resource: Resource,
  id: string,
  data: Record<string, any>
): Promise<T | null> {
  return withAuthQuery(
    {
      permission: {
        resource,
        action: 'update',
      },
    },
    async (context) => {
      const tableName = resource as keyof typeof schema
      const tableSchema = schema[tableName] as any

      if (!tableSchema) {
        throw new Error(`Table ${resource} not found in schema`)
      }

      const conditions: SQL[] = [eq(tableSchema.id, id)]

      // Apply ownership filter
      const ownerColumn = getOwnershipColumn(resource)
      if (ownerColumn && tableSchema[ownerColumn]) {
        const userRoles = await getUserRoles(context.userId)
        const isAdmin = userRoles.includes('admin') || userRoles.includes('superadmin')

        if (!isAdmin) {
          conditions.push(eq(tableSchema[ownerColumn], context.profileId))
        }
      }

      // Check if record exists and user has access
      const existing = await db
        .select()
        .from(tableSchema)
        .where(and(...conditions))
        .limit(1)

      if (existing.length === 0) {
        return null
      }

      // Don't allow updating ownership columns
      if (ownerColumn && data[ownerColumn]) {
        delete data[ownerColumn]
      }

      const [result] = await db
        .update(tableSchema)
        .set(data)
        .where(and(...conditions))
        .returning()

      return (result as T) || null
    }
  )
}

/**
 * Delete a record (soft delete) with RLS enforcement
 *
 * @example
 * ```ts
 * await dbDelete('tasks', taskId)
 * ```
 */
export async function dbDelete(
  resource: Resource,
  id: string,
  options?: { hardDelete?: boolean }
): Promise<boolean> {
  return withAuthQuery(
    {
      permission: {
        resource,
        action: 'delete',
      },
    },
    async (context) => {
      const tableName = resource as keyof typeof schema
      const tableSchema = schema[tableName] as any

      if (!tableSchema) {
        throw new Error(`Table ${resource} not found in schema`)
      }

      const conditions: SQL[] = [eq(tableSchema.id, id)]

      // Apply ownership filter
      const ownerColumn = getOwnershipColumn(resource)
      if (ownerColumn && tableSchema[ownerColumn]) {
        const userRoles = await getUserRoles(context.userId)
        const isAdmin = userRoles.includes('admin') || userRoles.includes('superadmin')

        if (!isAdmin) {
          conditions.push(eq(tableSchema[ownerColumn], context.profileId))
        }
      }

      if (options?.hardDelete) {
        await db.delete(tableSchema).where(and(...conditions))
      } else {
        // Soft delete
        if (tableSchema.deletedAt) {
          await db
            .update(tableSchema)
            .set({ deletedAt: new Date() })
            .where(and(...conditions))
        } else {
          throw new Error(`Table ${resource} does not support soft delete`)
        }
      }

      return true
    }
  )
}

/**
 * Helper to get user roles (cached for performance)
 */
const roleCache = new Map<string, string[]>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

async function getUserRoles(userId: string): Promise<string[]> {
  // Check cache
  const cached = roleCache.get(userId)
  if (cached) {
    return cached
  }

  // Fetch from database
  const roleBindings = await db
    .select({
      roleName: schema.roles.name,
    })
    .from(schema.userRoleBindings)
    .innerJoin(schema.roles, eq(schema.userRoleBindings.roleId, schema.roles.id))
    .where(eq(schema.userRoleBindings.userId, userId))

  const roles = roleBindings.map((rb) => rb.roleName).filter(Boolean) as string[]

  // Cache for TTL
  roleCache.set(userId, roles)
  setTimeout(() => roleCache.delete(userId), CACHE_TTL)

  return roles
}





