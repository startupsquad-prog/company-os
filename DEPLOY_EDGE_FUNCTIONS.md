# Deploy Edge Functions to Supabase

## Prerequisites

1. **Supabase CLI** - Already initialized in this project
2. **Project Reference** - Your Supabase project ref (found in project settings)
3. **Service Role Key** - Already set in Supabase Dashboard → Edge Functions → Secrets

## Step 1: Link to Your Supabase Project

Run this command and follow the prompts:

```bash
npx supabase link --project-ref YOUR_PROJECT_REF
```

**To find your project ref:**

- Go to Supabase Dashboard → Project Settings → General
- The "Reference ID" is your project ref (e.g., `abcdefghijklmnop`)

## Step 2: Deploy Edge Functions

Deploy both functions:

```bash
# Deploy process-notification function
npx supabase functions deploy process-notification

# Deploy task-reminders function
npx supabase functions deploy task-reminders
```

## Step 3: Verify Deployment

1. Go to Supabase Dashboard → Edge Functions
2. You should see:
   - `process-notification`
   - `task-reminders`

## Step 4: Set Secrets (Already Done)

The `SUPABASE_SERVICE_ROLE_KEY` secret should already be set in:

- Supabase Dashboard → Project Settings → Edge Functions → Secrets

If not, add it:

- Name: `SUPABASE_SERVICE_ROLE_KEY`
- Value: Your service role key from Project Settings → API

## Troubleshooting

### Functions not appearing in dashboard

- Make sure you've linked the project: `npx supabase link --project-ref YOUR_PROJECT_REF`
- Check you're logged in: `npx supabase login`

### Function errors

- Check Edge Function logs in Supabase Dashboard
- Verify `SUPABASE_SERVICE_ROLE_KEY` secret is set correctly
- Ensure database migrations are applied

## Quick Deploy Script

You can also run:

```bash
npx supabase functions deploy process-notification task-reminders
```





