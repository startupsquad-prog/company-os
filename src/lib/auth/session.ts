import { auth, currentUser } from '@clerk/nextjs/server'
import { createServerClient } from '@/lib/supabase/server'

/**
 * Get the current Clerk session/auth state server-side
 * Returns the auth object with userId, sessionId, etc.
 */
export async function getSession() {
  const authObj = await auth()
  return authObj
}

/**
 * Get the current authenticated Clerk user server-side
 */
export async function getUser() {
  const user = await currentUser()
  return user
}

/**
 * Get the user's profile from core.profiles using Clerk user ID
 */
export async function getProfile() {
  const userId = await getClerkUserId()
  if (!userId) return null

  const supabase = await createServerClient()
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error || !profile) return null
  return profile
}

/**
 * Get the current Clerk user ID (server-side)
 * Helper function for convenience
 */
async function getClerkUserId(): Promise<string | null> {
  const { userId } = await auth()
  return userId
}
