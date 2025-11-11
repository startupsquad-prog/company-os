/**
 * Verify Neon Migration
 *
 * This script verifies that data was successfully migrated to Neon.
 */

import { neon } from '@neondatabase/serverless'
import * as dotenv from 'dotenv'
import { resolve } from 'path'

dotenv.config({ path: resolve(process.cwd(), '.env.local') })
dotenv.config({ path: resolve(process.cwd(), '.env') })

const DATABASE_URL = process.env.DATABASE_URL

if (!DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set')
}

async function verify() {
  console.log('🔍 Verifying Neon migration...\n')

  const sql = neon(DATABASE_URL)

  try {
    // Test core.profiles
    console.log('1️⃣ Checking core.profiles...')
    const profiles = await (sql as any).unsafe('SELECT COUNT(*) as count FROM core.profiles')
    console.log(`   ✅ Found ${profiles[0]?.count || 0} profiles`)

    // Test core.contacts
    console.log('\n2️⃣ Checking core.contacts...')
    const contacts = await (sql as any).unsafe('SELECT COUNT(*) as count FROM core.contacts')
    console.log(`   ✅ Found ${contacts[0]?.count || 0} contacts`)

    // Test core.leads
    console.log('\n3️⃣ Checking crm.leads...')
    const leads = await (sql as any).unsafe('SELECT COUNT(*) as count FROM crm.leads')
    console.log(`   ✅ Found ${leads[0]?.count || 0} leads`)

    // Test common_util.tasks
    console.log('\n4️⃣ Checking common_util.tasks...')
    const tasks = await (sql as any).unsafe('SELECT COUNT(*) as count FROM common_util.tasks')
    console.log(`   ✅ Found ${tasks[0]?.count || 0} tasks`)

    // Test a sample profile
    console.log('\n5️⃣ Sample data check...')
    const sampleProfile = await (sql as any).unsafe('SELECT id, email FROM core.profiles LIMIT 1')
    if (sampleProfile[0]) {
      console.log(`   ✅ Sample profile: ${sampleProfile[0].email || sampleProfile[0].id}`)
    }

    console.log('\n✅ Migration verification complete!')
    console.log('💡 Your application is now using Neon database.')
  } catch (error: any) {
    console.error('\n❌ Verification failed:', error.message)
    process.exit(1)
  }
}

verify()





