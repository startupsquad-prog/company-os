/**
 * Unified Supabase Client for Data Fetching
 * 
 * This module provides a simple, unified way to fetch data from Supabase
 * using the anon key directly for direct database access.
 * 
 * IMPORTANT: This uses the anon key. Ensure RLS policies are disabled
 * or configured to allow access for the operations you need.
 */

import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/lib/types/supabase'

/**
 * Get a Supabase client using the anon key
 * This provides direct access to Supabase using the anon key
 */
export function getUnifiedClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY')
  }

  return createSupabaseClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

/**
 * Generic fetch function for any table
 */
export async function fetchAll<T = any>(
  schema: string,
  table: string,
  options: {
    select?: string
    filters?: Record<string, any>
    orderBy?: string
    ascending?: boolean
    limit?: number
    offset?: number
  } = {}
): Promise<{ data: T[]; count: number | null }> {
  const supabase = getUnifiedClient()
  
  let query = (supabase as any)
    .schema(schema)
    .from(table)
    .select(options.select || '*', { count: 'exact' })
    .is('deleted_at', null)

  // Apply filters
  if (options.filters) {
    for (const [key, value] of Object.entries(options.filters)) {
      if (value === undefined || value === null) continue
      
      if (Array.isArray(value)) {
        query = query.in(key, value)
      } else if (typeof value === 'string' && value.includes('%')) {
        query = query.ilike(key, value)
      } else {
        query = query.eq(key, value)
      }
    }
  }

  // Apply ordering
  if (options.orderBy) {
    query = query.order(options.orderBy, { ascending: options.ascending ?? true })
  } else {
    query = query.order('created_at', { ascending: false })
  }

  // Apply pagination
  if (options.limit) {
    const from = options.offset || 0
    const to = from + options.limit - 1
    query = query.range(from, to)
  }

  const { data, error, count } = await query

  if (error) {
    throw new Error(`Failed to fetch ${schema}.${table}: ${error.message}`)
  }

  return { data: (data || []) as T[], count }
}

/**
 * Fetch a single record by ID
 */
export async function fetchById<T = any>(
  schema: string,
  table: string,
  id: string,
  select?: string
): Promise<T | null> {
  const supabase = getUnifiedClient()
  
  let query = (supabase as any)
    .schema(schema)
    .from(table)
    .select(select || '*')
    .eq('id', id)
    .is('deleted_at', null)
    .single()

  const { data, error } = await query

  if (error) {
    if (error.code === 'PGRST116') {
      return null // Not found
    }
    throw new Error(`Failed to fetch ${schema}.${table} by id: ${error.message}`)
  }

  return data as T
}

/**
 * Create a new record
 */
export async function createRecord<T = any>(
  schema: string,
  table: string,
  data: Record<string, any>
): Promise<T> {
  const supabase = getUnifiedClient()
  
  const { data: result, error } = await (supabase as any)
    .schema(schema)
    .from(table)
    .insert(data)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create ${schema}.${table}: ${error.message}`)
  }

  return result as T
}

/**
 * Update a record by ID
 */
export async function updateRecord<T = any>(
  schema: string,
  table: string,
  id: string,
  data: Record<string, any>
): Promise<T> {
  const supabase = getUnifiedClient()
  
  const { data: result, error } = await (supabase as any)
    .schema(schema)
    .from(table)
    .update(data)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to update ${schema}.${table}: ${error.message}`)
  }

  return result as T
}

/**
 * Delete a record (soft delete)
 */
export async function deleteRecord(
  schema: string,
  table: string,
  id: string
): Promise<void> {
  const supabase = getUnifiedClient()
  
  const { error } = await (supabase as any)
    .schema(schema)
    .from(table)
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)

  if (error) {
    throw new Error(`Failed to delete ${schema}.${table}: ${error.message}`)
  }
}

/**
 * Search across multiple columns
 */
export async function searchRecords<T = any>(
  schema: string,
  table: string,
  searchTerm: string,
  columns: string[],
  options: {
    select?: string
    filters?: Record<string, any>
    orderBy?: string
    limit?: number
    offset?: number
  } = {}
): Promise<{ data: T[]; count: number | null }> {
  const supabase = getUnifiedClient()
  
  let query = (supabase as any)
    .schema(schema)
    .from(table)
    .select(options.select || '*', { count: 'exact' })
    .is('deleted_at', null)

  // Build OR condition for search
  if (searchTerm && columns.length > 0) {
    const searchPattern = `%${searchTerm}%`
    const orConditions = columns.map(col => `${col}.ilike.${searchPattern}`).join(',')
    query = query.or(orConditions)
  }

  // Apply additional filters
  if (options.filters) {
    for (const [key, value] of Object.entries(options.filters)) {
      if (value === undefined || value === null) continue
      
      if (Array.isArray(value)) {
        query = query.in(key, value)
      } else {
        query = query.eq(key, value)
      }
    }
  }

  // Apply ordering
  if (options.orderBy) {
    query = query.order(options.orderBy, { ascending: false })
  } else {
    query = query.order('created_at', { ascending: false })
  }

  // Apply pagination
  if (options.limit) {
    const from = options.offset || 0
    const to = from + options.limit - 1
    query = query.range(from, to)
  }

  const { data, error, count } = await query

  if (error) {
    throw new Error(`Failed to search ${schema}.${table}: ${error.message}`)
  }

  return { data: (data || []) as T[], count }
}

