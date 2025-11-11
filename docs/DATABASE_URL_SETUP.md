# DATABASE_URL Setup for Drizzle Introspection

## Current Status

✅ Database connection validated via Supabase MCP
✅ Found 65 tables across 4 schemas:
- `core`: 24 tables
- `crm`: 14 tables  
- `common_util`: 24 tables
- `hr`: 3 tables

## Required Action

Set `DATABASE_URL` in your `.env` file to the Supabase connection string.

### Your Supabase Project Details
- Project Reference: `ljbjtsfaeobajawamnft`
- Project URL: `https://ljbjtsfaeobajawamnft.supabase.co`

### Connection String Format

Add this to your `.env` file:

```env
# Supabase Direct Connection (recommended for drizzle-kit)
DATABASE_URL=postgresql://postgres:[YOUR_PASSWORD]@db.ljbjtsfaeobajawamnft.supabase.co:5432/postgres

# OR Supabase Pooler Connection (for production)
DATABASE_URL=postgresql://postgres.ljbjtsfaeobajawamnft:[YOUR_PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
```

### How to Get Your Password

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/ljbjtsfaeobajawamnft
2. Navigate to **Settings** → **Database**
3. Find the **Connection string** section
4. Copy the connection string and replace `[YOUR-PASSWORD]` with your actual database password
5. Or use the **Connection pooling** tab for the pooler connection string

### After Setting DATABASE_URL

Once `DATABASE_URL` is set correctly, run:

```bash
npm run db:introspect
```

This will generate schema files in `db/schema/` organized by domain.

