#!/usr/bin/env node

/**
 * Smoke test script for authentication and RBAC
 * Usage: npm run test:auth
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing required environment variables')
  process.exit(1)
}

interface TestUser {
  email: string
  password: string
  roleName: string
  expectedModules: string[]
}

const testUsers: TestUser[] = [
  {
    email: 'employee@acme.test',
    password: 'Passw0rd!',
    roleName: 'viewer',
    expectedModules: ['common_util'],
  },
  {
    email: 'manager@acme.test',
    password: 'Passw0rd!',
    roleName: 'manager',
    expectedModules: ['common_util', 'ops'],
  },
  {
    email: 'admin@acme.test',
    password: 'Passw0rd!',
    roleName: 'admin',
    expectedModules: ['common_util', 'crm', 'ats', 'ops', 'import_ops'],
  },
  {
    email: 'superadmin@acme.test',
    password: 'Passw0rd!',
    roleName: 'superadmin',
    expectedModules: ['common_util', 'crm', 'ats', 'ops', 'import_ops'],
  },
]

async function testUser(user: TestUser): Promise<{ success: boolean; errors: string[] }> {
  const errors: string[] = []
  const supabase = createClient(supabaseUrl, supabaseAnonKey)

  console.log(`\n🧪 Testing: ${user.email} (${user.roleName})`)

  // 1. Sign in
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: user.password,
  })

  if (authError || !authData.user) {
    errors.push(`Sign in failed: ${authError?.message || 'Unknown error'}`)
    return { success: false, errors }
  }

  console.log('   ✓ Signed in successfully')

  // 2. Get user roles
  const { data: roles, error: rolesError } = await supabase.rpc('get_user_roles', {
    p_user_id: authData.user.id,
  })

  if (rolesError) {
    errors.push(`Failed to get roles: ${rolesError.message}`)
  } else {
    const roleNames = (roles || []).map((r: any) => r.role_name)
    if (!roleNames.includes(user.roleName)) {
      errors.push(`Expected role "${user.roleName}" not found. Got: ${roleNames.join(', ')}`)
    } else {
      console.log(`   ✓ Roles: ${roleNames.join(', ')}`)
    }
  }

  // 3. Get allowed modules
  const { data: modules, error: modulesError } = await supabase.rpc('get_allowed_modules', {
    p_user_id: authData.user.id,
  })

  if (modulesError) {
    errors.push(`Failed to get modules: ${modulesError.message}`)
  } else {
    const moduleArray = modules || []
    const missingModules = user.expectedModules.filter(m => !moduleArray.includes(m))
    const extraModules = moduleArray.filter((m: string) => !user.expectedModules.includes(m))

    if (missingModules.length > 0) {
      errors.push(`Missing expected modules: ${missingModules.join(', ')}`)
    }
    if (extraModules.length > 0) {
      errors.push(`Unexpected modules: ${extraModules.join(', ')}`)
    }

    if (errors.length === 0) {
      console.log(`   ✓ Modules: ${moduleArray.join(', ')}`)
    }
  }

  // 4. Get permissions
  const { data: permissions, error: permissionsError } = await supabase.rpc('get_user_permissions', {
    p_user_id: authData.user.id,
    p_module_name: null,
  })

  if (permissionsError) {
    errors.push(`Failed to get permissions: ${permissionsError.message}`)
  } else {
    const permArray = permissions || []
    console.log(`   ✓ Permissions: ${permArray.join(', ')}`)
  }

  // 5. Test RLS - try to fetch tasks
  const { data: tasks, error: tasksError } = await supabase
    .from('tasks')
    .select('id, title')
    .limit(5)

  if (tasksError) {
    errors.push(`Failed to fetch tasks (RLS test): ${tasksError.message}`)
  } else {
    console.log(`   ✓ RLS: Can access tasks (${tasks?.length || 0} visible)`)
  }

  // Sign out
  await supabase.auth.signOut()

  return {
    success: errors.length === 0,
    errors,
  }
}

async function main() {
  console.log('🚀 Starting authentication smoke tests...\n')

  let totalTests = 0
  let passedTests = 0
  let failedTests = 0
  const allErrors: Array<{ user: string; errors: string[] }> = []

  for (const user of testUsers) {
    totalTests++
    const result = await testUser(user)

    if (result.success) {
      passedTests++
      console.log(`   ✅ All tests passed`)
    } else {
      failedTests++
      console.log(`   ❌ Tests failed:`)
      result.errors.forEach(err => console.log(`      - ${err}`))
      allErrors.push({ user: user.email, errors: result.errors })
    }
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(`📊 Test Results:`)
  console.log(`   Total: ${totalTests}`)
  console.log(`   ✅ Passed: ${passedTests}`)
  console.log(`   ❌ Failed: ${failedTests}`)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

  if (failedTests > 0) {
    console.log('❌ Some tests failed. Details:')
    allErrors.forEach(({ user, errors }) => {
      console.log(`\n   ${user}:`)
      errors.forEach(err => console.log(`     - ${err}`))
    })
    process.exit(1)
  }

  console.log('✨ All tests passed!')
}

main().catch(error => {
  console.error('💥 Fatal error:', error)
  process.exit(1)
})

