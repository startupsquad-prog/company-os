#!/usr/bin/env node

/**
 * Seed script to create test users with different roles
 * Usage: npm run seed:auth
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

interface UserSeed {
  email: string
  password: string
  roleName: string
  firstName: string
  lastName: string
}

const usersToSeed: UserSeed[] = [
  {
    email: 'employee@acme.test',
    password: 'Passw0rd!',
    roleName: 'viewer',
    firstName: 'Employee',
    lastName: 'User',
  },
  {
    email: 'manager@acme.test',
    password: 'Passw0rd!',
    roleName: 'manager',
    firstName: 'Manager',
    lastName: 'User',
  },
  {
    email: 'admin@acme.test',
    password: 'Passw0rd!',
    roleName: 'admin',
    firstName: 'Admin',
    lastName: 'User',
  },
  {
    email: 'superadmin@acme.test',
    password: 'Passw0rd!',
    roleName: 'superadmin',
    firstName: 'Super',
    lastName: 'Admin',
  },
]

async function getRoleId(roleName: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('roles')
    .select('id')
    .eq('name', roleName)
    .single()

  if (error || !data) {
    console.error(`❌ Error fetching role "${roleName}":`, error?.message)
    if (error) {
      console.error(`   Error details:`, JSON.stringify(error, null, 2))
    }
    return null
  }

  return data.id
}

async function seedUser(userSeed: UserSeed): Promise<boolean> {
  try {
    // Check if user already exists
    const { data: existingUsers } = await supabase.auth.admin.listUsers()
    const existingUser = existingUsers?.users.find(u => u.email === userSeed.email)

    let userId: string

    if (existingUser) {
      console.log(`   ⚠️  User ${userSeed.email} already exists, skipping creation`)
      userId = existingUser.id
    } else {
      // Create auth user
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email: userSeed.email,
        password: userSeed.password,
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
      console.log(`   ✓ Created auth user: ${userSeed.email}`)
    }

    // Ensure profile exists - check first, then create or update
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id, email, first_name, last_name')
      .eq('user_id', userId)
      .single()

    let profileId: string

    if (existingProfile) {
      profileId = existingProfile.id
      // Update profile if needed
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          email: userSeed.email,
          first_name: userSeed.firstName,
          last_name: userSeed.lastName,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profileId)

      if (updateError) {
        console.error(`   ⚠️  Error updating profile:`, updateError.message)
        console.error(`   Error details:`, JSON.stringify(updateError, null, 2))
      } else {
        console.log(`   ✓ Updated existing profile`)
      }
    } else {
      // Create new profile
      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert({
          user_id: userId,
          email: userSeed.email,
          first_name: userSeed.firstName,
          last_name: userSeed.lastName,
        })
        .select('id')
        .single()

      if (createError || !newProfile) {
        console.error(`   ❌ Error creating profile:`, createError?.message)
        if (createError) {
          console.error(`   Error details:`, JSON.stringify(createError, null, 2))
        }
        return false
      }

      profileId = newProfile.id
      console.log(`   ✓ Created profile`)
    }

    // Check if user has any role bindings
    const { data: existingBindings } = await supabase
      .from('user_role_bindings')
      .select('id, role_id')
      .eq('user_id', userId)

    // Get role ID for the desired role
    const roleId = await getRoleId(userSeed.roleName)
    if (!roleId) {
      return false
    }

    // Check if the desired role binding already exists
    const hasDesiredRole = existingBindings?.some(b => b.role_id === roleId) ?? false

    if (hasDesiredRole) {
      console.log(`   ⚠️  Role binding already exists for ${userSeed.roleName}`)
    } else {
      // Create role binding
      const { error: bindingError } = await supabase
        .from('user_role_bindings')
        .insert({
          user_id: userId,
          role_id: roleId,
          created_by: userId,
        })

      if (bindingError) {
        console.error(`   ❌ Error creating role binding:`, bindingError.message)
        console.error(`   Error details:`, JSON.stringify(bindingError, null, 2))
        return false
      }

      console.log(`   ✓ Assigned role: ${userSeed.roleName}`)
    }

    // If user has no role bindings at all, assign default viewer role (shouldn't happen, but safety check)
    if (!existingBindings || existingBindings.length === 0) {
      const viewerRoleId = await getRoleId('viewer')
      if (viewerRoleId && viewerRoleId !== roleId) {
        const { error: defaultBindingError } = await supabase
          .from('user_role_bindings')
          .insert({
            user_id: userId,
            role_id: viewerRoleId,
            created_by: userId,
          })

        if (!defaultBindingError) {
          console.log(`   ✓ Assigned default viewer role`)
        }
      }
    }

    return true
  } catch (error) {
    console.error(`   ❌ Unexpected error:`, error)
    return false
  }
}

async function main() {
  console.log('🌱 Starting user seeding...\n')

  let successCount = 0
  let failCount = 0

  for (const userSeed of usersToSeed) {
    console.log(`📝 Seeding user: ${userSeed.email} (${userSeed.roleName})`)
    const success = await seedUser(userSeed)
    if (success) {
      successCount++
      console.log(`   ✅ Completed\n`)
    } else {
      failCount++
      console.log(`   ❌ Failed\n`)
    }
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(`✅ Success: ${successCount}`)
  if (failCount > 0) {
    console.log(`❌ Failed: ${failCount}`)
  }
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

  if (failCount > 0) {
    process.exit(1)
  }

  console.log('✨ Seeding completed successfully!')
  console.log('\n📋 Test Users:')
  usersToSeed.forEach(user => {
    console.log(`   • ${user.email} / ${user.password} (${user.roleName})`)
  })
}

main().catch(error => {
  console.error('💥 Fatal error:', error)
  process.exit(1)
})

