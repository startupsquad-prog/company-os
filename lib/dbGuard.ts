/**
 * Database Guard - Mandatory Permission Checks
 *
 * This module provides wrappers that ENFORCE permission checks on all database queries.
 * Use these wrappers instead of direct Drizzle queries to prevent security vulnerabilities.
 *
 * CRITICAL: All database queries MUST use these wrappers or authorized query functions
 * from db/queries/ to maintain security.
 */

import { db, schema } from '@/db/client'
import {
  getAuthContext,
  type AuthContext,
  hasPermission,
  isAdmin,
  isManager,
} from '@/db/auth-context'
import type { SQL } from 'drizzle-orm'
import { and, eq, or, inArray, isNull } from 'drizzle-orm'

/**
 * Error thrown when a query is attempted without proper authorization
 */
export class UnauthorizedQueryError extends Error {
  constructor(message: string) {
    super(`Unauthorized query: ${message}`)
    this.name = 'UnauthorizedQueryError'
  }
}

/**
 * Error thrown when a query is attempted without authentication
 */
export class UnauthenticatedQueryError extends Error {
  constructor() {
    super('Query requires authentication')
    this.name = 'UnauthenticatedQueryError'
  }
}

/**
 * Permission requirement for a query
 */
export interface PermissionRequirement {
  resource: string
  action: string
  description?: string
}

/**
 * Options for withAuthQuery wrapper
 */
export interface AuthQueryOptions {
  /** Required permission (resource:action) */
  permission?: PermissionRequirement
  /** Required role (admin, manager, etc.) */
  requiredRole?: 'admin' | 'manager' | 'employee'
  /** Allow query if user owns the resource (for owner-based access) */
  allowOwner?: boolean
  /** Custom authorization function */
  authorize?: (context: AuthContext) => boolean | Promise<boolean>
  /** Error message if authorization fails */
  errorMessage?: string
}

/**
 * Wrapper function that enforces authorization before executing a query
 *
 * @example
 * ```ts
 * const tasks = await withAuthQuery(
 *   { permission: { resource: 'tasks', action: 'read' } },
 *   async (context) => {
 *     return db.select().from(schema.tasks)
 *       .where(eq(schema.tasks.createdBy, context.profileId))
 *   }
 * )
 * ```
 */
export async function withAuthQuery<T>(
  options: AuthQueryOptions,
  queryFn: (context: AuthContext) => Promise<T>
): Promise<T> {
  // Get auth context
  const context = await getAuthContext()
  if (!context) {
    throw new UnauthenticatedQueryError()
  }

  // Check required role
  if (options.requiredRole) {
    const roleHierarchy = { admin: 3, manager: 2, employee: 1 }
    const userLevel = roleHierarchy[context.role as keyof typeof roleHierarchy] || 0
    const requiredLevel = roleHierarchy[options.requiredRole]

    if (userLevel < requiredLevel) {
      throw new UnauthorizedQueryError(
        options.errorMessage || `Requires role: ${options.requiredRole}`
      )
    }
  }

  // Check required permission
  if (options.permission) {
    const hasRequiredPermission = hasPermission(
      context,
      options.permission.resource,
      options.permission.action
    )

    if (!hasRequiredPermission) {
      throw new UnauthorizedQueryError(
        options.errorMessage ||
          `Requires permission: ${options.permission.resource}:${options.permission.action}`
      )
    }
  }

  // Check custom authorization
  if (options.authorize) {
    const authorized = await options.authorize(context)
    if (!authorized) {
      throw new UnauthorizedQueryError(options.errorMessage || 'Custom authorization check failed')
    }
  }

  // Execute query with context
  return queryFn(context)
}

/**
 * Build RLS-aware WHERE clause for a table
 * Automatically applies ownership/department filters based on user role
 */
export function buildRLSWhere(
  context: AuthContext,
  table: keyof typeof schema,
  options?: {
    ownerColumn?: string
    departmentColumn?: string
    allowAdmins?: boolean
  }
): SQL | undefined {
  const conditions: SQL[] = []

  // Always filter out deleted records
  const tableSchema = schema[table] as any
  if (tableSchema?.deletedAt) {
    conditions.push(isNull(tableSchema.deletedAt))
  }

  // Admins can see everything (if allowed)
  if (isAdmin(context) && options?.allowAdmins !== false) {
    return conditions.length > 0 ? and(...conditions) : undefined
  }

  // Managers can see department records
  if (isManager(context) && context.departmentId && options?.departmentColumn) {
    const tableSchema = schema[table] as any
    conditions.push(eq(tableSchema[options.departmentColumn], context.departmentId))
  }

  // Employees can only see their own records
  if (options?.ownerColumn) {
    const tableSchema = schema[table] as any
    conditions.push(eq(tableSchema[options.ownerColumn], context.profileId))
  }

  return conditions.length > 0 ? and(...conditions) : undefined
}

/**
 * Generic query builder with automatic RLS enforcement
 *
 * @example
 * ```ts
 * const tasks = await dbGet('tasks', {
 *   status: 'active',
 *   ownerColumn: 'createdBy',
 *   allowAdmins: true
 * })
 * ```
 */
