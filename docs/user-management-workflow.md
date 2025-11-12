# User Management Workflow

## Overview
User management in Company OS is **Clerk-first**. All user creation must happen through Clerk, and profiles are created automatically when users sign up.

## Current State
- **2 Real Users** (from Clerk):
  - `lakshay@startupsquad.in` → superadmin
  - `admin@startupsquad.in` → superadmin, executive, viewer

## User Creation Process

### ✅ CORRECT Workflow (Future)
1. **User signs up via Clerk** (or admin creates user in Clerk dashboard)
2. **Profile is auto-created** via trigger or RPC function when user first logs in
3. **Roles are assigned** via User Management page (`/users`)

### ❌ DO NOT
- Create profiles directly in Supabase
- Create users via API without Clerk
- Manually insert into `core.profiles` table

## Database Schema

### `core.profiles`
- `id` (UUID) - Primary key
- `user_id` (TEXT) - **Clerk user ID** (not Supabase auth UUID)
- `email` (TEXT) - User email (should match Clerk)
- `first_name`, `last_name` (TEXT) - User name
- `department_id` (UUID) - Optional department link
- `deleted_at` (TIMESTAMPTZ) - Soft delete timestamp

### `core.user_role_bindings`
- `user_id` (TEXT) - **Clerk user ID** (matches `profiles.user_id`)
- `role_id` (UUID) - References `core.roles.id`
- Many-to-many: One user can have multiple roles

## Role Assignment

Roles are assigned via the User Management page:
1. Navigate to `/users`
2. Click "Edit" on a user
3. Check/uncheck roles
4. Save

Roles are stored in `core.user_role_bindings` table.

## Cleanup Rules

- **Test users** (e.g., `@acme.test` domain) should be soft-deleted
- **Orphaned role bindings** (user_id not in profiles) are automatically cleaned
- **Only real Clerk users** should have active profiles

## Future: Auto-Profile Creation

When implementing auto-profile creation on Clerk signup:
1. Use Clerk webhook: `user.created`
2. Call RPC: `core.ensure_profile(p_user_id, p_email)`
3. Assign default role if needed








