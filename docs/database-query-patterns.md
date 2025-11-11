# Database Query Patterns — Preventing Schema Errors

## Problem

When querying Supabase tables in non-default schemas (like `common_util`, `core`, `crm`), you **MUST** specify the schema explicitly. Otherwise, you'll get errors like:

```
Failed to fetch projects: relation "projects" does not exist
```

## Solution: Use Schema-Aware Helpers

**ALWAYS** use the schema-aware helpers from `@/lib/db/schema-helpers` instead of raw Supabase queries.

### ✅ CORRECT Pattern

```ts
import { fromCommonUtil, fromCore } from '@/lib/db/schema-helpers'

// Query projects (in common_util schema)
const { data: projects } = await fromCommonUtil('projects')
  .select('*')
  .is('deleted_at', null)

// Query profiles (in core schema)
const { data: profiles } = await fromCore('profiles')
  .select('id, first_name, last_name')
  .eq('department_id', deptId)
```

### ❌ WRONG Pattern

```ts
import { getUnifiedClient } from '@/lib/db/unified-client'

const supabase = getUnifiedClient()

// ❌ Missing schema - will fail!
const { data: projects } = await supabase
  .from('projects')  // Error: relation "projects" does not exist
  .select('*')
```

## Available Helpers

### Direct Schema Helpers

```ts
import {
  fromCore,
  fromCommonUtil,
  fromCrm,
  fromOps,
  fromAts,
  fromHr,
  fromImportOps,
} from '@/lib/db/schema-helpers'

// Core schema (profiles, departments, companies, etc.)
fromCore('profiles')
fromCore('departments')

// Common util schema (tasks, projects, etc.)
fromCommonUtil('tasks')
fromCommonUtil('projects')
fromCommonUtil('project_members')

// CRM schema
fromCrm('leads')
fromCrm('opportunities')

// Ops schema
fromOps('orders')
fromOps('shipments')

// ATS schema
fromAts('applications')
fromAts('candidates')

// HR schema
fromHr('attendance_sessions')
fromHr('leave_requests')

// Import Ops schema
fromImportOps('inquiries')
fromImportOps('rfqs')
```

### Generic Schema Helper

```ts
import { fromSchema, SCHEMAS } from '@/lib/db/schema-helpers'

// Use when you need dynamic schema selection
const query = fromSchema(SCHEMAS.COMMON_UTIL, 'projects')
```

## Common Patterns

### 1. Fetch All Records

```ts
import { fromCommonUtil } from '@/lib/db/schema-helpers'

const { data, error } = await fromCommonUtil('projects')
  .select('*')
  .is('deleted_at', null)
  .order('created_at', { ascending: false })
```

### 2. Fetch with Filters

```ts
import { fromCommonUtil } from '@/lib/db/schema-helpers'

const { data, error } = await fromCommonUtil('projects')
  .select('*')
  .eq('status', 'active')
  .in('category', ['development', 'marketing'])
  .is('deleted_at', null)
```

### 3. Fetch with Relations

```ts
import { fromCommonUtil, fromCore } from '@/lib/db/schema-helpers'

// Fetch project with department
const { data: project } = await fromCommonUtil('projects')
  .select('*, department:departments!projects_department_id_fkey(id, name)')
  .eq('id', projectId)
  .single()

// Or fetch separately (more reliable)
const { data: project } = await fromCommonUtil('projects')
  .select('*')
  .eq('id', projectId)
  .single()

const { data: department } = project?.department_id
  ? await fromCore('departments')
      .select('id, name')
      .eq('id', project.department_id)
      .single()
  : { data: null }
```

### 4. Insert Record

```ts
import { fromCommonUtil } from '@/lib/db/schema-helpers'

const { data, error } = await fromCommonUtil('projects')
  .insert({
    name: 'New Project',
    status: 'not_started',
    created_by: profileId,
  })
  .select()
  .single()
```

### 5. Update Record

```ts
import { fromCommonUtil } from '@/lib/db/schema-helpers'

const { data, error } = await fromCommonUtil('projects')
  .update({ status: 'in_progress' })
  .eq('id', projectId)
  .select()
  .single()
```

### 6. Soft Delete

```ts
import { fromCommonUtil } from '@/lib/db/schema-helpers'

const { error } = await fromCommonUtil('projects')
  .update({ deleted_at: new Date().toISOString() })
  .eq('id', projectId)
```

### 7. Count Records

```ts
import { fromCommonUtil } from '@/lib/db/schema-helpers'

const { count, error } = await fromCommonUtil('projects')
  .select('*', { count: 'exact', head: true })
  .eq('status', 'active')
  .is('deleted_at', null)
```

## Migration Checklist

When creating new API routes or database queries:

- [ ] **Import schema helpers** instead of using raw Supabase client
- [ ] **Use appropriate helper** (`fromCore`, `fromCommonUtil`, etc.)
- [ ] **Verify schema** matches the table's actual schema
- [ ] **Test query** to ensure it works
- [ ] **Check error messages** - if you see "relation does not exist", you forgot the schema

## Quick Reference: Table → Schema Mapping

| Table | Schema | Helper |
|-------|--------|--------|
| `profiles`, `departments`, `companies`, `contacts` | `core` | `fromCore()` |
| `tasks`, `projects`, `project_members` | `common_util` | `fromCommonUtil()` |
| `leads`, `opportunities`, `interactions` | `crm` | `fromCrm()` |
| `orders`, `shipments`, `quotations` | `ops` | `fromOps()` |
| `applications`, `candidates` | `ats` | `fromAts()` |
| `attendance_sessions`, `leave_requests` | `hr` | `fromHr()` |
| `inquiries`, `rfqs` | `import_ops` | `fromImportOps()` |

## Why This Matters

1. **Prevents Runtime Errors**: Schema specification prevents "relation does not exist" errors
2. **Type Safety**: TypeScript can help catch schema mismatches
3. **Consistency**: All queries follow the same pattern
4. **Maintainability**: Easy to find and update queries
5. **Documentation**: Schema helpers serve as documentation of table locations

## Examples of Fixed Code

### Before (❌ Broken)

```ts
// src/app/api/unified/projects/route.ts
const supabase = getUnifiedClient()
const { data } = await supabase.from('projects').select('*')
// Error: relation "projects" does not exist
```

### After (✅ Fixed)

```ts
// src/app/api/unified/projects/route.ts
import { fromCommonUtil } from '@/lib/db/schema-helpers'

const { data } = await fromCommonUtil('projects').select('*')
// Works! Schema is automatically specified
```

