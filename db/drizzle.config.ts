import 'dotenv/config'
import { defineConfig } from 'drizzle-kit'
import { resolve } from 'path'
import * as dotenv from 'dotenv'

// Load environment variables from .env.local (preferred) and .env
// Load .env.local first (higher priority)
dotenv.config({ path: resolve(process.cwd(), '.env.local'), override: false })
dotenv.config({ path: resolve(process.cwd(), '.env'), override: false })

export default defineConfig({
  dialect: 'postgresql',
  schema: './db/schema',
  out: './db/migrations',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  schemaFilter: ['core', 'crm', 'ats', 'ops', 'common_util', 'import_ops', 'hr', 'public'],
})

