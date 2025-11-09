import { createServerClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

/**
 * Get the current Supabase session server-side
 */
export async function getSession() {
  const supabase = await createServerClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()
  return session
}

/**
 * Get the current authenticated user server-side
 */
export async function getUser() {
  const session = await getSession()
  return session?.user ?? null
}

/**
 * Get the user's profile from core.profiles
 */
export async function getProfile() {
  const user = await getUser()
  if (!user) return null

  const supabase = await createServerClient()
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (error || !profile) return null
  return profile
}

