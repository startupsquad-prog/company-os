#!/usr/bin/env node

/**
 * Script to create admin user with superadmin role
 * Usage: npm run create:admin-user
 * Or: npx tsx scripts/create-admin-user.ts
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Load environment variables from .env.local
dotenv.config({ path: path.join(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing required environment variables:')
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗')
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', serviceRoleKey ? '✓' : '✗')
  process.exit(1)
}

// Create Supabase admin client
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

const ADMIN_EMAIL = 'admin@startupsquad.in'
const ADMIN_PASSWORD = process.env.ADMIN_INITIAL_PASSWORD || 'Admin@StartupSquad2024!'
const ADMIN_FIRST_NAME = 'Admin'
const ADMIN_LAST_NAME = 'User'

async function getRoleId(roleName: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('roles')
    .select('id')
    .eq('name', roleName)
    .single()

  if (error || !data) {
    console.error(`❌ Error fetching role "${roleName}":`, error?.message)
    return null
  }

  return data.id
}

async function createAdminUser(): Promise<boolean> {
  try {
    console.log(`📝 Creating admin user: ${ADMIN_EMAIL}`)

    // Check if user already exists
    const { data: existingUsers } = await supabase.auth.admin.listUsers()
    const existingUser = existingUsers?.users.find(u => u.email === ADMIN_EMAIL)

    let userId: string

    if (existingUser) {
      console.log(`   ⚠️  User ${ADMIN_EMAIL} already exists, using existing user`)
      userId = existingUser.id
    } else {
      // Create auth user
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        email_confirm: true,
      })

      if (authError || !authUser.user) {
        console.error(`   ❌ Error creating auth user:`, authError?.message)
        if (authError) {
          console.error(`   Error details:`, JSON.stringify(authError, null, 2))
        }
        return false
      }

      userId = authUser.user.id
      console.log(`   ✓ Created auth user: ${ADMIN_EMAIL}`)
      console.log(`   📧 User ID: ${userId}`)
    }

    // Ensure profile exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id, email, first_name, last_name')
      .eq('user_id', userId)
      .single()

    let profileId: string

    if (existingProfile) {
      profileId = existingProfile.id
      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          email: ADMIN_EMAIL,
          first_name: ADMIN_FIRST_NAME,
          last_name: ADMIN_LAST_NAME,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profileId)

      if (updateError) {
        console.error(`   ⚠️  Error updating profile:`, updateError.message)
      } else {
        console.log(`   ✓ Updated existing profile`)
      }
    } else {
      // Create new profile
      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert({
          user_id: userId,
          email: ADMIN_EMAIL,
          first_name: ADMIN_FIRST_NAME,
          last_name: ADMIN_LAST_NAME,
        })
        .select('id')
        .single()

      if (createError || !newProfile) {
        console.error(`   ❌ Error creating profile:`, createError?.message)
        return false
      }

      profileId = newProfile.id
      console.log(`   ✓ Created profile`)
    }

    // Get superadmin role ID
    const superadminRoleId = await getRoleId('superadmin')
    if (!superadminRoleId) {
      console.error(`   ❌ Superadmin role not found`)
      return false
    }

    // Check if user has superadmin role binding
    const { data: existingBindings } = await supabase
      .from('user_role_bindings')
      .select('id, role_id')
      .eq('user_id', userId)
      .eq('role_id', superadminRoleId)

    if (existingBindings && existingBindings.length > 0) {
      console.log(`   ⚠️  Superadmin role binding already exists`)
    } else {
      // Create role binding
      const { error: bindingError } = await supabase
        .from('user_role_bindings')
        .insert({
          user_id: userId,
          role_id: superadminRoleId,
          created_by: userId,
        })

      if (bindingError) {
        console.error(`   ❌ Error creating role binding:`, bindingError.message)
        return false
      }

      console.log(`   ✓ Assigned superadmin role`)
    }

    // Verify permissions
    const { data: permissions } = await supabase.rpc('get_user_permissions', {
      p_user_id: userId,
    })

    console.log(`\n   📋 User Permissions:`, permissions || [])

    return true
  } catch (error) {
    console.error(`   ❌ Unexpected error:`, error)
    return false
  }
}

async function main() {
  console.log('🌱 Creating admin user with superadmin role...\n')

  const success = await createAdminUser()

  if (success) {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('✅ Admin user created successfully!')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
    console.log('📋 Login Credentials:')
    console.log(`   Email: ${ADMIN_EMAIL}`)
    console.log(`   Password: ${ADMIN_PASSWORD}`)
    console.log(`   Role: superadmin`)
    console.log('\n⚠️  Please change the password after first login!\n')
  } else {
    console.log('\n❌ Failed to create admin user\n')
    process.exit(1)
  }
}

main().catch(error => {
  console.error('💥 Fatal error:', error)
  process.exit(1)
})

