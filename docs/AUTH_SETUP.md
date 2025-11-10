# Authentication Setup Guide

This document explains how authentication, role-based access control (RBAC), and protected routes work in Company OS.

## Overview

Company OS uses Supabase Auth for authentication with email and password. The system is **invite-only** (sign-up is disabled). Users are created via the seed script or admin operations.

## Architecture

### Components

1. **Supabase Auth**: Handles user authentication (email/password)
2. **Core Profiles**: Extends auth users with additional profile data
3. **RBAC System**: Roles, permissions, and module access control
4. **Middleware**: Protects routes and handles redirects
5. **RoleContext**: React context for role/permission management

## Authentication Flow

### Sign In Process

1. User enters email and password on `/auth/login`
2. Server action `signInWithPassword` is called
3. Supabase Auth validates credentials
4. On success:
   - RPC `core.ensure_profile` is called to create/update profile
   - Default "viewer" role is assigned if user has no roles
   - User is redirected to `/dashboard`

### Profile Creation

The `core.ensure_profile` RPC function:

- Checks if a profile exists for the user
- Creates profile if missing (with email, first_name, last_name)
- Assigns default "viewer" role if user has no role bindings
- Returns the profile row

This ensures every authenticated user has a profile and at least one role.

## Role System

### Roles

The system includes these predefined roles:

- **viewer**: Read-only access to assigned modules
- **editor**: Can read, create, and update records
- **manager**: Can read, create, update, delete, and manage records
- **admin**: Full access to all modules except RBAC management
- **superadmin**: Full system access including RBAC management

### Module Access

Modules are inferred from role level:

- **viewer/editor** → `['common_util']` (Tasks only)
- **manager** → `['common_util', 'ops']` (Tasks + Operations)
- **admin** → `['common_util', 'crm', 'ats', 'ops', 'import_ops']` (All except system)
- **superadmin** → `['common_util', 'crm', 'ats', 'ops', 'import_ops']` (All)

### Permissions

Permissions are generic actions:

- `read`: Read/view access
- `create`: Create new records
- `update`: Update existing records
- `delete`: Delete records
- `manage`: Full management access
- `rbac_manage`: Manage roles, permissions, and user access

## RPC Functions

### `core.ensure_profile(p_user_id uuid, p_email text)`

Ensures a profile exists and assigns default role if needed.

**Usage:**

```sql
SELECT * FROM core.ensure_profile('user-uuid', 'user@example.com');
```

### `core.get_user_roles(p_user_id uuid)`

Returns JSON array of user's roles.

**Returns:**

```json
[
  {
    "role_id": "uuid",
    "role_name": "admin",
    "description": "Full access..."
  }
]
```

### `core.get_allowed_modules(p_user_id uuid)`

Returns JSON array of module names the user can access.

**Returns:**

```json
["common_util", "crm", "ats", "ops", "import_ops"]
```

### `core.get_user_permissions(p_user_id uuid, p_module_name text DEFAULT NULL)`

Returns JSON array of permission names for the user.

**Returns:**

```json
["read", "create", "update", "delete", "manage"]
```

## Middleware Protection

The middleware (`src/middleware.ts`) protects routes:

- **`/dashboard/*`**: Requires valid Supabase session
  - If no session → redirects to `/auth/login?redirect=/dashboard/...`
  - If session exists → allows access

- **`/auth/login`**: Redirects to `/dashboard` if already logged in

- **Public routes**: `/` and `/auth/login` are accessible without authentication

## RoleContext Usage

### In Components

```tsx
import { useRole } from '@/lib/roles/use-role'

function MyComponent() {
  const { activeRole, setActiveRole, roles, allowedModules, permissions, can, loading } = useRole()

  // Check permission
  if (can('create', 'crm')) {
    // Show create button
  }

  // Filter UI based on modules
  const showCRM = allowedModules.includes('crm')
}
```

### Permission Checks

