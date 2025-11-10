# Neon Database Migration Guide

## Overview

This project has been migrated from Supabase to Neon for better serverless performance and scalability.

## Migration Steps

### 1. Environment Variables

Update your `.env.local` file:

```env
# Neon Database URL (from Neon dashboard)
DATABASE_URL=postgresql://neondb_owner:npg_9uPVHRxFNEA2@ep-snowy-frost-a447gzcw-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require

# For migration only - your old Supabase connection
SUPABASE_DATABASE_URL=postgresql://postgres.ljbjtsfaeobajawamnft:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
```

### 2. Run Data Migration

```bash
npm run migrate:to-neon
```

This script will:

- Connect to both Supabase and Neon
- Copy all schemas (core, crm, ats, ops, import_ops, common_util, public)
- Copy all tables and data
- Show progress and summary

### 3. Verify Migration

After migration, verify the data:

```bash
# Test connection
npm run drizzle:introspect

# Regenerate schemas from Neon
npm run drizzle:generate-schemas
```

### 4. Update Code

The database client has been updated to use Neon HTTP driver:

**Before (Supabase):**

```ts
import { db, client } from '@/db/client'
// Used postgres-js driver
```

**After (Neon):**

```ts
import { db, sql } from '@/db/client'
// Uses neon-http driver
// 'client' is still available for backward compatibility
```

## Key Changes

### Database Client

- **Old:** `drizzle-orm/postgres-js` with `postgres` package
- **New:** `drizzle-orm/neon-http` with `@neondatabase/serverless`

### Connection String

- **Old:** Supabase pooler connection
- **New:** Neon connection string (supports both pooled and unpooled)

### Performance

- Neon HTTP driver is optimized for serverless environments
- Better connection pooling for Vercel/serverless functions
- Lower latency for HTTP-based queries

## Testing

After migration, test all database operations:

1. **Authentication:** Login/logout flow
2. **Data Queries:** All CRUD operations
3. **Relationships:** Joins and foreign keys
4. **Migrations:** Run any pending migrations

## Rollback Plan

If you need to rollback:

1. Restore `db/client-supabase-backup.ts` as `db/client.ts`
2. Update `DATABASE_URL` to Supabase connection
3. Restart the application

## Notes

- All existing Drizzle queries work without changes
- Schema files remain the same
- Only the connection driver changed
- Neon supports all PostgreSQL features used in this project

