/**
 * Apply SQL File to Neon
 * 
 * Executes a complete SQL file to Neon, handling functions and complex statements.
 */

import { neon } from '@neondatabase/serverless'
import * as dotenv from 'dotenv'
import { resolve } from 'path'
import { readFileSync } from 'fs'

dotenv.config({ path: resolve(process.cwd(), '.env.local') })
dotenv.config({ path: resolve(process.cwd(), '.env') })

const DATABASE_URL = process.env.DATABASE_URL

if (!DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set')
}

/**
 * Execute SQL file to Neon
 */
export async function executeSqlFile(filePath: string): Promise<void> {
  const sql = neon(DATABASE_URL)
  const sqlContent = readFileSync(filePath, 'utf-8')
  
  // Remove single-line comments
  const cleaned = sqlContent.replace(/^--.*$/gm, '')
  
  // Execute as one block - Neon can handle multi-statement SQL
  try {
    await (sql as any).unsafe(cleaned)
  } catch (error: any) {
    // If that fails, try executing statement by statement more carefully
    console.log(`   ⚠️  Full file execution failed, trying statement by statement...`)
    
    // Use a simple approach: split by semicolon + newline, but preserve function bodies
    const statements: string[] = []
    let current = ''
    let inDollarQuote = false
    let dollarTag = ''
    
    for (let i = 0; i < cleaned.length; i++) {
      const char = cleaned[i]
      const nextChar = cleaned[i + 1]
      
      // Check for dollar quote start/end
      if (char === '$' && nextChar === '$') {
        if (!inDollarQuote) {
          // Find the tag
          let tagEnd = i + 2
          while (tagEnd < cleaned.length && cleaned[tagEnd] !== '$') {
            tagEnd++
          }
          dollarTag = cleaned.substring(i + 2, tagEnd)
          inDollarQuote = true
          current += cleaned.substring(i, tagEnd + 2)
          i = tagEnd + 1
          continue
        } else {
          // Check if this is the closing tag
          const potentialTag = cleaned.substring(i + 2, i + 2 + dollarTag.length)
          if (potentialTag === dollarTag && cleaned[i + 2 + dollarTag.length] === '$') {
            current += cleaned.substring(i, i + 2 + dollarTag.length + 2)
            i = i + 2 + dollarTag.length + 1
            inDollarQuote = false
            dollarTag = ''
            continue
          }
        }
      }
      
      current += char
      
      // If we're not in a dollar quote and we see ;\n, it's a statement end
      if (!inDollarQuote && char === ';' && (nextChar === '\n' || nextChar === '\r')) {
        const stmt = current.trim()
        if (stmt.length > 0 && !stmt.startsWith('--')) {
          statements.push(stmt)
        }
        current = ''
      }
    }
    
    // Add remaining
    if (current.trim().length > 0) {
      statements.push(current.trim()))
    
    // Execute each statement
    for (const stmt of statements) {
      if (stmt.trim().length === 0) continue
      try {
        await (sql as any).unsafe(stmt)
      } catch (stmtError: any) {
        // Ignore expected errors
        if (!stmtError.message.includes('already exists') && 
            !stmtError.message.includes('duplicate') &&
            !stmtError.message.includes('does not exist')) {
          // Only log if it's not a common expected error
          if (!stmtError.message.includes('syntax error') && 
              !stmtError.message.includes('unterminated')) {
            console.log(`      ⚠️  ${stmtError.message.substring(0, 100)}`)
          }
        }
      }
    }
  }
}



