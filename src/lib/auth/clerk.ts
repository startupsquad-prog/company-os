import { auth, currentUser } from '@clerk/nextjs/server'
import { createServerClient } from '@/lib/supabase/server'

/**
 * Get the current Clerk user ID (server-side)
 * Returns null if not authenticated
 */
export async function getClerkUserId(): Promise<string | null> {
  const { userId } = await auth()
  return userId
}

/**
 * Get the current Clerk user object (server-side)
 * Returns null if not authenticated
 */
export async function getClerkUser() {
  const user = await currentUser()
  return user
}

/**
 * Require authentication in API routes
 * Throws error if not authenticated
 */
export async function requireAuth(): Promise<string> {
  const userId = await getClerkUserId()
  if (!userId) {
    throw new Error('Unauthorized')
  }
  return userId
}

/**
 * Get the current user's profile ID from core.profiles
 * Returns null if profile doesn't exist
 */
export async function getCurrentProfileId(): Promise<string | null> {
  const userId = await getClerkUserId()
  if (!userId) {
    return null
  }

  const supabase = await createServerClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('user_id', userId)
    .single()

  return profile?.id || null
}

/**
 * Ensure a profile exists for the current Clerk user
 * Creates profile if it doesn't exist
 * Uses the ensure_profile RPC function which handles role assignment
 */
export async function ensureProfile() {
  const user = await getClerkUser()
  if (!user) {
    throw new Error('Unauthorized')
  }

  const supabase = await createServerClient()

  // Use the RPC function to ensure profile exists
  const email = user.emailAddresses[0]?.emailAddress || ''

  const { data: profile, error } = await supabase.rpc('ensure_profile', {
    p_user_id: user.id,
    p_email: email,
  })

  if (error) {
    console.error('Error ensuring profile:', error)
    throw new Error('Failed to ensure profile')
  }

  return profile
}
