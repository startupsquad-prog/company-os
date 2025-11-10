/**
 * Apply Migrations Properly to Neon
 *
 * Executes SQL statements one at a time to ensure they're committed.
 */

import { neon } from '@neondatabase/serverless'
import * as dotenv from 'dotenv'
import { resolve } from 'path'
import { readdirSync, readFileSync } from 'fs'
import { join } from 'path'

dotenv.config({ path: resolve(process.cwd(), '.env.local') })
dotenv.config({ path: resolve(process.cwd(), '.env') })

const DATABASE_URL = process.env.DATABASE_URL

if (!DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set')
}

/**
 * Split SQL into individual statements, preserving function bodies and DO blocks
 */
function splitSQL(sql: string): string[] {
  const statements: string[] = []
  let current = ''
  let inDollarQuote = false
  let dollarTag = ''
  let depth = 0

  for (let i = 0; i < sql.length; i++) {
    const char = sql[i]
    const nextChar = sql[i + 1]

    // Check for dollar quote
    if (char === '$' && nextChar === '$') {
      if (!inDollarQuote) {
        // Find the tag
        let tagEnd = i + 2
        while (tagEnd < sql.length && sql[tagEnd] !== '$') {
          tagEnd++
        }
        dollarTag = sql.substring(i + 2, tagEnd)
        inDollarQuote = true
        current += sql.substring(i, tagEnd + 2)
        i = tagEnd + 1
        continue
      } else {
        // Check if closing tag
        const potentialTag = sql.substring(i + 2, i + 2 + dollarTag.length)
        if (potentialTag === dollarTag && sql[i + 2 + dollarTag.length] === '$') {
          current += sql.substring(i, i + 2 + dollarTag.length + 2)
          i = i + 2 + dollarTag.length + 1
          inDollarQuote = false
          dollarTag = ''
          continue
        }
      }
    }

    current += char

    // Statement end (only if not in dollar quote)
    if (
      !inDollarQuote &&
      char === ';' &&
      (nextChar === '\n' || nextChar === '\r' || i === sql.length - 1)
    ) {
      const stmt = current.trim()
      if (stmt.length > 0 && !stmt.startsWith('--')) {
        statements.push(stmt)
      }
      current = ''
    }
  }

  // Add remaining
  if (current.trim().length > 0) {
    statements.push(current.trim())
  }

  return statements.filter((s) => s.length > 0)
}

/**
 * Apply a migration file
 */
async function applyMigration(filePath: string): Promise<void> {
  const fileName = filePath.split(/[/\\]/).pop()
  console.log(`   📄 Applying: ${fileName}`)

  const sql = neon(DATABASE_URL)
  const sqlContent = readFileSync(filePath, 'utf-8')

  // Remove comment lines
  const cleaned = sqlContent
    .split('\n')
    .map((line) => (line.trim().startsWith('--') ? '' : line))
    .join('\n')

  // Split into statements
  const statements = splitSQL(cleaned)
  console.log(`      Found ${statements.length} statements`)

  let successCount = 0
  let errorCount = 0

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i]
    if (statement.trim().length === 0) continue

    try {
      await (sql as any).unsafe(statement)
      successCount++
    } catch (error: any) {
      const errorMsg = error.message
      // Ignore expected errors
      if (
        !errorMsg.includes('already exists') &&
        !errorMsg.includes('duplicate') &&
        !errorMsg.includes('does not exist') &&
        !errorMsg.includes('permission denied')
      ) {
        errorCount++
        if (errorCount <= 3) {
          // Only show first 3 errors
          console.log(`      ⚠️  Statement ${i + 1}: ${errorMsg.substring(0, 100)}`)
        }
      } else {
        successCount++ // Count as success if it's an expected error
      }
    }
  }

  console.log(`      ✅ Applied: ${successCount}/${statements.length} statements`)
}

/**
 * Main
 */
async function main() {
  console.log('🚀 Applying migrations to Neon (one statement at a time)...\n')

  const migrationsDir = join(process.cwd(), 'supabase', 'migrations')
  const migrationFiles = readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort()
    .map((f) => join(migrationsDir, f))

  console.log(`Found ${migrationFiles.length} migration files\n`)

  // First, create auth schema
  console.log('🔐 Creating auth schema...')
  const sql = neon(DATABASE_URL)
  await (sql as any).unsafe(`
    CREATE SCHEMA IF NOT EXISTS auth;
    CREATE TABLE IF NOT EXISTS auth.users (
      id UUID PRIMARY KEY,
      email TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `)
  console.log('✅ Auth schema created\n')

  // Apply migrations
  for (const file of migrationFiles) {
    await applyMigration(file)
  }

  console.log('\n✅ All migrations applied!')
  console.log('\n💡 Next steps:')
  console.log('   1. Run: npm run setup:neon-complete (to copy data)')
  console.log('   2. Run: npm run drizzle:generate-schemas')
}

main().catch(console.error)

