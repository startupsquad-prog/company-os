'use server'

import { createServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type SignInResult = {
  success: boolean
  error?: string
}

/**
 * Server action to sign in with email and password
 */
export async function signInWithPassword(email: string, password: string): Promise<SignInResult> {
  try {
    // Use server client for auth (handles cookies properly)
    const supabase = await createServerClient()

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return {
        success: false,
        error: error.message || 'Invalid email or password',
      }
    }

    if (!data.user) {
      return {
        success: false,
        error: 'Authentication failed',
      }
    }

    // Ensure profile exists and assign default role if needed
    try {
      await supabase.rpc('ensure_profile', {
        p_user_id: data.user.id,
        p_email: email,
      })
    } catch (profileError) {
      // Log but don't fail login if profile creation fails
      console.error('Error ensuring profile:', profileError)
    }

    // Revalidate to refresh session
    revalidatePath('/dashboard')

    return {
      success: true,
    }
  } catch (error) {
    console.error('Sign in error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    }
  }
}
