import type { NextAuthConfig } from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { createServerClient } from '@/lib/supabase/server'
import { db, schema } from '@/db/client'
import { eq } from 'drizzle-orm'

/**
 * NextAuth v5 Configuration
 *
 * This configuration replaces Supabase Auth with NextAuth (Auth.js v5).
 *
 * NOTE: The authorize function currently validates against Supabase Auth's auth.users table
 * for password verification. This is temporary until passwords are migrated to a custom table.
 *
 * TODO: Migrate passwords to core.user_credentials table and use bcrypt for validation.
 */
export const authConfig = {
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  providers: [
    Credentials({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        try {
          // During migration: Validate against Supabase Auth
          // TODO: After migration, validate against NextAuth users table with bcrypt
          const supabase = await createServerClient()

          const { data, error } = await supabase.auth.signInWithPassword({
            email: credentials.email as string,
            password: credentials.password as string,
          })

          if (error || !data.user) {
            return null
          }

          // Get or create profile
          const profile = await db
            .select()
            .from(schema.profiles)
            .where(eq(schema.profiles.userId, data.user.id))
            .limit(1)

          let profileId: string
          if (profile.length === 0) {
            // Create profile if it doesn't exist
            const [newProfile] = await db
              .insert(schema.profiles)
              .values({
                userId: data.user.id,
                email: data.user.email || (credentials.email as string),
              })
              .returning()
            profileId = newProfile.id
          } else {
            profileId = profile[0].id
          }

          // Return user object for NextAuth session
          return {
            id: data.user.id,
            email: data.user.email || (credentials.email as string),
            name: data.user.user_metadata?.full_name || null,
            profileId,
          }
        } catch (error) {
          console.error('Authorization error:', error)
          return null
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // Type guard: Ensure user object has required fields
      if (user) {
        if (typeof user.id !== 'string') {
          throw new Error('Invalid user: id must be a string')
        }
        if (typeof (user as any).profileId !== 'string') {
          throw new Error('Invalid user: profileId must be a string')
        }

        token.id = user.id
        token.profileId = (user as any).profileId
        token.email = user.email || null
        token.name = user.name || null
      }

      // Type guard: Ensure token has required fields before returning
      if (!token.id || typeof token.id !== 'string') {
        throw new Error('Invalid token: id is required and must be a string')
      }
      if (!token.profileId || typeof token.profileId !== 'string') {
        throw new Error('Invalid token: profileId is required and must be a string')
      }

      return token
    },
    async session({ session, token }) {
      // Type guard: Ensure token has required fields
      if (!token.id || typeof token.id !== 'string') {
        throw new Error('Invalid session: token.id is required and must be a string')
      }
      if (!token.profileId || typeof token.profileId !== 'string') {
        throw new Error('Invalid session: token.profileId is required and must be a string')
      }

      // Type guard: Ensure session.user exists
      if (!session.user) {
        throw new Error('Invalid session: user object is required')
      }

      // Strongly typed session user
      session.user.id = token.id
      session.user.profileId = token.profileId

      // Preserve email and name if available
      if (token.email && typeof token.email === 'string') {
        session.user.email = token.email
      }
      if (token.name && typeof token.name === 'string') {
        session.user.name = token.name
      }

      return session
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
  },
} satisfies NextAuthConfig
