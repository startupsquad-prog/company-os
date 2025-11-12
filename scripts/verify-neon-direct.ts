/**
 * Direct Neon Verification
 *
 * Directly queries Neon to verify tables and data exist.
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
  console.log('🔍 Direct Neon verification...\n')

  const sql = neon(DATABASE_URL)

  try {
    // Check schemas using tagged template
    const schemasResult = await sql`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
      ORDER BY schema_name
    `

    console.log('📦 Schemas found:')
    const schemas = Array.isArray(schemasResult) ? schemasResult : [schemasResult]
    for (const row of schemas) {
      const schemaName = (row as any).schema_name
      console.log(`   - ${schemaName}`)
    }

    // Check core.profiles directly
    console.log('\n📊 Checking core.profiles...')
    try {
      const profiles = await sql`SELECT COUNT(*) as count FROM core.profiles`
      const count = Array.isArray(profiles) ? profiles[0] : profiles
      console.log(`   ✅ Profiles: ${(count as any)?.count || 0} rows`)

      if ((count as any)?.count > 0) {
        const sample = await sql`SELECT id, email FROM core.profiles LIMIT 1`
        const sampleRow = Array.isArray(sample) ? sample[0] : sample
        console.log(`   ✅ Sample: ${(sampleRow as any)?.email || (sampleRow as any)?.id}`)
      }
    } catch (e: any) {
      console.log(`   ❌ Error: ${e.message}`)
    }

    // Check core.contacts
    console.log('\n📊 Checking core.contacts...')
    try {
      const contacts = await sql`SELECT COUNT(*) as count FROM core.contacts`
      const count = Array.isArray(contacts) ? contacts[0] : contacts
      console.log(`   ✅ Contacts: ${(count as any)?.count || 0} rows`)
    } catch (e: any) {
      console.log(`   ❌ Error: ${e.message}`)
    }

    // Check crm.leads
    console.log('\n📊 Checking crm.leads...')
    try {
      const leads = await sql`SELECT COUNT(*) as count FROM crm.leads`
      const count = Array.isArray(leads) ? leads[0] : leads
      console.log(`   ✅ Leads: ${(count as any)?.count || 0} rows`)
    } catch (e: any) {
      console.log(`   ❌ Error: ${e.message}`)
    }

    // Check common_util.tasks
    console.log('\n📊 Checking common_util.tasks...')
    try {
      const tasks = await sql`SELECT COUNT(*) as count FROM common_util.tasks`
      const count = Array.isArray(tasks) ? tasks[0] : tasks
      console.log(`   ✅ Tasks: ${(count as any)?.count || 0} rows`)
    } catch (e: any) {
      console.log(`   ❌ Error: ${e.message}`)
    }

    // List all tables in core schema
    console.log('\n📋 Tables in core schema:')
    try {
      const tables = await sql`
        SELECT table_name 
        FROM information_schema.tables
        WHERE table_schema = 'core'
          AND table_type = 'BASE TABLE'
        ORDER BY table_name
      `
      const tableList = Array.isArray(tables) ? tables : [tables]
      for (const table of tableList) {
        console.log(`   - ${(table as any).table_name}`)
      }
    } catch (e: any) {
      console.log(`   ❌ Error: ${e.message}`)
    }

    console.log('\n✅ Verification complete!')
  } catch (error: any) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

verify()