```tsx
// Check if user has permission
const canCreate = can('create')

// Check if user has permission AND module access
const canCreateCRM = can('create', 'crm')
```

## Seeding Users

### Running the Seed Script

```bash
npm run seed:auth
```

This creates 4 test users:

1. **employee@acme.test** / `Passw0rd!` → viewer role
2. **manager@acme.test** / `Passw0rd!` → manager role
3. **admin@acme.test** / `Passw0rd!` → admin role
4. **superadmin@acme.test** / `Passw0rd!` → superadmin role

### Script Behavior

- **Idempotent**: Checks if users exist before creating
- **Profile Creation**: Automatically creates profiles via RPC
- **Role Assignment**: Assigns appropriate roles to each user
- **Error Handling**: Continues on errors and reports summary

## Testing Authentication

### Manual Testing

1. **Test Login**:
   - Navigate to `/auth/login`
   - Enter credentials (e.g., `admin@acme.test` / `Passw0rd!`)
   - Should redirect to `/dashboard`

2. **Test Protected Routes**:
   - Log out
   - Try to access `/dashboard/tasks`
   - Should redirect to `/auth/login`

3. **Test Role-Based UI**:
   - Log in as `employee@acme.test` (viewer)
   - Sidebar should only show Tasks (common_util)
   - Log in as `admin@acme.test`
   - Sidebar should show all modules

4. **Test Role Switcher**:
   - Log in as a user with multiple roles (if configured)
   - Click user menu → "Switch Role"
   - Select different role
   - Sidebar should update to show allowed modules

### Smoke Test Script

Run the optional smoke test:

```bash
npm run test:auth
```

This script:

- Signs in each seeded user
- Fetches dashboard data
- Verifies RLS filtering works correctly
- Prints test results

## Troubleshooting

### "Error ensuring profile"

- **Cause**: RPC function not accessible or RLS blocking
- **Fix**: Check RLS policies on `core.profiles` and `core.user_role_bindings`
- **Verify**: Ensure `core.ensure_profile` has `SECURITY DEFINER` and proper grants

### "Access denied: can only query own roles"

- **Cause**: User trying to query another user's roles
- **Fix**: RPC functions check `auth.uid()` - ensure user is authenticated

### Sidebar shows no modules

- **Cause**: User has no roles or `allowedModules` is empty
- **Fix**:
  1. Check user has role bindings: `SELECT * FROM core.user_role_bindings WHERE user_id = '...'`
  2. Verify RPC `get_allowed_modules` returns correct modules
  3. Check RoleContext is loading data correctly

### Middleware redirect loop

- **Cause**: Session not persisting or cookies not set
- **Fix**:
  1. Check Supabase client configuration
  2. Verify cookies are being set in browser
  3. Check middleware matcher config

### Role switcher not appearing

- **Cause**: User has only one role
- **Fix**: Assign multiple roles to user for testing:
  ```sql
  INSERT INTO core.user_role_bindings (user_id, role_id, created_by)
  VALUES ('user-uuid', 'role-uuid', 'user-uuid');
  ```

## Security Notes

### Service Role Key

- **Never** expose `SUPABASE_SERVICE_ROLE_KEY` in client code
- Only use in:
  - Seed scripts
  - RPC functions (SECURITY DEFINER)
  - Admin operations server-side

### RLS Policies

All tables have RLS enabled. Policies ensure:

- Users can only read their own profiles
- Users can only read their own role bindings
- Service role can perform admin operations

### Session Management

- Sessions are managed by Supabase Auth
- Cookies are set automatically via `@supabase/ssr`
- Middleware refreshes sessions on each request

## Future Enhancements

- [ ] Magic link authentication
- [ ] OTP authentication
- [ ] Social login (Google, GitHub)
- [ ] Two-factor authentication
- [ ] Explicit module assignments (beyond role inference)
- [ ] Department-based access control
- [ ] Custom role creation UI
