/**
 * Schema-Aware Supabase Query Helpers
 * 
 * This module provides type-safe, schema-aware helpers to prevent
 * "relation does not exist" errors when querying Supabase tables.
 * 
 * ALWAYS use these helpers instead of raw Supabase queries in API routes.
 */

import { getUnifiedClient } from './unified-client'

/**
 * Database schemas used in Company OS
 */
export const SCHEMAS = {
  CORE: 'core',
  CRM: 'crm',
  ATS: 'ats',
  OPS: 'ops',
  COMMON_UTIL: 'common_util',
  HR: 'hr',
  IMPORT_OPS: 'import_ops',
} as const

export type Schema = typeof SCHEMAS[keyof typeof SCHEMAS]

/**
 * Schema-aware query builder
 * Returns a Supabase query builder with schema pre-configured
 * 
 * @example
 * ```ts
 * const query = fromSchema(SCHEMAS.COMMON_UTIL, 'projects')
 * const { data } = await query.select('*').eq('status', 'active')
 * ```
 */
export function fromSchema(schema: Schema, table: string) {
  const supabase = getUnifiedClient()
  return (supabase as any).schema(schema).from(table)
}

/**
 * Schema-aware query builder for core schema
 */
export function fromCore(table: string) {
  return fromSchema(SCHEMAS.CORE, table)
}

/**
 * Schema-aware query builder for common_util schema
 */
export function fromCommonUtil(table: string) {
  return fromSchema(SCHEMAS.COMMON_UTIL, table)
}

/**
 * Schema-aware query builder for crm schema
 */
export function fromCrm(table: string) {
  return fromSchema(SCHEMAS.CRM, table)
}

/**
 * Schema-aware query builder for ops schema
 */
export function fromOps(table: string) {
  return fromSchema(SCHEMAS.OPS, table)
}

/**
 * Schema-aware query builder for ats schema
 */
export function fromAts(table: string) {
  return fromSchema(SCHEMAS.ATS, table)
}

/**
 * Schema-aware query builder for hr schema
 */
export function fromHr(table: string) {
  return fromSchema(SCHEMAS.HR, table)
}

/**
 * Schema-aware query builder for import_ops schema
 */
export function fromImportOps(table: string) {
  return fromSchema(SCHEMAS.IMPORT_OPS, table)
}

/**
 * Common table names by schema (for reference and autocomplete)
 */
export const TABLES = {
  [SCHEMAS.CORE]: {
    profiles: 'profiles',
    departments: 'departments',
    companies: 'companies',
    contacts: 'contacts',
    roles: 'roles',
    permissions: 'permissions',
    employees: 'employees',
    teams: 'teams',
    enum_registry: 'enum_registry',
  },
  [SCHEMAS.COMMON_UTIL]: {
    tasks: 'tasks',
    projects: 'projects',
    project_members: 'project_members',
    project_status_history: 'project_status_history',
    task_assignees: 'task_assignees',
    task_status_history: 'task_status_history',
    sops: 'sops',
    files: 'files',
    subscriptions: 'subscriptions',
    message_threads: 'message_threads',
    events: 'events',
    knowledge_articles: 'knowledge_articles',
    tickets: 'tickets',
    documents: 'documents',
  },
  [SCHEMAS.CRM]: {
    leads: 'leads',
    opportunities: 'opportunities',
    interactions: 'interactions',
    pipelines: 'pipelines',
    stages: 'stages',
    products: 'products',
    quotations: 'quotations',
    calls: 'calls',
  },
  [SCHEMAS.OPS]: {
    orders: 'orders',
    order_items: 'order_items',
    quotations: 'quotations',
    shipments: 'shipments',
    payments: 'payments',
  },
  [SCHEMAS.ATS]: {
    applications: 'applications',
    candidates: 'candidates',
    interviews: 'interviews',
  },
  [SCHEMAS.HR]: {
    attendance_sessions: 'attendance_sessions',
    leave_requests: 'leave_requests',
  },
  [SCHEMAS.IMPORT_OPS]: {
    inquiries: 'inquiries',
    suppliers: 'suppliers',
    rfqs: 'rfqs',
  },
} as const

/**
 * Type-safe table name getter
 * 
 * @example
 * ```ts
 * const table = getTable(SCHEMAS.COMMON_UTIL, 'projects')
 * // TypeScript will error if 'projects' doesn't exist in common_util
 * ```
 */
export function getTable<T extends Schema>(
  schema: T,
  table: keyof typeof TABLES[T]
): string {
  return TABLES[schema][table] as string
}

