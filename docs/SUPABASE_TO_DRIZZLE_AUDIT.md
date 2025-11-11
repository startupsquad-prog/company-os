# Supabase to Drizzle Migration Audit Report

**Date:** 2024-12-19  
**Status:** ❌ INCOMPLETE - Supabase still used for CRUD operations

## Executive Summary

The codebase is **NOT fully migrated** to Neon + Drizzle ORM. While the database connection (`db/client.ts`) is correctly configured to use Neon via Drizzle, **most CRUD operations still use Supabase client**.

### Current State

✅ **Correctly Configured:**

- `db/client.ts` - Uses Neon HTTP driver with Drizzle ORM
- `drizzle.config.ts` - Correctly configured
- `db/queries/tasks.ts` - Authorized Drizzle queries exist (but not used)
- `db/queries/leads.ts` - Authorized Drizzle queries exist (but not used)

❌ **Still Using Supabase for CRUD:**

- `src/lib/db/leads.ts` - **100% Supabase** (all CRUD operations)
- `src/lib/db/tasks.ts` - **100% Supabase** (all CRUD operations)
- `src/lib/notifications/notifications.ts` - **100% Supabase** (all CRUD operations)
- Multiple API routes
- Multiple client components
- Multiple hooks

## Detailed File Analysis

### 1. Core Database Libraries (CRITICAL)

#### `src/lib/db/leads.ts`

- **Status:** ❌ 100% Supabase
- **Functions using Supabase:**
  - `getLeads()` - Uses `createServiceRoleClient()`
  - `getLeadById()` - Uses `createServiceRoleClient()`
  - `createLead()` - Uses `createServiceRoleClient()`
  - `updateLead()` - Uses `createServiceRoleClient()`
  - `deleteLead()` - Uses `createServiceRoleClient()`
  - `updateLeadStatus()` - Uses `createServiceRoleClient()`
  - `getLeadInteractions()` - Uses `createServiceRoleClient()`
  - `addInteraction()` - Uses `createServiceRoleClient()`
  - `getLeadStatusHistory()` - Uses `createServiceRoleClient()`

**Migration Required:** Replace all with Drizzle queries from `db/queries/leads.ts` or create new authorized queries.

#### `src/lib/db/tasks.ts`

- **Status:** ❌ 100% Supabase
- **Functions using Supabase:**
  - `getTasks()` - Uses `createServerClient()`
  - `getTaskById()` - Uses `createServerClient()`
  - `createTask()` - Uses `createServerClient()`
  - `updateTask()` - Uses `createServerClient()`
  - `addComment()` - Uses `createServerClient()`
  - `assignUser()` - Uses `createServerClient()`
  - `getOverdueTasksCount()` - Uses `createServerClient()`
  - `getOverdueTasks()` - Uses `createServerClient()`

**Migration Required:** Replace all with Drizzle queries from `db/queries/tasks.ts` or extend existing authorized queries.

#### `src/lib/notifications/notifications.ts`

- **Status:** ❌ 100% Supabase
- **Functions using Supabase:**
  - `createNotification()` - Uses `createServerClient()`
  - `createNotificationsForUsers()` - Uses `createServerClient()`
  - `getUserNotifications()` - Uses `createServerClient()`
  - `markAsRead()` - Uses `createServerClient()`
  - `markAllAsRead()` - Uses `createServerClient()`
  - `getUnreadCount()` - Uses `createServerClient()`
  - `deleteNotification()` - Uses `createServerClient()`
  - `getNotificationPreferences()` - Uses `createServerClient()`
  - `updateNotificationPreference()` - Uses `createServerClient()`
  - `isNotificationEnabled()` - Uses `createServerClient()`

**Migration Required:** Create new Drizzle queries in `db/queries/notifications.ts`.

### 2. API Routes

#### Using Supabase for CRUD:

- `src/app/api/tasks/route.ts` - Uses `getTasks()` and `createTask()` from `@/lib/db/tasks` (Supabase)
- `src/app/api/crm/leads/route.ts` - Uses `getLeads()` and `createLead()` from `@/lib/db/leads` (Supabase)
- `src/app/api/notifications/route.ts` - Likely uses Supabase
- `src/app/api/notifications/[id]/route.ts` - Likely uses Supabase
- `src/app/api/notifications/count/route.ts` - Likely uses Supabase
- `src/app/api/notifications/read-all/route.ts` - Likely uses Supabase
- `src/app/api/notifications/preferences/route.ts` - Likely uses Supabase
- `src/app/api/functions/process-notification/route.ts` - Uses Supabase
- `src/app/api/functions/task-reminders/route.ts` - Uses Supabase
- `src/app/api/search/route.ts` - Uses Supabase
- `src/app/api/ai/chat/route.ts` - Uses Supabase
- `src/app/api/ai/agents/route.ts` - Uses Supabase

