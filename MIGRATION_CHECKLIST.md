# Supabase to Neon Migration Checklist

## Pre-Migration Setup

- [ ] Install Neon package: `npm install @neondatabase/serverless`
- [ ] Get Neon database connection string from Neon dashboard
- [ ] Update `.env.local` with Neon connection string
- [ ] Keep Supabase connection string as `SUPABASE_DATABASE_URL` for migration

## Environment Variables

Add to `.env.local`:

```env
# Neon Database (new)
DATABASE_URL=postgresql://neondb_owner:npg_9uPVHRxFNEA2@ep-snowy-frost-a447gzcw-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require

# Supabase Database (for migration only)
SUPABASE_DATABASE_URL=postgresql://postgres.ljbjtsfaeobajawamnft:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
```

## Migration Steps

### Step 1: Test Neon Connection

```bash
npm run test:neon
```

- [ ] Connection test passes
- [ ] All schemas are accessible
- [ ] Can query database

### Step 2: Run Data Migration

```bash
npm run migrate:to-neon
```

- [ ] Migration completes without errors
- [ ] All tables copied successfully
- [ ] Row counts match between Supabase and Neon
- [ ] Review migration summary

### Step 3: Verify Data Integrity

```bash
# Regenerate schemas from Neon
npm run drizzle:generate-schemas

# Test database operations
npm run test:neon
```

- [ ] Schemas generated correctly
- [ ] All tables present in Neon
- [ ] Data looks correct

### Step 4: Update Application Code

- [x] Database client updated (`db/client.ts`)
- [x] Uses Neon HTTP driver
- [ ] Test all API routes
- [ ] Test authentication flow
- [ ] Test data queries
- [ ] Test CRUD operations

### Step 5: Test Application

- [ ] Login/logout works
- [ ] Data loads correctly
- [ ] Create operations work
- [ ] Update operations work
- [ ] Delete operations work
- [ ] Relationships work (joins, foreign keys)

### Step 6: Deploy to Production

- [ ] Update production environment variables
- [ ] Run migration on production database
- [ ] Test production deployment
- [ ] Monitor for errors

## Rollback Plan

If issues occur:

1. **Restore old client:**

   ```bash
   cp db/client-supabase-backup.ts db/client.ts
   ```

2. **Update DATABASE_URL** to Supabase connection

3. **Restart application**

## Post-Migration Cleanup

After successful migration:

- [ ] Remove `SUPABASE_DATABASE_URL` from `.env.local`
- [ ] Remove `db/client-supabase-backup.ts` (after confirming everything works)
- [ ] Update documentation
- [ ] Update team about the migration

## Notes

- All existing Drizzle queries work without changes
- Only the connection driver changed
- Schema files remain the same
- Neon supports all PostgreSQL features

## Support

If you encounter issues:

1. Check Neon dashboard for connection status
2. Verify connection string format
3. Check network/firewall settings
4. Review migration script output for errors







