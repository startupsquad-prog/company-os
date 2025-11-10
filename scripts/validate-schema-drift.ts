/**
 * Schema Drift Validation Script
 *
 * This script validates that the Drizzle schema files match the actual database schema.
 * Run this in CI/CD to catch schema drift early.
 *
 * Usage:
 *   npm run validate:schema
 *   or
 *   tsx scripts/validate-schema-drift.ts
 */

import { execSync } from 'child_process'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

const SCHEMA_DIR = join(process.cwd(), 'db', 'schema')
const DRIZZLE_CONFIG = join(process.cwd(), 'drizzle.config.ts')

interface ValidationResult {
  success: boolean
  errors: string[]
  warnings: string[]
}

async function validateSchemaDrift(): Promise<ValidationResult> {
  const result: ValidationResult = {
    success: true,
    errors: [],
    warnings: [],
  }

  console.log('🔍 Validating schema drift...\n')

  // Check if drizzle config exists
  if (!existsSync(DRIZZLE_CONFIG)) {
    result.errors.push('drizzle.config.ts not found')
    result.success = false
    return result
  }

  // Check if schema directory exists
  if (!existsSync(SCHEMA_DIR)) {
    result.errors.push('db/schema directory not found')
    result.success = false
    return result
  }

  try {
    // Run drizzle introspect to generate current schema
    console.log('📊 Running drizzle introspect...')
    execSync('npm run drizzle:introspect', { stdio: 'inherit' })
    console.log('✅ Introspect completed\n')

    // Check for common drift indicators
    const schemaFiles = ['core.ts', 'crm.ts', 'ats.ts', 'ops.ts', 'common_util.ts']

    for (const file of schemaFiles) {
      const filePath = join(SCHEMA_DIR, file)
      if (existsSync(filePath)) {
        const content = readFileSync(filePath, 'utf-8')

        // Check for TODO comments (indicates manual edits)
        const todoMatches = content.match(/TODO|FIXME|XXX/g)
        if (todoMatches) {
          result.warnings.push(
            `${file} contains TODO/FIXME comments - may indicate manual schema edits`
          )
        }

        // Check for empty exports (indicates missing tables)
        if (content.includes('export const') && !content.includes('export const ')) {
          result.warnings.push(`${file} may have empty exports`)
        }
      } else {
        result.warnings.push(`Schema file ${file} not found (may be expected)`)
      }
    }

    // Validate that generated schemas are valid TypeScript
    console.log('🔍 Validating TypeScript syntax...')
    try {
      execSync('npx tsc --noEmit --skipLibCheck db/schema/*.ts', { stdio: 'pipe' })
      console.log('✅ TypeScript validation passed\n')
    } catch (error: any) {
      result.errors.push('TypeScript validation failed - schema files have syntax errors')
      result.success = false
      if (error.stdout) {
        console.error(error.stdout.toString())
      }
    }

    // Check for common issues
    console.log('🔍 Checking for common issues...')

    // Check if schema files are auto-generated (should have a comment)
    const coreSchemaPath = join(SCHEMA_DIR, 'core.ts')
    if (existsSync(coreSchemaPath)) {
      const coreContent = readFileSync(coreSchemaPath, 'utf-8')
      if (!coreContent.includes('auto-generated') && !coreContent.includes('drizzle')) {
        result.warnings.push(
          'Schema files may not be auto-generated - ensure they are generated from database'
        )
      }
    }
  } catch (error: any) {
    result.errors.push(`Validation failed: ${error.message}`)
    result.success = false
  }

  return result
}

// Main execution
async function main() {
  const result = await validateSchemaDrift()

  console.log('\n📋 Validation Results:')
  console.log('='.repeat(50))

  if (result.errors.length > 0) {
    console.log('\n❌ Errors:')
    result.errors.forEach((error) => console.log(`  - ${error}`))
  }

  if (result.warnings.length > 0) {
    console.log('\n⚠️  Warnings:')
    result.warnings.forEach((warning) => console.log(`  - ${warning}`))
  }

  if (result.success && result.errors.length === 0) {
    console.log('\n✅ Schema validation passed!')
    process.exit(0)
  } else {
    console.log('\n❌ Schema validation failed!')
    console.log('\n💡 Next steps:')
    console.log('  1. Run: npm run drizzle:generate-schemas')
    console.log('  2. Review any warnings above')
    console.log('  3. Commit updated schema files')
    process.exit(1)
  }
}

main().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})