export async function dbGet<T = any>(
  table: keyof typeof schema,
  options?: {
    filters?: Record<string, any>
    ownerColumn?: string
    departmentColumn?: string
    allowAdmins?: boolean
    orderBy?: string
    limit?: number
  }
) {
  return withAuthQuery(
    {
      permission: {
        resource: table as string,
        action: 'read',
      },
    },
    async (context) => {
      const tableSchema = schema[table] as any
      const rlsWhere = buildRLSWhere(context, table, {
        ownerColumn: options?.ownerColumn,
        departmentColumn: options?.departmentColumn,
        allowAdmins: options?.allowAdmins,
      })

      let query = db.select().from(tableSchema)

      // Apply RLS conditions
      if (rlsWhere) {
        query = query.where(rlsWhere) as any
      }

      // Apply additional filters
      if (options?.filters) {
        const filterConditions: any[] = []
        for (const [key, value] of Object.entries(options.filters)) {
          if (value !== undefined && value !== null) {
            filterConditions.push(eq(tableSchema[key], value))
          }
        }
        if (filterConditions.length > 0) {
          const existingWhere = query.toSQL().sql
          query = query.where(
            existingWhere ? and(rlsWhere, ...filterConditions) : and(...filterConditions)
          ) as any
        }
      }

      // Apply ordering
      if (options?.orderBy) {
        query = query.orderBy(tableSchema[options.orderBy]) as any
      }

      // Apply limit
      if (options?.limit) {
        query = query.limit(options.limit) as any
      }

      return query
    }
  )
}

/**
 * Find a single record by ID with RLS enforcement
 */
export async function dbFind<T = any>(
  table: keyof typeof schema,
  id: string,
  options?: {
    ownerColumn?: string
    departmentColumn?: string
    allowAdmins?: boolean
  }
): Promise<T | null> {
  return withAuthQuery(
    {
      permission: {
        resource: table as string,
        action: 'read',
      },
    },
    async (context) => {
      const tableSchema = schema[table] as any
      const rlsWhere = buildRLSWhere(context, table, options)

      const conditions = [eq(tableSchema.id, id)]
      if (rlsWhere) {
        conditions.push(rlsWhere as any)
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
 * Create a record with automatic ownership assignment
 */
export async function dbCreate<T = any>(
  table: keyof typeof schema,
  data: Record<string, any>,
  options?: {
    permission?: PermissionRequirement
    setOwner?: boolean
    setDepartment?: boolean
  }
): Promise<T> {
  return withAuthQuery(
    {
      permission: options?.permission || {
        resource: table as string,
        action: 'create',
      },
    },
    async (context) => {
      const tableSchema = schema[table] as any

      // Automatically set owner if option is enabled
      if (options?.setOwner && tableSchema.createdBy) {
        data.createdBy = context.profileId
      }

      // Automatically set department if option is enabled
      if (options?.setDepartment && context.departmentId && tableSchema.departmentId) {
        data.departmentId = context.departmentId
      }

      const [result] = await db.insert(tableSchema).values(data).returning()

      return result as T
    }
  )
}

/**
 * Update a record with RLS enforcement
 */
export async function dbUpdate<T = any>(
  table: keyof typeof schema,
  id: string,
  data: Record<string, any>,
  options?: {
    permission?: PermissionRequirement
    ownerColumn?: string
    allowAdmins?: boolean
  }
): Promise<T | null> {
  return withAuthQuery(
    {
      permission: options?.permission || {
        resource: table as string,
        action: 'update',
      },
    },
    async (context) => {
      const tableSchema = schema[table] as any
      const rlsWhere = buildRLSWhere(context, table, {
        ownerColumn: options?.ownerColumn,
        allowAdmins: options?.allowAdmins,
      })

      const conditions = [eq(tableSchema.id, id)]
      if (rlsWhere) {
        conditions.push(rlsWhere as any)
      }

      // Check if record exists and user has access
      const existing = await db
        .select()
        .from(tableSchema)
        .where(and(...conditions))
        .limit(1)

      if (existing.length === 0) {
        throw new UnauthorizedQueryError('Record not found or access denied')
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
 */
export async function dbDelete(
  table: keyof typeof schema,
  id: string,
  options?: {
    permission?: PermissionRequirement
    ownerColumn?: string
    allowAdmins?: boolean
    hardDelete?: boolean
  }
): Promise<boolean> {
  return withAuthQuery(
    {
      permission: options?.permission || {
        resource: table as string,
        action: 'delete',
      },
    },
    async (context) => {
      const tableSchema = schema[table] as any
      const rlsWhere = buildRLSWhere(context, table, {
        ownerColumn: options?.ownerColumn,
        allowAdmins: options?.allowAdmins,
      })

      const conditions = [eq(tableSchema.id, id)]
      if (rlsWhere) {
        conditions.push(rlsWhere as any)
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
          throw new Error(`Table ${table} does not support soft delete`)
        }
      }

      return true
    }
  )
}