#### Already Using Drizzle:

- `src/app/api/tasks/overdue/route.ts` - ✅ Uses Drizzle
- `src/app/api/user/profile/route.ts` - ✅ Uses Drizzle
- `src/app/api/user/roles/route.ts` - ✅ Uses Drizzle
- `src/app/api/admin/users/route.ts` - ✅ Uses Drizzle (partially)
- `src/app/api/admin/users/create/route.ts` - ✅ Uses Drizzle
- `src/app/api/admin/users/[id]/route.ts` - ✅ Uses Drizzle (partially)

### 3. Client Components

#### Using Supabase for CRUD:

- `src/app/tasks/page.tsx` - Uses `createClient()` for multiple operations
- `src/app/tasks/components/task-details-modal.tsx` - Uses `createClient()` extensively
- `src/app/tasks/components/task-form.tsx` - Uses `createClient()`
- `src/app/tasks/components/task-kanban.tsx` - Uses `createClient()`
- `src/app/crm/leads/page.tsx` - Uses `createClient()`
- `src/app/crm/leads/components/lead-details-modal.tsx` - Uses `createClient()`
- `src/app/admin/users/components/add-user-dialog.tsx` - Uses `createClient()`
- `src/app/admin/users/components/edit-user-dialog.tsx` - Uses `createClient()`
- `src/components/overdue-tasks-badge.tsx` - Uses `createClient()`

### 4. Hooks

#### Using Supabase for CRUD:

- `src/lib/hooks/useNotifications.ts` - Uses `createClient()` extensively
- `src/lib/hooks/useNotificationCount.ts` - Uses `createClient()`
- `src/lib/hooks/useAgentChat.ts` - Uses `createClient()`

### 5. Notification Helpers

#### Using Supabase:

- `src/lib/notifications/notification-helpers.ts` - Uses Supabase for queries
- `src/lib/notifications/trigger-notification.ts` - May use Supabase

## Drizzle Version Check

**Current Version:** `drizzle-orm@0.44.7` (from package.json)  
**Latest Version:** Need to check (as of 2024-12-19)

**Action Required:** Update to latest version if newer available.

## Migration Strategy

### Phase 1: Core Database Libraries (HIGH PRIORITY)

1. ✅ Create `db/queries/notifications.ts` with authorized Drizzle queries
2. ✅ Migrate `src/lib/db/leads.ts` to use Drizzle
3. ✅ Migrate `src/lib/db/tasks.ts` to use Drizzle
4. ✅ Migrate `src/lib/notifications/notifications.ts` to use Drizzle

### Phase 2: API Routes

1. Update all API routes to use migrated library functions
2. Replace direct Supabase calls in API routes with Drizzle

### Phase 3: Client Components

1. Move all CRUD operations to API routes (recommended)
2. Or create server actions that use Drizzle
3. Remove Supabase client usage from client components

### Phase 4: Hooks

1. Update hooks to call API routes instead of direct Supabase calls
2. Or create server actions for hooks to use

### Phase 5: Verification

1. Remove all Supabase CRUD imports
2. Keep Supabase ONLY for:
   - Authentication (`supabase.auth.*`)
   - Storage (`supabase.storage.*`)
   - Realtime subscriptions (`supabase.realtime.*`)

## Supabase Usage That Should Remain

✅ **Keep Supabase for:**

- Authentication (`src/lib/supabase/client.ts`, `src/lib/supabase/server.ts`)
- Storage operations (if any)
- Realtime subscriptions (if any)

❌ **Remove Supabase from:**

- All database CRUD operations
- All `.from()`, `.select()`, `.insert()`, `.update()`, `.delete()` calls
- All query builders

## Next Steps

1. **Immediate:** Update Drizzle to latest version
2. **Priority 1:** Migrate core database libraries (`leads.ts`, `tasks.ts`, `notifications.ts`)
3. **Priority 2:** Update all API routes
4. **Priority 3:** Update client components and hooks
5. **Final:** Remove all Supabase CRUD code

## Files Requiring Migration

### Critical (Must Migrate First):

- `src/lib/db/leads.ts`
- `src/lib/db/tasks.ts`
- `src/lib/notifications/notifications.ts`

### High Priority:

- All API routes in `src/app/api/`
- All client components in `src/app/tasks/`
- All client components in `src/app/crm/`
- All hooks in `src/lib/hooks/`

### Medium Priority:

- Notification helpers
- Search functionality
- AI chat functionality

---

**Total Files Requiring Migration:** ~30+ files  
**Estimated Migration Time:** 2-3 days of focused work





