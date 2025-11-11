import { createServerClient as createSupabaseServerClient } from '@supabase/ssr'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { Database } from '@/lib/types/supabase'
import { getClerkUserId } from '@/lib/auth/clerk'

/**
 * Create a Supabase server client for data access (no auth)
 * This client is used for database queries only - authentication is handled by Clerk
 */
export async function createServerClient() {
  const cookieStore = await cookies()

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables')
  }

  const client = createSupabaseServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
    },
  })

  // Set Clerk user ID in session for RLS policies
  // This allows RLS to identify the current user
  try {
    const userId = await getClerkUserId()
    if (userId) {
      // Set the user ID in the session using RPC call
      // This makes it available to get_clerk_user_id() function in RLS policies
      await (client as any).rpc('set_clerk_user_id', { p_user_id: userId })
    }
  } catch (error) {
    // If setting user ID fails, log but don't throw
    // RLS will still work, just won't have user context
    console.warn('Failed to set Clerk user ID in Supabase session:', error)
  }

  return client
}

/**
 * Create a Supabase client with service role key
 * This bypasses RLS and can access all schemas (including crm, ops, etc.)
 * Use with caution - only for server-side operations where you need schema access
 */
export function createServiceRoleClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase environment variables for service role client')
  }

  return createSupabaseClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
