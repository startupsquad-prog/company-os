# Clerk Production Setup Guide

## Issue
The application works fine in local development but throws client-side errors in production. This is typically related to Clerk authentication configuration.

## Root Cause
1. **Environment Variables Not Set in Vercel**: The `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` might not be configured in Vercel's production environment.
2. **Domain Configuration**: Test keys (`pk_test_...`) may need domain configuration in Clerk dashboard for production domains.
3. **ClerkProvider Initialization**: ClerkProvider might fail to initialize if the key is invalid or domain is not configured.

## Solution Steps

### 1. Set Environment Variables in Vercel

1. Go to your Vercel project: https://vercel.com/startup-squad/os
2. Navigate to **Settings** → **Environment Variables**
3. Add the following variables for **Production** environment:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` = `pk_test_...` (your Clerk publishable key)
   - `CLERK_SECRET_KEY` = `sk_test_...` (your Clerk secret key)
4. Make sure to select **Production** (and optionally Preview/Development) environments
5. Click **Save**
6. **Redeploy** your application

### 2. Configure Domains in Clerk Dashboard

1. Go to Clerk Dashboard: https://dashboard.clerk.com
2. Select your application
3. Navigate to **Domains** or **Settings** → **Domains**
4. Add your production domains:
   - `team.suprans.in`
   - `os.suprans.in`
   - `os-*.vercel.app` (for Vercel preview deployments)
5. Save the configuration

### 3. Verify Clerk Application Settings

1. In Clerk Dashboard, go to **Settings** → **API Keys**
2. Verify that you're using the correct keys:
   - **Publishable Key** (starts with `pk_test_...` or `pk_live_...`)
   - **Secret Key** (starts with `sk_test_...` or `sk_live_...`)
3. For production, consider switching to **Live Keys** instead of test keys

### 4. Check Clerk Provider Configuration

The application now always wraps with `ClerkProvider` to prevent `useUser()` errors. If the key is missing, it uses a placeholder key to prevent crashes.

## Current Implementation

### Layout (`src/app/layout.tsx`)
- Always wraps app with `ClerkProvider`
- Uses placeholder key if environment variable is missing (prevents crashes)
- Logs error if key is missing

### RoleProvider (`src/lib/roles/role-context.tsx`)
- Always calls `useUser()` hook (required by React hooks rules)
- Handles cases where Clerk user is not available gracefully

## Testing

After setting environment variables in Vercel:

1. **Redeploy** the application
2. Check browser console for any Clerk-related errors
3. Verify authentication works on production domain
4. Test login/logout functionality

## Troubleshooting

### Error: "useUser can only be used within <ClerkProvider />"
- **Cause**: ClerkProvider is not wrapping the app
- **Fix**: Ensure `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` is set in Vercel and redeploy

### Error: "Invalid publishable key"
- **Cause**: Key format is incorrect or domain not configured
- **Fix**: 
  1. Verify key in Vercel environment variables
  2. Add domain to Clerk dashboard
  3. Redeploy

### Authentication not working in production
- **Cause**: Domain not configured in Clerk
- **Fix**: Add production domain to Clerk dashboard → Domains section

## Production vs Development Keys

- **Test Keys** (`pk_test_...`, `sk_test_...`): For development and testing
- **Live Keys** (`pk_live_...`, `sk_live_...`): For production

For production, consider:
1. Creating a separate Clerk application for production
2. Using Live keys instead of test keys
3. Configuring proper domain restrictions

## Next Steps

1. ✅ Set environment variables in Vercel
2. ✅ Configure domains in Clerk dashboard
3. ✅ Redeploy application
4. ⚠️ Consider switching to Live keys for production
5. ⚠️ Set up proper domain restrictions in Clerk

