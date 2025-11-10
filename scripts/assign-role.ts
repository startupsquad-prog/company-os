/**
 * Quick script to assign roles to Clerk users
 * Usage: 
 *   npx tsx scripts/assign-role.ts <email> <role-name>
 * 
 * Example:
 *   npx tsx scripts/assign-role.ts lakshay@startupsquad.in superadmin
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

async function assignRole(email: string, roleName: string) {
  try {
    console.log(`Assigning role "${roleName}" to ${email}...`)

    // Get the profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, user_id, email, first_name, last_name')
      .eq('email', email)
      .is('deleted_at', null)
      .single()

    if (profileError || !profile) {
      console.error(`Profile not found for ${email}`)
      process.exit(1)
    }

    console.log(`Found profile: ${profile.first_name} ${profile.last_name} (${profile.user_id})`)

    // Get the role
    const { data: role, error: roleError } = await supabase
      .from('roles')
      .select('id, name, description')
      .eq('name', roleName)
      .is('deleted_at', null)
      .single()

    if (roleError || !role) {
      console.error(`Role "${roleName}" not found`)
      console.log('Available roles:')
      const { data: allRoles } = await supabase
        .from('roles')
        .select('name')
        .is('deleted_at', null)
      allRoles?.forEach((r) => console.log(`  - ${r.name}`))
      process.exit(1)
    }

    console.log(`Found role: ${role.name} (${role.description})`)

    // Remove existing role bindings (optional - comment out if you want to keep multiple roles)
    // Uncomment the next block if you want to replace all roles with just this one
    /*
    const { error: deleteError } = await supabase
      .from('user_role_bindings')
      .delete()
      .eq('user_id', profile.user_id)

    if (deleteError) {
      console.error('Error removing existing roles:', deleteError)
    } else {
      console.log('Removed existing role bindings')
    }
    */

    // Add the role binding
    const { error: insertError } = await supabase
      .from('user_role_bindings')
      .insert({
        user_id: profile.user_id,
        role_id: role.id,
        created_by: profile.user_id,
      })
      .select()

    if (insertError) {
      if (insertError.code === '23505') {
        console.log(`User already has role "${roleName}"`)
      } else {
        console.error('Error assigning role:', insertError)
        process.exit(1)
      }
    } else {
      console.log(`✅ Successfully assigned role "${roleName}" to ${email}`)
    }

    // Show current roles
    const { data: currentRoles } = await supabase
      .from('user_role_bindings')
      .select('role:roles(name, description)')
      .eq('user_id', profile.user_id)

    console.log('\nCurrent roles:')
    currentRoles?.forEach((binding: any) => {
      console.log(`  - ${binding.role.name}: ${binding.role.description}`)
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    process.exit(1)
  }
}

// Get command line arguments
const email = process.argv[2]
const roleName = process.argv[3]

if (!email || !roleName) {
  console.log('Usage: npx tsx scripts/assign-role.ts <email> <role-name>')
  console.log('\nExample:')
  console.log('  npx tsx scripts/assign-role.ts lakshay@startupsquad.in superadmin')
  console.log('  npx tsx scripts/assign-role.ts admin@startupsquad.in executive')
  process.exit(1)
}

assignRole(email, roleName)


