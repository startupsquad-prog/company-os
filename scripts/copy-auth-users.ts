/**
 * Copy Auth Users to Neon
 *
 * Copies auth.users from Supabase to Neon first, so profiles can reference them.
 */

import postgres from 'postgres'
import * as dotenv from 'dotenv'
import { resolve } from 'path'

dotenv.config({ path: resolve(process.cwd(), '.env.local') })
dotenv.config({ path: resolve(process.cwd(), '.env') })

const SUPABASE_DATABASE_URL = process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL
const NEON_DATABASE_URL = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL

if (!SUPABASE_DATABASE_URL || !NEON_DATABASE_URL) {
  throw new Error('Database URLs not set')
}

async function main() {
  console.log('👤 Copying auth.users from Supabase to Neon...\n')

  const sourceClient = postgres(SUPABASE_DATABASE_URL, { max: 1, prepare: false })
  const destClient = postgres(NEON_DATABASE_URL, { max: 1, prepare: true })

  try {
    await sourceClient`SELECT 1`
    await destClient`SELECT 1`
    console.log('✅ Both connections successful\n')

    // Ensure auth schema exists
    await destClient.unsafe('CREATE SCHEMA IF NOT EXISTS auth')

    // Create auth.users table if it doesn't exist
    await destClient.unsafe(`
      CREATE TABLE IF NOT EXISTS auth.users (
        id UUID PRIMARY KEY,
        email TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `)

    // Get users from Supabase
    const users = await sourceClient.unsafe(`
      SELECT id, email, created_at 
      FROM auth.users
      ORDER BY created_at
    `)

    console.log(`Found ${users.length} users in Supabase\n`)

    let copied = 0
    for (const user of users) {
      try {
        await destClient.unsafe(
          `INSERT INTO auth.users (id, email, created_at) VALUES ($1, $2, $3) ON CONFLICT (id) DO NOTHING`,
          [user.id, user.email, user.created_at]
        )
        copied++
      } catch (error: any) {
        if (!error.message.includes('duplicate')) {
          console.log(`   ⚠️  Error copying user ${user.id}: ${error.message.substring(0, 80)}`)
        }
      }
    }

    console.log(`✅ Copied ${copied}/${users.length} users\n`)
    console.log('💡 Now you can run "npm run copy-data-ordered" again')
  } catch (error: any) {
    console.error('\n❌ Failed:', error.message)
    process.exit(1)
  } finally {
    await sourceClient.end()
    await destClient.end()
  }
}

main()





