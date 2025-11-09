# Auth Reference Analysis - CRM Project

## Overview
Analysis of authentication patterns from `C:\Development\CRM\crmfinal123-main` to inform Company OS auth implementation.

## Key Findings

### 1. **AuthContext Pattern** ✅
**Location:** `contexts/AuthContext.tsx`

**Pattern:**
- React Context for global auth state
- Provides `user`, `loading`, `signIn`, `signOut`, `hasPermission`
- Listens to Supabase auth state changes via `onAuthStateChange`
- Fetches user profile after authentication

**Key Functions:**
```typescript
- getCurrentUser(): Fetches user from Supabase auth + profile data
- signIn(email, password): Handles login flow
- signOut(): Clears auth state and local storage
- hasPermission(permission): Role-based permission check
```

**What We Can Use:**
- Context pattern for auth state management
- Auth state change listener
- Loading states during auth operations

**What We'll Improve:**
- ❌ Hardcoded role assignment (email-based admin check)
- ❌ Role determined by job title string matching
- ✅ We'll use proper RBAC with `core.roles`, `core.permissions`, `core.user_role_bindings`
- ✅ We'll link to `core.profiles` table instead of separate "Employee Directory"

---

### 2. **Login Form Component** ✅
**Location:** `components/auth/LoginForm.tsx`

**Pattern:**
- React Hook Form + Zod validation
- Password visibility toggle
- Role-based redirect after login
- Error handling with specific messages
- Loading states

**Features:**
- Email/password validation
- Toast notifications for errors/success
- Automatic redirect based on role (admin → `/dashboard`, hr → `/dashboard/attendance/hr`, employee → `/employee`)

**What We Can Use:**
- Form validation pattern
- User experience patterns (loading states, error messages)
- Redirect logic structure

**What We'll Improve:**
- Redirect logic will be more flexible (not hardcoded routes)
- Will integrate with our RBAC system

---

### 3. **Supabase Client Setup** ✅
**Location:** `lib/supabaseClient.ts`

**Pattern:**
```typescript
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "...";
const supabaseAnonKey = "...";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

**What We Can Use:**
- Simple client setup pattern
- **BUT:** We should use `@supabase/ssr` for Next.js 15 App Router (better server/client separation)

**What We'll Improve:**
- Use environment variables (not hardcoded)
- Use `@supabase/ssr` for proper Next.js 15 support
- Create separate clients for server and client components

---

### 4. **Middleware** ⚠️
**Location:** `middleware.ts`

**Pattern:**
- Minimal middleware - mostly allows all routes
- Checks for demo mode cookie
- Doesn't enforce authentication (relies on AuthContext)

**What We Can Use:**
- Basic structure for route protection
- Demo mode pattern (if needed)

**What We'll Improve:**
- ✅ Proper auth checks using Supabase SSR
- ✅ Redirect unauthenticated users to `/login`
- ✅ Role-based route protection
- ✅ Protect API routes

---

### 5. **Layout Integration** ✅
**Location:** `app/layout.tsx`

**Pattern:**
```typescript
<AuthProvider>
  <UserRoleProvider>
    {children}
  </UserRoleProvider>
</AuthProvider>
```

**What We Can Use:**
- Provider wrapping pattern
- Nested providers for different concerns

**What We'll Improve:**
- Single `AuthProvider` that handles both auth and roles (via RBAC)
- No separate `UserRoleProvider` needed

---

### 6. **Role Determination Logic** ❌ (Don't Use This)
**Location:** `contexts/AuthContext.tsx` (lines 99-109, 194-204)

**Current Pattern:**
```typescript
// Hardcoded admin check
if (email === 'lakshay@startupsquad.in' || email === 'sanjay@startupsquad.in') {
  role = 'admin';
}

// String matching for role
if (job_title?.toLowerCase().includes('hr')) {
  role = 'hr';
}
```

**Why This Is Bad:**
- Hardcoded emails
- Fragile string matching
- No proper RBAC
- Can't scale

**What We'll Do Instead:**
- Query `core.user_role_bindings` table
- Join with `core.roles` to get role names
- Use `core.permissions` for fine-grained access
- Support multiple roles per user
- Use `can()` helper function for permission checks

---

## Recommended Implementation for Company OS

### 1. **Supabase Client Setup**
```typescript
// lib/supabase/client.ts (for client components)
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// lib/supabase/server.ts (for server components)
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}
```

### 2. **AuthContext with RBAC**
```typescript
// contexts/AuthContext.tsx
interface User {
  id: string
  email: string
  profile: {
    id: string
    full_name: string
    department_id: string | null
  }
  roles: string[] // e.g., ['superadmin', 'manager']
  permissions: string[] // e.g., ['crm.leads.create', 'ops.orders.view']
}

interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ user: User | null; error: string | null }>
  signOut: () => Promise<void>
  can: (permission: string) => boolean
  hasRole: (role: string) => boolean
}
```

### 3. **Middleware for Route Protection**
```typescript
// middleware.ts
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Public routes
  if (request.nextUrl.pathname === '/login' || 
      request.nextUrl.pathname.startsWith('/_next') ||
      request.nextUrl.pathname.startsWith('/api/auth')) {
    return NextResponse.next()
  }

  // Protected routes - redirect to login if not authenticated
  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Role-based route protection (optional, can also be done in components)
  // e.g., /dashboard/admin requires 'superadmin' role

  return NextResponse.next()
}
```

### 4. **Permission Helper Function**
```typescript
// lib/rbac.ts
export function can(user: User | null, permission: string): boolean {
  if (!user) return false
  
  // Superadmin has all permissions
  if (user.roles.includes('superadmin')) return true
  
  // Check if user has the specific permission
  return user.permissions.includes(permission)
}

export function hasRole(user: User | null, role: string): boolean {
  if (!user) return false
  return user.roles.includes(role)
}
```

---

## Key Differences: Reference vs Company OS

| Aspect | Reference Project | Company OS |
|--------|------------------|------------|
| **Role System** | Hardcoded emails + string matching | Proper RBAC with `core.roles`, `core.permissions`, `core.user_role_bindings` |
| **User Profile** | Separate "Employee Directory" table | `core.profiles` linked to `auth.users` |
| **Permission Checks** | Simple role-based (`hasPermission`) | Fine-grained with `can(permission)` helper |
| **Supabase Client** | Basic `createClient` | `@supabase/ssr` for Next.js 15 |
| **Middleware** | Minimal, no auth enforcement | Proper auth checks + redirects |
| **Multiple Roles** | Single role per user | Multiple roles via `user_role_bindings` |

---

## Action Items for Company OS Auth Implementation

1. ✅ Set up Supabase SSR clients (server + browser)
2. ✅ Create `AuthContext` with RBAC integration
3. ✅ Build `LoginForm` component (reuse validation patterns)
4. ✅ Implement middleware for route protection
5. ✅ Create `can()` and `hasRole()` helper functions
6. ✅ Link auth to `core.profiles` table
7. ✅ Query `user_role_bindings` to get user roles
8. ✅ Query `role_permissions` to get user permissions
9. ✅ Add loading states and error handling
10. ✅ Implement sign out with proper cleanup

---

## Notes

- The reference project uses a simpler approach that works but doesn't scale
- Company OS needs proper RBAC from day one
- We can reuse UI/UX patterns (forms, loading states, error handling)
- We should use modern Supabase patterns (`@supabase/ssr`) for Next.js 15
- Middleware should enforce authentication, not just allow everything

