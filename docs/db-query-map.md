# Database Query Inventory

**Generated:** 2025-01-27  
**Purpose:** Complete inventory of all database queries in the codebase to plan Drizzle ORM migration

## Summary

- **Total Files with DB Queries:** ~80+
- **Direct Supabase Queries:** ~200+
- **Schema Helper Queries:** ~120+
- **API Routes:** 37
- **Client Components:** 30+

## Query Patterns Found

1. **Direct Supabase Client** (`supabase.from()`, `supabase.rpc()`)
2. **Schema Helpers** (`fromCore()`, `fromCrm()`, `fromCommonUtil()`, etc.)
3. **Unified Client** (`getUnifiedClient()`)
4. **API Routes** (`fetch('/api/...')`)
5. **Server Actions** (via `createServerClient()`)

---

## 1. Core Database Libraries

### `src/lib/db/leads.ts`
**Status:** ❌ 100% Supabase  
**Method:** `createServiceRoleClient()`, `createServerClient()`

| Function/Route | Current Method | Table(s) | Replacement Status |
|----------------|----------------|----------|-------------------|
| `getLeads()` | `supabase.from('leads')` | `crm.leads` (via public view) | ⏳ Pending |
| `getLeads()` - contacts | `supabase.schema('core').from('contacts')` | `core.contacts` | ⏳ Pending |
| `getLeads()` - companies | `supabase.schema('core').from('companies')` | `core.companies` | ⏳ Pending |
| `getLeads()` - profiles | `supabase.schema('core').from('profiles')` | `core.profiles` | ⏳ Pending |
| `getLeads()` - interactions | `supabase.from('interactions')` | `crm.interactions` | ⏳ Pending |
| `getLeadById()` | `supabase.from('leads')` | `crm.leads` | ⏳ Pending |
| `getLeadById()` - contacts | `supabase.schema('core').from('contacts')` | `core.contacts` | ⏳ Pending |
| `getLeadById()` - companies | `supabase.schema('core').from('companies')` | `core.companies` | ⏳ Pending |
| `getLeadById()` - profiles | `supabase.schema('core').from('profiles')` | `core.profiles` | ⏳ Pending |
| `getLeadById()` - interactions | `supabase.schema('crm').from('interactions')` | `crm.interactions` | ⏳ Pending |
| `createLead()` | `supabase.from('leads').insert()` | `crm.leads` | ⏳ Pending |
| `createLead()` - status_history | `supabase.from('status_history').insert()` | `crm.status_history` | ⏳ Pending |
| `createLead()` - profiles | `supabase.from('profiles').select('user_id')` | `core.profiles` | ⏳ Pending |
| `updateLead()` | `supabase.from('leads').update()` | `crm.leads` | ⏳ Pending |
| `updateLead()` - profiles | `supabase.from('profiles').select('user_id')` | `core.profiles` | ⏳ Pending |
| `deleteLead()` | `supabase.from('leads').update({deleted_at})` | `crm.leads` | ⏳ Pending |
| `updateLeadStatus()` | `supabase.from('leads').update()` | `crm.leads` | ⏳ Pending |
| `updateLeadStatus()` - status_history | `supabase.from('status_history').insert()` | `crm.status_history` | ⏳ Pending |
| `getLeadInteractions()` | `supabase.from('interactions')` | `crm.interactions` | ⏳ Pending |
| `getLeadInteractions()` - profiles | `supabase.schema('core').from('profiles')` | `core.profiles` | ⏳ Pending |
| `addInteraction()` | `supabase.from('interactions').insert()` | `crm.interactions` | ⏳ Pending |
| `addInteraction()` - profiles | `supabase.schema('core').from('profiles')` | `core.profiles` | ⏳ Pending |
| `getLeadStatusHistory()` | `supabase.from('status_history')` | `crm.status_history` | ⏳ Pending |
| `getLeadStatusHistory()` - profiles | `supabase.schema('core').from('profiles')` | `core.profiles` | ⏳ Pending |

### `src/lib/db/tasks.ts`
**Status:** ❌ 100% Supabase  
**Method:** `createServerClient()`

| Function/Route | Current Method | Table(s) | Replacement Status |
|----------------|----------------|----------|-------------------|
| `getCurrentProfileId()` | `supabase.from('profiles')` | `core.profiles` | ⏳ Pending |
| `getTasks()` | `supabase.from('tasks')` | `common_util.tasks` (via public view) | ⏳ Pending |
| `getTasks()` - task_assignees | `supabase.from('task_assignees')` | `common_util.task_assignees` | ⏳ Pending |
| `getTasks()` - task_status_history | `supabase.from('task_status_history')` | `common_util.task_status_history` | ⏳ Pending |
| `getTaskById()` | `supabase.from('tasks')` | `common_util.tasks` | ⏳ Pending |
| `getTaskById()` - task_assignees | `supabase.from('task_assignees')` | `common_util.task_assignees` | ⏳ Pending |
| `getTaskById()` - task_status_history | `supabase.from('task_status_history')` | `common_util.task_status_history` | ⏳ Pending |
| `createTask()` | `supabase.from('tasks').insert()` | `common_util.tasks` | ⏳ Pending |
| `updateTask()` | `supabase.from('tasks').update()` | `common_util.tasks` | ⏳ Pending |
| `addComment()` | `supabase.from('task_comments').insert()` | `common_util.task_comments` | ⏳ Pending |
| `assignUser()` | `supabase.from('task_assignees').insert()` | `common_util.task_assignees` | ⏳ Pending |
| `assignUser()` - profiles | `supabase.from('profiles').select('user_id')` | `core.profiles` | ⏳ Pending |
| `getOverdueTasksCount()` | `supabase.from('task_assignees')` | `common_util.task_assignees` | ⏳ Pending |
| `getOverdueTasksCount()` | `supabase.from('tasks')` | `common_util.tasks` | ⏳ Pending |
| `getOverdueTasks()` | `supabase.from('tasks')` | `common_util.tasks` | ⏳ Pending |
| `getOverdueTasks()` - task_assignees | `supabase.from('task_assignees')` | `common_util.task_assignees` | ⏳ Pending |

### `src/lib/db/projects.ts`
**Status:** ❌ 100% Supabase  
**Method:** `createServerClient()`

| Function/Route | Current Method | Table(s) | Replacement Status |
|----------------|----------------|----------|-------------------|
| `getCurrentProfileId()` | `supabase.from('profiles')` | `core.profiles` | ⏳ Pending |
| `calculateProjectProgress()` | `fromCommonUtil('tasks')` | `common_util.tasks` | ⏳ Pending |
| `getProjects()` | `supabase.from('projects')` | `common_util.projects` (via public view) | ⏳ Pending |
| `getProjects()` - project_members | `supabase.from('project_members')` | `common_util.project_members` | ⏳ Pending |
| `getProjects()` - project_status_history | `supabase.from('project_status_history')` | `common_util.project_status_history` | ⏳ Pending |
| `getProjects()` - profiles | `supabase.from('profiles')` | `core.profiles` | ⏳ Pending |
| `getProjectById()` | `supabase.from('projects')` | `common_util.projects` | ⏳ Pending |
| `getProjectById()` - project_members | `supabase.from('project_members')` | `common_util.project_members` | ⏳ Pending |
| `getProjectById()` - project_status_history | `supabase.from('project_status_history')` | `common_util.project_status_history` | ⏳ Pending |
| `getProjectById()` - profiles | `supabase.from('profiles')` | `core.profiles` | ⏳ Pending |
| `getProjectTasks()` | `supabase.from('tasks')` | `common_util.tasks` | ⏳ Pending |
| `getProjectTasks()` - task_assignees | `supabase.from('task_assignees')` | `common_util.task_assignees` | ⏳ Pending |
| `getProjectTasks()` - task_status_history | `supabase.from('task_status_history')` | `common_util.task_status_history` | ⏳ Pending |
| `createProject()` | `supabase.from('projects').insert()` | `common_util.projects` | ⏳ Pending |
| `updateProject()` | `supabase.from('projects').update()` | `common_util.projects` | ⏳ Pending |
| `deleteProject()` | `supabase.from('projects').update({deleted_at})` | `common_util.projects` | ⏳ Pending |
| `addProjectMember()` | `supabase.from('project_members').insert()` | `common_util.project_members` | ⏳ Pending |
| `addProjectMember()` - profiles | `supabase.from('profiles').select('user_id')` | `core.profiles` | ⏳ Pending |
| `removeProjectMember()` | `supabase.from('project_members').delete()` | `common_util.project_members` | ⏳ Pending |

### `src/lib/db/unified-client.ts`
**Status:** ❌ 100% Supabase  
**Method:** `getUnifiedClient()` (anon key)

| Function/Route | Current Method | Table(s) | Replacement Status |
|----------------|----------------|----------|-------------------|
| `fetchAll()` | `supabase.schema(schema).from(table)` | All schemas | ⏳ Pending |
| `fetchById()` | `supabase.schema(schema).from(table)` | All schemas | ⏳ Pending |
| `createRecord()` | `supabase.schema(schema).from(table).insert()` | All schemas | ⏳ Pending |
| `updateRecord()` | `supabase.schema(schema).from(table).update()` | All schemas | ⏳ Pending |
| `deleteRecord()` | `supabase.schema(schema).from(table).update({deleted_at})` | All schemas | ⏳ Pending |
| `searchRecords()` | `supabase.schema(schema).from(table).or()` | All schemas | ⏳ Pending |

### `src/lib/db/schema-helpers.ts`
**Status:** ❌ 100% Supabase (wrapper)  
**Method:** `getUnifiedClient()` + schema specification

| Function/Route | Current Method | Table(s) | Replacement Status |
|----------------|----------------|----------|-------------------|
| `fromCore()` | `supabase.schema('core').from(table)` | `core.*` | ⏳ Pending |
| `fromCrm()` | `supabase.schema('crm').from(table)` | `crm.*` | ⏳ Pending |
| `fromCommonUtil()` | `supabase.schema('common_util').from(table)` | `common_util.*` | ⏳ Pending |
| `fromOps()` | `supabase.schema('ops').from(table)` | `ops.*` | ⏳ Pending |
| `fromAts()` | `supabase.schema('ats').from(table)` | `ats.*` | ⏳ Pending |
| `fromHr()` | `supabase.schema('hr').from(table)` | `hr.*` | ⏳ Pending |
| `fromImportOps()` | `supabase.schema('import_ops').from(table)` | `import_ops.*` | ⏳ Pending |

### `src/lib/notifications/notifications.ts`
**Status:** ❌ 100% Supabase  
**Method:** `createServerClient()`

| Function/Route | Current Method | Table(s) | Replacement Status |
|----------------|----------------|----------|-------------------|
| `createNotification()` | `supabase.from('notifications').insert()` | `core.notifications` | ⏳ Pending |
| `createNotificationsForUsers()` | `supabase.from('notifications').insert()` | `core.notifications` | ⏳ Pending |
| `getUserNotifications()` | `supabase.from('notifications')` | `core.notifications` | ⏳ Pending |
| `markAsRead()` | `supabase.from('notifications').update()` | `core.notifications` | ⏳ Pending |
| `markAllAsRead()` | `supabase.rpc('mark_all_notifications_read')` | `core.notifications` (RPC) | ⏳ Pending |
| `getUnreadCount()` | `supabase.from('notifications')` | `core.notifications` | ⏳ Pending |
| `deleteNotification()` | `supabase.from('notifications').update({deleted_at})` | `core.notifications` | ⏳ Pending |
| `getNotificationPreferences()` | `supabase.from('notification_preferences')` | `core.notification_preferences` | ⏳ Pending |
| `updateNotificationPreference()` | `supabase.from('notification_preferences').upsert()` | `core.notification_preferences` | ⏳ Pending |
| `isNotificationEnabled()` | `supabase.from('notification_preferences')` | `core.notification_preferences` | ⏳ Pending |

---

## 2. API Routes

### Unified API Routes (using schema helpers)

#### `src/app/api/unified/tasks/route.ts`
| Function/Route | Current Method | Table(s) | Replacement Status |
|----------------|----------------|----------|-------------------|
| `GET /api/unified/tasks` | `fromCommonUtil('tasks')` | `common_util.tasks` | ⏳ Pending |
| `GET /api/unified/tasks` - task_assignees | `fromCommonUtil('task_assignees')` | `common_util.task_assignees` | ⏳ Pending |
| `GET /api/unified/tasks` - departments | `fromCore('departments')` | `core.departments` | ⏳ Pending |
| `GET /api/unified/tasks` - profiles | `fromCore('profiles')` | `core.profiles` | ⏳ Pending |
| `POST /api/unified/tasks` | `fromCommonUtil('tasks').insert()` | `common_util.tasks` | ⏳ Pending |
| `POST /api/unified/tasks` - task_assignees | `supabase.from('task_assignees').insert()` | `common_util.task_assignees` | ⏳ Pending |

#### `src/app/api/unified/tasks/[id]/route.ts`
| Function/Route | Current Method | Table(s) | Replacement Status |
|----------------|----------------|----------|-------------------|
| `GET /api/unified/tasks/[id]` | `fromCommonUtil('tasks')` | `common_util.tasks` | ⏳ Pending |
| `GET /api/unified/tasks/[id]` - task_assignees | `fromCommonUtil('task_assignees')` | `common_util.task_assignees` | ⏳ Pending |
| `GET /api/unified/tasks/[id]` - departments | `fromCore('departments')` | `core.departments` | ⏳ Pending |
| `GET /api/unified/tasks/[id]` - profiles | `fromCore('profiles')` | `core.profiles` | ⏳ Pending |
| `PUT /api/unified/tasks/[id]` | `fromCommonUtil('tasks').update()` | `common_util.tasks` | ⏳ Pending |
| `PUT /api/unified/tasks/[id]` - task_assignees | `fromCommonUtil('task_assignees')` | `common_util.task_assignees` | ⏳ Pending |
| `DELETE /api/unified/tasks/[id]` | `fromCommonUtil('tasks').update({deleted_at})` | `common_util.tasks` | ⏳ Pending |

#### `src/app/api/unified/leads/route.ts`
| Function/Route | Current Method | Table(s) | Replacement Status |
|----------------|----------------|----------|-------------------|
| `GET /api/unified/leads` | `fromCrm('leads')` | `crm.leads` | ⏳ Pending |
| `GET /api/unified/leads` - contacts | `fromCore('contacts')` | `core.contacts` | ⏳ Pending |
| `GET /api/unified/leads` - companies | `fromCore('companies')` | `core.companies` | ⏳ Pending |
| `GET /api/unified/leads` - profiles | `fromCore('profiles')` | `core.profiles` | ⏳ Pending |
| `POST /api/unified/leads` | `fromCrm('leads').insert()` | `crm.leads` | ⏳ Pending |

#### `src/app/api/unified/projects/route.ts`
| Function/Route | Current Method | Table(s) | Replacement Status |
|----------------|----------------|----------|-------------------|
| `GET /api/unified/projects` | `fromCommonUtil('projects')` | `common_util.projects` | ⏳ Pending |
| `GET /api/unified/projects` - project_members | `fromCommonUtil('project_members')` | `common_util.project_members` | ⏳ Pending |
| `GET /api/unified/projects` - departments | `fromCore('departments')` | `core.departments` | ⏳ Pending |
| `GET /api/unified/projects` - profiles | `fromCore('profiles')` | `core.profiles` | ⏳ Pending |
| `POST /api/unified/projects` | `fromCommonUtil('projects').insert()` | `common_util.projects` | ⏳ Pending |
| `POST /api/unified/projects` - project_members | `fromCommonUtil('project_members').insert()` | `common_util.project_members` | ⏳ Pending |

#### `src/app/api/unified/projects/[id]/route.ts`
| Function/Route | Current Method | Table(s) | Replacement Status |
|----------------|----------------|----------|-------------------|
| `GET /api/unified/projects/[id]` | `fromCommonUtil('projects')` | `common_util.projects` | ⏳ Pending |
| `GET /api/unified/projects/[id]` - project_members | `fromCommonUtil('project_members')` | `common_util.project_members` | ⏳ Pending |
| `GET /api/unified/projects/[id]` - project_status_history | `fromCommonUtil('project_status_history')` | `common_util.project_status_history` | ⏳ Pending |
| `GET /api/unified/projects/[id]` - departments | `fromCore('departments')` | `core.departments` | ⏳ Pending |
| `GET /api/unified/projects/[id]` - profiles | `fromCore('profiles')` | `core.profiles` | ⏳ Pending |
| `PUT /api/unified/projects/[id]` | `fromCommonUtil('projects').update()` | `common_util.projects` | ⏳ Pending |
| `PUT /api/unified/projects/[id]` - project_members | `fromCommonUtil('project_members')` | `common_util.project_members` | ⏳ Pending |
| `DELETE /api/unified/projects/[id]` | `fromCommonUtil('projects').update({deleted_at})` | `common_util.projects` | ⏳ Pending |

#### `src/app/api/unified/projects/[id]/members/route.ts`
| Function/Route | Current Method | Table(s) | Replacement Status |
|----------------|----------------|----------|-------------------|
| `GET /api/unified/projects/[id]/members` | `fromCommonUtil('project_members')` | `common_util.project_members` | ⏳ Pending |
| `GET /api/unified/projects/[id]/members` - profiles | `fromCore('profiles')` | `core.profiles` | ⏳ Pending |
| `POST /api/unified/projects/[id]/members` | `fromCommonUtil('project_members').insert()` | `common_util.project_members` | ⏳ Pending |
| `POST /api/unified/projects/[id]/members` - profiles | `fromCore('profiles')` | `core.profiles` | ⏳ Pending |
| `DELETE /api/unified/projects/[id]/members` | `fromCommonUtil('project_members').delete()` | `common_util.project_members` | ⏳ Pending |

#### `src/app/api/unified/tickets/route.ts`
| Function/Route | Current Method | Table(s) | Replacement Status |
|----------------|----------------|----------|-------------------|
| `GET /api/unified/tickets` | `fromCommonUtil('tickets')` | `common_util.tickets` | ⏳ Pending |
| `GET /api/unified/tickets` - contacts | `fromCore('contacts')` | `core.contacts` | ⏳ Pending |
| `GET /api/unified/tickets` - profiles | `fromCore('profiles')` | `core.profiles` | ⏳ Pending |
| `POST /api/unified/tickets` | `fromCommonUtil('tickets').insert()` | `common_util.tickets` | ⏳ Pending |

#### `src/app/api/unified/subscriptions/route.ts`
| Function/Route | Current Method | Table(s) | Replacement Status |
|----------------|----------------|----------|-------------------|
| `GET /api/unified/subscriptions` | `fromCommonUtil('subscriptions')` | `common_util.subscriptions` | ⏳ Pending |
| `GET /api/unified/subscriptions` - contacts | `fromCore('contacts')` | `core.contacts` | ⏳ Pending |
| `POST /api/unified/subscriptions` | `fromCommonUtil('subscriptions').insert()` | `common_util.subscriptions` | ⏳ Pending |
| `POST /api/unified/subscriptions` - contacts | `fromCore('contacts')` | `core.contacts` | ⏳ Pending |
| `PUT /api/unified/subscriptions/[id]` | `fromCommonUtil('subscriptions').update()` | `common_util.subscriptions` | ⏳ Pending |
| `PUT /api/unified/subscriptions/[id]` - contacts | `fromCore('contacts')` | `core.contacts` | ⏳ Pending |
| `DELETE /api/unified/subscriptions/[id]` | `fromCommonUtil('subscriptions').update({deleted_at})` | `common_util.subscriptions` | ⏳ Pending |

#### `src/app/api/unified/departments/route.ts`
| Function/Route | Current Method | Table(s) | Replacement Status |
|----------------|----------------|----------|-------------------|
| `GET /api/unified/departments` | `supabase.schema('core').from('departments')` | `core.departments` | ⏳ Pending |

#### `src/app/api/unified/users/route.ts`
| Function/Route | Current Method | Table(s) | Replacement Status |
|----------------|----------------|----------|-------------------|
| `GET /api/unified/users` | `fromCore('profiles')` | `core.profiles` | ⏳ Pending |
| `GET /api/unified/users` - departments | `fromCore('departments')` | `core.departments` | ⏳ Pending |
| `GET /api/unified/users` - user_role_bindings | `fromCore('user_role_bindings')` | `core.user_role_bindings` | ⏳ Pending |
| `GET /api/unified/users` - roles | `fromCore('roles')` | `core.roles` | ⏳ Pending |

#### `src/app/api/unified/users/[id]/route.ts`
| Function/Route | Current Method | Table(s) | Replacement Status |
|----------------|----------------|----------|-------------------|
| `GET /api/unified/users/[id]` | `fromCore('profiles')` | `core.profiles` | ⏳ Pending |
| `GET /api/unified/users/[id]` - departments | `fromCore('departments')` | `core.departments` | ⏳ Pending |
| `PUT /api/unified/users/[id]` | `fromCore('profiles').update()` | `core.profiles` | ⏳ Pending |

#### `src/app/api/unified/employees/route.ts`
| Function/Route | Current Method | Table(s) | Replacement Status |
|----------------|----------------|----------|-------------------|
| `GET /api/unified/employees` | `fromCore('employees')` | `core.employees` | ⏳ Pending |
| `GET /api/unified/employees` - profiles | `fromCore('profiles')` | `core.profiles` | ⏳ Pending |
| `GET /api/unified/employees` - departments | `fromCore('departments')` | `core.departments` | ⏳ Pending |

#### `src/app/api/unified/employees/[id]/route.ts`
| Function/Route | Current Method | Table(s) | Replacement Status |
|----------------|----------------|----------|-------------------|
| `GET /api/unified/employees/[id]` | `fromCore('employees')` | `core.employees` | ⏳ Pending |
| `GET /api/unified/employees/[id]` - profiles | `fromCore('profiles')` | `core.profiles` | ⏳ Pending |
| `GET /api/unified/employees/[id]` - departments | `fromCore('departments')` | `core.departments` | ⏳ Pending |
| `PUT /api/unified/employees/[id]` | `fromCore('employees').update()` | `core.employees` | ⏳ Pending |
| `DELETE /api/unified/employees/[id]` | `fromCore('employees').update({deleted_at})` | `core.employees` | ⏳ Pending |

#### `src/app/api/unified/projects/[id]/tasks/route.ts`
| Function/Route | Current Method | Table(s) | Replacement Status |
|----------------|----------------|----------|-------------------|
| `GET /api/unified/projects/[id]/tasks` | `fromCommonUtil('tasks')` | `common_util.tasks` | ⏳ Pending |

### Dashboard & Metrics

#### `src/app/api/dashboard/metrics/route.ts`
| Function/Route | Current Method | Table(s) | Replacement Status |
|----------------|----------------|----------|-------------------|
| `GET /api/dashboard/metrics` - tasks | `fromCommonUtil('tasks')` | `common_util.tasks` | ⏳ Pending |
| `GET /api/dashboard/metrics` - leads | `fromCrm('leads')` | `crm.leads` | ⏳ Pending |
| `GET /api/dashboard/metrics` - orders | `fromOps('orders')` | `ops.orders` | ⏳ Pending |
| `GET /api/dashboard/metrics` - order_items | `fromOps('order_items')` | `ops.order_items` | ⏳ Pending |
| `GET /api/dashboard/metrics` - applications | `fromAts('applications')` | `ats.applications` | ⏳ Pending |
| `GET /api/dashboard/metrics` - interviews | `fromAts('interviews')` | `ats.interviews` | ⏳ Pending |
| `GET /api/dashboard/metrics` - activity_events | `fromCore('activity_events')` | `core.activity_events` | ⏳ Pending |
| `GET /api/dashboard/metrics` - profiles | `fromCore('profiles')` | `core.profiles` | ⏳ Pending |
| `GET /api/dashboard/metrics` - opportunities | `fromCrm('opportunities')` | `crm.opportunities` | ⏳ Pending |
| `GET /api/dashboard/metrics` - quotations (crm) | `fromCrm('quotations')` | `crm.quotations` | ⏳ Pending |
| `GET /api/dashboard/metrics` - calls | `fromCrm('calls')` | `crm.calls` | ⏳ Pending |
| `GET /api/dashboard/metrics` - quotations (ops) | `fromOps('quotations')` | `ops.quotations` | ⏳ Pending |
| `GET /api/dashboard/metrics` - shipments | `fromOps('shipments')` | `ops.shipments` | ⏳ Pending |
| `GET /api/dashboard/metrics` - payments | `fromOps('payments')` | `ops.payments` | ⏳ Pending |
| `GET /api/dashboard/metrics` - employees | `fromCore('employees')` | `core.employees` | ⏳ Pending |
| `GET /api/dashboard/metrics` - attendance_sessions | `fromHr('attendance_sessions')` | `hr.attendance_sessions` | ⏳ Pending |
| `GET /api/dashboard/metrics` - leave_requests | `fromHr('leave_requests')` | `hr.leave_requests` | ⏳ Pending |
| `GET /api/dashboard/metrics` - companies | `fromCore('companies')` | `core.companies` | ⏳ Pending |
| `GET /api/dashboard/metrics` - contacts | `fromCore('contacts')` | `core.contacts` | ⏳ Pending |

### Search

#### `src/app/api/search/route.ts`
| Function/Route | Current Method | Table(s) | Replacement Status |
|----------------|----------------|----------|-------------------|
| `GET /api/search` - tasks | `fromCommonUtil('tasks')` | `common_util.tasks` | ⏳ Pending |
| `GET /api/search` - contacts | `fromCore('contacts')` | `core.contacts` | ⏳ Pending |
| `GET /api/search` - companies | `fromCore('companies')` | `core.companies` | ⏳ Pending |
| `GET /api/search` - profiles | `fromCore('profiles')` | `core.profiles` | ⏳ Pending |

### Tasks API

#### `src/app/api/tasks/route.ts`
| Function/Route | Current Method | Table(s) | Replacement Status |
|----------------|----------------|----------|-------------------|
| `GET /api/tasks` | Uses `getTasks()` from `@/lib/db/tasks` | `common_util.tasks` | ⏳ Pending |
| `POST /api/tasks` | Uses `createTask()` from `@/lib/db/tasks` | `common_util.tasks` | ⏳ Pending |

#### `src/app/api/tasks/[id]/route.ts`
| Function/Route | Current Method | Table(s) | Replacement Status |
|----------------|----------------|----------|-------------------|
| `GET /api/tasks/[id]` | Uses `getTaskById()` from `@/lib/db/tasks` | `common_util.tasks` | ⏳ Pending |
| `PUT /api/tasks/[id]` | Uses `updateTask()` from `@/lib/db/tasks` | `common_util.tasks` | ⏳ Pending |

#### `src/app/api/tasks/[id]/assign/route.ts`
| Function/Route | Current Method | Table(s) | Replacement Status |
|----------------|----------------|----------|-------------------|
| `POST /api/tasks/[id]/assign` | `fromCommonUtil('tasks')` | `common_util.tasks` | ⏳ Pending |
| `POST /api/tasks/[id]/assign` - profiles | `fromCore('profiles')` | `core.profiles` | ⏳ Pending |

#### `src/app/api/tasks/[id]/comments/route.ts`
| Function/Route | Current Method | Table(s) | Replacement Status |
|----------------|----------------|----------|-------------------|
| `POST /api/tasks/[id]/comments` | `fromCommonUtil('tasks')` | `common_util.tasks` | ⏳ Pending |

#### `src/app/api/tasks/overdue/route.ts`
| Function/Route | Current Method | Table(s) | Replacement Status |
|----------------|----------------|----------|-------------------|
| `GET /api/tasks/overdue` | Uses `getOverdueTasks()` from `@/lib/db/tasks` | `common_util.tasks` | ⏳ Pending |

### Notifications API

#### `src/app/api/notifications/route.ts`
| Function/Route | Current Method | Table(s) | Replacement Status |
|----------------|----------------|----------|-------------------|
| `GET /api/notifications` | Uses `getUserNotifications()` from `@/lib/notifications/notifications` | `core.notifications` | ⏳ Pending |
| `POST /api/notifications` | Uses `createNotification()` from `@/lib/notifications/notifications` | `core.notifications` | ⏳ Pending |

#### `src/app/api/notifications/[id]/route.ts`
| Function/Route | Current Method | Table(s) | Replacement Status |
|----------------|----------------|----------|-------------------|
| `GET /api/notifications/[id]` | `supabase.from('notifications')` | `core.notifications` | ⏳ Pending |
| `PUT /api/notifications/[id]` | `supabase.from('notifications').update()` | `core.notifications` | ⏳ Pending |
| `DELETE /api/notifications/[id]` | `supabase.from('notifications').update({deleted_at})` | `core.notifications` | ⏳ Pending |

#### `src/app/api/notifications/count/route.ts`
| Function/Route | Current Method | Table(s) | Replacement Status |
|----------------|----------------|----------|-------------------|
| `GET /api/notifications/count` | `supabase.from('notifications')` | `core.notifications` | ⏳ Pending |

#### `src/app/api/notifications/read-all/route.ts`
| Function/Route | Current Method | Table(s) | Replacement Status |
|----------------|----------------|----------|-------------------|
| `POST /api/notifications/read-all` | `supabase.rpc('mark_all_notifications_read')` | `core.notifications` (RPC) | ⏳ Pending |

#### `src/app/api/notifications/preferences/route.ts`
| Function/Route | Current Method | Table(s) | Replacement Status |
|----------------|----------------|----------|-------------------|
| `GET /api/notifications/preferences` | Uses `getNotificationPreferences()` from `@/lib/notifications/notifications` | `core.notification_preferences` | ⏳ Pending |
| `PUT /api/notifications/preferences` | Uses `updateNotificationPreference()` from `@/lib/notifications/notifications` | `core.notification_preferences` | ⏳ Pending |

### CRM API

#### `src/app/api/crm/leads/route.ts`
| Function/Route | Current Method | Table(s) | Replacement Status |
|----------------|----------------|----------|-------------------|
| `GET /api/crm/leads` | Uses `getLeads()` from `@/lib/db/leads` | `crm.leads` | ⏳ Pending |
| `POST /api/crm/leads` | Uses `createLead()` from `@/lib/db/leads` | `crm.leads` | ⏳ Pending |

#### `src/app/api/crm/leads/[id]/route.ts`
| Function/Route | Current Method | Table(s) | Replacement Status |
|----------------|----------------|----------|-------------------|
| `GET /api/crm/leads/[id]` | Uses `getLeadById()` from `@/lib/db/leads` | `crm.leads` | ⏳ Pending |
| `PUT /api/crm/leads/[id]` | Uses `updateLead()` from `@/lib/db/leads` | `crm.leads` | ⏳ Pending |
| `DELETE /api/crm/leads/[id]` | Uses `deleteLead()` from `@/lib/db/leads` | `crm.leads` | ⏳ Pending |

#### `src/app/api/crm/leads/[id]/status/route.ts`
| Function/Route | Current Method | Table(s) | Replacement Status |
|----------------|----------------|----------|-------------------|
| `PUT /api/crm/leads/[id]/status` | Uses `updateLeadStatus()` from `@/lib/db/leads` | `crm.leads`, `crm.status_history` | ⏳ Pending |

### Users API

#### `src/app/api/users/create/route.ts`
| Function/Route | Current Method | Table(s) | Replacement Status |
|----------------|----------------|----------|-------------------|
| `POST /api/users/create` | `supabase.from('profiles')` | `core.profiles` | ⏳ Pending |
| `POST /api/users/create` - user_role_bindings | `supabase.from('user_role_bindings')` | `core.user_role_bindings` | ⏳ Pending |

#### `src/app/api/users/invite/route.ts`
| Function/Route | Current Method | Table(s) | Replacement Status |
|----------------|----------------|----------|-------------------|
| `POST /api/users/invite` | Uses Clerk API + `supabase.from('profiles')` | `core.profiles` | ⏳ Pending |

#### `src/app/api/users/invitations/route.ts`
| Function/Route | Current Method | Table(s) | Replacement Status |
|----------------|----------------|----------|-------------------|
| `GET /api/users/invitations` | Uses Clerk API | N/A (Clerk) | ✅ N/A |

### AI/Agents API

#### `src/app/api/ai/agents/route.ts`
| Function/Route | Current Method | Table(s) | Replacement Status |
|----------------|----------------|----------|-------------------|
| `GET /api/ai/agents` | `supabase.rpc('get_ai_agents')` | `core.ai_agents` (RPC) | ⏳ Pending |

#### `src/app/api/ai/chat/route.ts`
| Function/Route | Current Method | Table(s) | Replacement Status |
|----------------|----------------|----------|-------------------|
| `POST /api/ai/chat` | `createServerClient()` | Various (chat context) | ⏳ Pending |

#### `src/app/api/ai/chatflow/[agentId]/route.ts`
| Function/Route | Current Method | Table(s) | Replacement Status |
|----------------|----------------|----------|-------------------|
| `POST /api/ai/chatflow/[agentId]` | `createServerClient()` | `core.ai_agents` | ⏳ Pending |

---

## 3. Client-Side Components

### Pages

#### `src/app/tasks/page.tsx`
| Function/Route | Current Method | Table(s) | Replacement Status |
|----------------|----------------|----------|-------------------|
| `fetchTasks()` | `fetch('/api/unified/tasks')` | `common_util.tasks` | ⏳ Pending |

#### `src/app/tasks/components/task-details-modal.tsx`
| Function/Route | Current Method | Table(s) | Replacement Status |
|----------------|----------------|----------|-------------------|
| `fetchTask()` | `supabase.from('tasks')` | `common_util.tasks` | ⏳ Pending |
| `fetchTask()` - task_assignees | `supabase.from('task_assignees')` | `common_util.task_assignees` | ⏳ Pending |
| `fetchTask()` - task_comments | `supabase.from('task_comments')` | `common_util.task_comments` | ⏳ Pending |
| `fetchTask()` - task_subtasks | `supabase.from('task_subtasks')` | `common_util.task_subtasks` | ⏳ Pending |
| `fetchTask()` - task_deliverables | `supabase.from('task_deliverables')` | `common_util.task_deliverables` | ⏳ Pending |
| `fetchTask()` - task_attachments | `supabase.from('task_attachments')` | `common_util.task_attachments` | ⏳ Pending |
| `updateTask()` | `supabase.from('tasks').update()` | `common_util.tasks` | ⏳ Pending |
| `addComment()` | `supabase.from('task_comments').insert()` | `common_util.task_comments` | ⏳ Pending |
| `addSubtask()` | `supabase.from('task_subtasks').insert()` | `common_util.task_subtasks` | ⏳ Pending |
| `updateSubtask()` | `supabase.from('task_subtasks').update()` | `common_util.task_subtasks` | ⏳ Pending |
| `deleteSubtask()` | `supabase.from('task_subtasks').delete()` | `common_util.task_subtasks` | ⏳ Pending |
| `addDeliverable()` | `supabase.from('task_deliverables').insert()` | `common_util.task_deliverables` | ⏳ Pending |
| `updateDeliverable()` | `supabase.from('task_deliverables').update()` | `common_util.task_deliverables` | ⏳ Pending |
| `deleteDeliverable()` | `supabase.from('task_deliverables').delete()` | `common_util.task_deliverables` | ⏳ Pending |
| `assignUser()` | `supabase.from('task_assignees').insert()` | `common_util.task_assignees` | ⏳ Pending |
| `removeAssignee()` | `supabase.from('task_assignees').delete()` | `common_util.task_assignees` | ⏳ Pending |
| `uploadAttachment()` | `supabase.from('task_attachments').insert()` | `common_util.task_attachments` | ⏳ Pending |
| `deleteAttachment()` | `supabase.from('task_attachments').delete()` | `common_util.task_attachments` | ⏳ Pending |

#### `src/app/tasks/components/task-form.tsx`
| Function/Route | Current Method | Table(s) | Replacement Status |
|----------------|----------------|----------|-------------------|
| `onSubmit()` | `fetch('/api/unified/projects')` | `common_util.projects` | ⏳ Pending |
| `onSubmit()` | `supabase.from('tasks').insert()` | `common_util.tasks` | ⏳ Pending |

#### `src/app/tasks/components/task-form-multistep.tsx`
| Function/Route | Current Method | Table(s) | Replacement Status |
|----------------|----------------|----------|-------------------|
| `onSubmit()` | `supabase.from('tasks').insert()` | `common_util.tasks` | ⏳ Pending |

#### `src/app/projects/page.tsx`
| Function/Route | Current Method | Table(s) | Replacement Status |
|----------------|----------------|----------|-------------------|
| `fetchProjects()` | `fetch('/api/unified/projects')` | `common_util.projects` | ⏳ Pending |

#### `src/app/projects/components/project-form.tsx`
| Function/Route | Current Method | Table(s) | Replacement Status |
|----------------|----------------|----------|-------------------|
| `onSubmit()` | `supabase.from('projects').insert()` | `common_util.projects` | ⏳ Pending |

#### `src/app/users/page.tsx`
| Function/Route | Current Method | Table(s) | Replacement Status |
|----------------|----------------|----------|-------------------|
| `fetchUsers()` | `supabase.from('profiles')` | `core.profiles` | ⏳ Pending |
| `fetchUsers()` - departments | `supabase.from('departments')` | `core.departments` | ⏳ Pending |
| `fetchInvitations()` | `fetch('/api/users/invitations')` | N/A (Clerk) | ✅ N/A |
| `updateUser()` | `supabase.from('profiles').update()` | `core.profiles` | ⏳ Pending |
| `deleteUser()` | `supabase.from('profiles').update({deleted_at})` | `core.profiles` | ⏳ Pending |

#### `src/app/users/components/add-user-dialog.tsx`
| Function/Route | Current Method | Table(s) | Replacement Status |
|----------------|----------------|----------|-------------------|
| `onSubmit()` | `fetch('/api/users/create')` | `core.profiles` | ⏳ Pending |

#### `src/app/users/components/edit-user-dialog.tsx`
| Function/Route | Current Method | Table(s) | Replacement Status |
|----------------|----------------|----------|-------------------|
| `onSubmit()` | `supabase.from('profiles').update()` | `core.profiles` | ⏳ Pending |

#### `src/app/employees/components/employee-form.tsx`
| Function/Route | Current Method | Table(s) | Replacement Status |
|----------------|----------------|----------|-------------------|
| `fetchDepartments()` | `fetch('/api/unified/departments')` | `core.departments` | ⏳ Pending |

#### `src/app/tickets/page.tsx`
| Function/Route | Current Method | Table(s) | Replacement Status |
|----------------|----------------|----------|-------------------|
| `fetchTickets()` | `supabase.from('tickets')` | `common_util.tickets` | ⏳ Pending |
| `fetchTickets()` - ticket_assignments | `supabase.from('ticket_assignments')` | `common_util.ticket_assignments` | ⏳ Pending |
| `fetchTickets()` - profiles | `supabase.from('profiles')` | `core.profiles` | ⏳ Pending |
| `createTicket()` | `supabase.from('tickets').insert()` | `common_util.tickets` | ⏳ Pending |
| `updateTicket()` | `supabase.from('tickets').update()` | `common_util.tickets` | ⏳ Pending |

#### `src/app/tickets/components/ticket-details-modal.tsx`
| Function/Route | Current Method | Table(s) | Replacement Status |
|----------------|----------------|----------|-------------------|
| `fetchTicket()` | `supabase.from('tickets')` | `common_util.tickets` | ⏳ Pending |
| `fetchTicket()` - ticket_comments | `supabase.from('ticket_comments')` | `common_util.ticket_comments` | ⏳ Pending |
| `fetchTicket()` - ticket_assignments | `supabase.from('ticket_assignments')` | `common_util.ticket_assignments` | ⏳ Pending |
| `fetchTicket()` - ticket_status_history | `supabase.from('ticket_status_history')` | `common_util.ticket_status_history` | ⏳ Pending |
| `fetchTicket()` - profiles | `supabase.from('profiles')` | `core.profiles` | ⏳ Pending |
| `updateTicket()` | `supabase.from('tickets').update()` | `common_util.tickets` | ⏳ Pending |
| `addComment()` | `supabase.from('ticket_comments').insert()` | `common_util.ticket_comments` | ⏳ Pending |
| `assignUser()` | `supabase.from('ticket_assignments').insert()` | `common_util.ticket_assignments` | ⏳ Pending |
| `removeAssignee()` | `supabase.from('ticket_assignments').delete()` | `common_util.ticket_assignments` | ⏳ Pending |
| `updateStatus()` | `supabase.from('tickets').update()` | `common_util.tickets` | ⏳ Pending |
| `updateStatus()` - ticket_status_history | `supabase.from('ticket_status_history').insert()` | `common_util.ticket_status_history` | ⏳ Pending |

#### `src/app/tickets/components/ticket-form.tsx`
| Function/Route | Current Method | Table(s) | Replacement Status |
|----------------|----------------|----------|-------------------|
| `onSubmit()` | `supabase.from('tickets').insert()` | `common_util.tickets` | ⏳ Pending |

#### `src/app/subscriptions/page.tsx`
| Function/Route | Current Method | Table(s) | Replacement Status |
|----------------|----------------|----------|-------------------|
| `fetchSubscriptions()` | `supabase.from('subscriptions')` | `common_util.subscriptions` | ⏳ Pending |

#### `src/app/calendar/page.tsx`
| Function/Route | Current Method | Table(s) | Replacement Status |
|----------------|----------------|----------|-------------------|
| `fetchEvents()` | `supabase.from('events')` | `common_util.events` | ⏳ Pending |
| `fetchEvents()` - event_participants | `supabase.from('event_participants')` | `common_util.event_participants` | ⏳ Pending |
| `createEvent()` | `supabase.from('events').insert()` | `common_util.events` | ⏳ Pending |
| `updateEvent()` | `supabase.from('events').update()` | `common_util.events` | ⏳ Pending |

#### `src/app/documents/page.tsx`
| Function/Route | Current Method | Table(s) | Replacement Status |
|----------------|----------------|----------|-------------------|
| `fetchDocuments()` | `supabase.from('documents')` | `common_util.documents` | ⏳ Pending |
| `fetchDocuments()` - document_assignments | `supabase.from('document_assignments')` | `common_util.document_assignments` | ⏳ Pending |
| `uploadDocument()` | `supabase.from('documents').insert()` | `common_util.documents` | ⏳ Pending |
| `deleteDocument()` | `supabase.from('documents').update({deleted_at})` | `common_util.documents` | ⏳ Pending |

#### `src/app/knowledge/articles/page.tsx`
| Function/Route | Current Method | Table(s) | Replacement Status |
|----------------|----------------|----------|-------------------|
| `fetchArticles()` | `supabase.from('knowledge_articles')` | `common_util.knowledge_articles` | ⏳ Pending |
| `createArticle()` | `supabase.from('knowledge_articles').insert()` | `common_util.knowledge_articles` | ⏳ Pending |
| `updateArticle()` | `supabase.from('knowledge_articles').update()` | `common_util.knowledge_articles` | ⏳ Pending |
| `deleteArticle()` | `supabase.from('knowledge_articles').update({deleted_at})` | `common_util.knowledge_articles` | ⏳ Pending |

#### `src/app/crm/leads/page.tsx`
| Function/Route | Current Method | Table(s) | Replacement Status |
|----------------|----------------|----------|-------------------|
| `fetchLeads()` | Uses `getLeads()` from `@/lib/db/leads` | `crm.leads` | ⏳ Pending |

#### `src/app/crm/leads/components/lead-details-modal.tsx`
| Function/Route | Current Method | Table(s) | Replacement Status |
|----------------|----------------|----------|-------------------|
| `fetchLead()` | Uses `getLeadById()` from `@/lib/db/leads` | `crm.leads` | ⏳ Pending |
| `fetchInteractions()` | Uses `getLeadInteractions()` from `@/lib/db/leads` | `crm.interactions` | ⏳ Pending |
| `addInteraction()` | Uses `addInteraction()` from `@/lib/db/leads` | `crm.interactions` | ⏳ Pending |
| `updateStatus()` | Uses `updateLeadStatus()` from `@/lib/db/leads` | `crm.leads`, `crm.status_history` | ⏳ Pending |

#### `src/app/crm/calls/page.tsx`
| Function/Route | Current Method | Table(s) | Replacement Status |
|----------------|----------------|----------|-------------------|
| `fetchCalls()` | `supabase.from('calls')` | `crm.calls` | ⏳ Pending |
| `createCall()` | `supabase.from('calls').insert()` | `crm.calls` | ⏳ Pending |
| `updateCall()` | `supabase.from('calls').update()` | `crm.calls` | ⏳ Pending |

#### `src/app/crm/calls/components/call-form.tsx`
| Function/Route | Current Method | Table(s) | Replacement Status |
|----------------|----------------|----------|-------------------|
| `onSubmit()` | `supabase.from('calls').insert()` | `crm.calls` | ⏳ Pending |

#### `src/app/crm/companies/page.tsx`
| Function/Route | Current Method | Table(s) | Replacement Status |
|----------------|----------------|----------|-------------------|
| `fetchCompanies()` | `supabase.from('companies')` | `core.companies` | ⏳ Pending |
| `createCompany()` | `supabase.from('companies').insert()` | `core.companies` | ⏳ Pending |
| `updateCompany()` | `supabase.from('companies').update()` | `core.companies` | ⏳ Pending |

#### `src/app/crm/contacts/page.tsx`
| Function/Route | Current Method | Table(s) | Replacement Status |
|----------------|----------------|----------|-------------------|
| `fetchContacts()` | `supabase.from('contacts')` | `core.contacts` | ⏳ Pending |
| `createContact()` | `supabase.from('contacts').insert()` | `core.contacts` | ⏳ Pending |
| `updateContact()` | `supabase.from('contacts').update()` | `core.contacts` | ⏳ Pending |

#### `src/app/crm/products/page.tsx`
| Function/Route | Current Method | Table(s) | Replacement Status |
|----------------|----------------|----------|-------------------|
| `fetchProducts()` | `supabase.from('products')` | `crm.products` | ⏳ Pending |
| `createProduct()` | `supabase.from('products').insert()` | `crm.products` | ⏳ Pending |
| `updateProduct()` | `supabase.from('products').update()` | `crm.products` | ⏳ Pending |

#### `src/app/crm/products/components/product-form.tsx`
| Function/Route | Current Method | Table(s) | Replacement Status |
|----------------|----------------|----------|-------------------|
| `onSubmit()` | `supabase.from('products').insert()` | `crm.products` | ⏳ Pending |

#### `src/app/crm/quotations/page.tsx`
| Function/Route | Current Method | Table(s) | Replacement Status |
|----------------|----------------|----------|-------------------|
| `fetchQuotations()` | `supabase.from('quotations')` | `crm.quotations` | ⏳ Pending |
| `createQuotation()` | `supabase.from('quotations').insert()` | `crm.quotations` | ⏳ Pending |
| `updateQuotation()` | `supabase.from('quotations').update()` | `crm.quotations` | ⏳ Pending |

#### `src/app/crm/quotations/components/quotation-form.tsx`
| Function/Route | Current Method | Table(s) | Replacement Status |
|----------------|----------------|----------|-------------------|
| `onSubmit()` | `supabase.from('quotations').insert()` | `crm.quotations` | ⏳ Pending |

#### `src/app/crm/opportunities/page.tsx`
| Function/Route | Current Method | Table(s) | Replacement Status |
|----------------|----------------|----------|-------------------|
| `fetchOpportunities()` | `supabase.from('opportunities')` | `crm.opportunities` | ⏳ Pending |
| `createOpportunity()` | `supabase.from('opportunities').insert()` | `crm.opportunities` | ⏳ Pending |
| `updateOpportunity()` | `supabase.from('opportunities').update()` | `crm.opportunities` | ⏳ Pending |

#### `src/app/crm/marketing-assets/page.tsx`
| Function/Route | Current Method | Table(s) | Replacement Status |
|----------------|----------------|----------|-------------------|
| `fetchAssets()` | `supabase.from('marketing_assets')` | `crm.marketing_assets` | ⏳ Pending |

### Components

#### `src/components/topbar-agents.tsx`
| Function/Route | Current Method | Table(s) | Replacement Status |
|----------------|----------------|----------|-------------------|
| `fetchAgents()` | `supabase.rpc('get_ai_agents')` | `core.ai_agents` (RPC) | ⏳ Pending |

#### `src/components/ai/agent-dock.tsx`
| Function/Route | Current Method | Table(s) | Replacement Status |
|----------------|----------------|----------|-------------------|
| `fetchAgents()` | `supabase.rpc('get_ai_agents')` | `core.ai_agents` (RPC) | ⏳ Pending |

#### `src/components/invite-user-dialog.tsx`
| Function/Route | Current Method | Table(s) | Replacement Status |
|----------------|----------------|----------|-------------------|
| `onSubmit()` | `fetch('/api/users/invite')` | `core.profiles` | ⏳ Pending |

#### `src/components/overdue-tasks-badge.tsx`
| Function/Route | Current Method | Table(s) | Replacement Status |
|----------------|----------------|----------|-------------------|
| `fetchOverdueCount()` | Uses `getOverdueTasksCount()` from `@/lib/db/tasks` | `common_util.tasks` | ⏳ Pending |

#### `src/components/sidebar-filter-dialog.tsx`
| Function/Route | Current Method | Table(s) | Replacement Status |
|----------------|----------------|----------|-------------------|
| `fetchFilters()` | `supabase.from('departments')` | `core.departments` | ⏳ Pending |

#### `src/components/vertical-switcher.tsx`
| Function/Route | Current Method | Table(s) | Replacement Status |
|----------------|----------------|----------|-------------------|
| `fetchVerticals()` | `supabase.from('verticals')` | `core.verticals` | ⏳ Pending |

#### `src/components/nav-user.tsx`
| Function/Route | Current Method | Table(s) | Replacement Status |
|----------------|----------------|----------|-------------------|
| `fetchProfile()` | `supabase.from('profiles')` | `core.profiles` | ⏳ Pending |

### Hooks

#### `src/lib/hooks/useNotifications.ts`
| Function/Route | Current Method | Table(s) | Replacement Status |
|----------------|----------------|----------|-------------------|
| `fetchNotifications()` | `supabase.from('notifications')` | `core.notifications` | ⏳ Pending |
| `markAsRead()` | `supabase.from('notifications').update()` | `core.notifications` | ⏳ Pending |
| `markAllAsRead()` | `supabase.rpc('mark_all_notifications_read')` | `core.notifications` (RPC) | ⏳ Pending |
| `deleteNotification()` | `supabase.from('notifications').update({deleted_at})` | `core.notifications` | ⏳ Pending |
| Real-time subscription | `supabase.channel().on('postgres_changes')` | `core.notifications` | ⏳ Pending |

#### `src/lib/hooks/useNotificationCount.ts`
| Function/Route | Current Method | Table(s) | Replacement Status |
|----------------|----------------|----------|-------------------|
| `fetchCount()` | `supabase.from('notifications')` | `core.notifications` | ⏳ Pending |

#### `src/lib/hooks/useAgentChat.ts`
| Function/Route | Current Method | Table(s) | Replacement Status |
|----------------|----------------|----------|-------------------|
| `fetchAgents()` | `supabase.rpc('get_ai_agents')` | `core.ai_agents` (RPC) | ⏳ Pending |

---

## 4. Scripts

### `scripts/seed-auth.ts`
| Function/Route | Current Method | Table(s) | Replacement Status |
|----------------|----------------|----------|-------------------|
| `seedRoles()` | `supabase.from('roles')` | `core.roles` | ⏳ Pending |
| `seedRoles()` - user_role_bindings | `supabase.from('user_role_bindings').insert()` | `core.user_role_bindings` | ⏳ Pending |

### `scripts/create-admin-user.ts`
| Function/Route | Current Method | Table(s) | Replacement Status |
|----------------|----------------|----------|-------------------|
| `createAdminUser()` | `supabase.from('roles')` | `core.roles` | ⏳ Pending |
| `createAdminUser()` - user_role_bindings | `supabase.from('user_role_bindings').insert()` | `core.user_role_bindings` | ⏳ Pending |
| `createAdminUser()` - permissions | `supabase.rpc('get_user_permissions')` | `core.permissions` (RPC) | ⏳ Pending |

### `scripts/auth-smoke.ts`
| Function/Route | Current Method | Table(s) | Replacement Status |
|----------------|----------------|----------|-------------------|
| `testAuth()` | `supabase.rpc('get_user_roles')` | `core.roles` (RPC) | ⏳ Pending |
| `testAuth()` | `supabase.rpc('get_allowed_modules')` | `core.modules` (RPC) | ⏳ Pending |
| `testAuth()` | `supabase.rpc('get_user_permissions')` | `core.permissions` (RPC) | ⏳ Pending |

### `scripts/assign-role.ts`
| Function/Route | Current Method | Table(s) | Replacement Status |
|----------------|----------------|----------|-------------------|
| `assignRole()` | `supabase.from('user_role_bindings')` | `core.user_role_bindings` | ⏳ Pending |

### `scripts/update-subscription-icons.ts`
| Function/Route | Current Method | Table(s) | Replacement Status |
|----------------|----------------|----------|-------------------|
| `updateIcons()` | `supabase.from('subscriptions')` | `common_util.subscriptions` | ⏳ Pending |

---

## 5. RPC Functions (Supabase Functions)

| Function/Route | Current Method | Table(s) | Replacement Status |
|----------------|----------------|----------|-------------------|
| `get_ai_agents` | `supabase.rpc('get_ai_agents')` | `core.ai_agents` | ⏳ Pending |
| `get_user_roles` | `supabase.rpc('get_user_roles')` | `core.roles`, `core.user_role_bindings` | ⏳ Pending |
| `get_allowed_modules` | `supabase.rpc('get_allowed_modules')` | `core.modules` | ⏳ Pending |
| `get_user_permissions` | `supabase.rpc('get_user_permissions')` | `core.permissions`, `core.role_permissions` | ⏳ Pending |
| `mark_all_notifications_read` | `supabase.rpc('mark_all_notifications_read')` | `core.notifications` | ⏳ Pending |

**Note:** RPC functions are database functions that may need to be recreated or replaced with Drizzle queries.

---

## 6. Real-time Subscriptions

| Function/Route | Current Method | Table(s) | Replacement Status |
|----------------|----------------|----------|-------------------|
| `useNotifications` subscription | `supabase.channel().on('postgres_changes')` | `core.notifications` | ⏳ Pending |

**Note:** Real-time subscriptions will need to be replaced with Drizzle-compatible real-time solution or kept as Supabase-only feature.

---

## Summary Statistics

### By Schema
- **core:** ~150 queries
- **crm:** ~80 queries
- **common_util:** ~120 queries
- **ops:** ~20 queries
- **ats:** ~5 queries
- **hr:** ~10 queries
- **import_ops:** ~0 queries (not yet implemented)

### By Query Type
- **SELECT:** ~250 queries
- **INSERT:** ~80 queries
- **UPDATE:** ~60 queries
- **DELETE (soft):** ~30 queries
- **RPC:** ~5 functions
- **Real-time:** ~1 subscription

### By Location
- **API Routes:** ~150 queries
- **Client Components:** ~100 queries
- **Library Functions:** ~80 queries
- **Hooks:** ~10 queries
- **Scripts:** ~10 queries

---

## Migration Priority

### High Priority (Core Functionality)
1. `src/lib/db/leads.ts` - All CRUD operations
2. `src/lib/db/tasks.ts` - All CRUD operations
3. `src/lib/db/projects.ts` - All CRUD operations
4. `src/lib/notifications/notifications.ts` - All CRUD operations
5. `src/app/api/unified/*` - All unified API routes

### Medium Priority (Feature-Specific)
1. Client-side components (`src/app/*/page.tsx`)
2. Form components (`src/app/*/components/*-form.tsx`)
3. Modal components (`src/app/*/components/*-modal.tsx`)

### Low Priority (Utilities)
1. Scripts (`scripts/*.ts`)
2. Debug pages (`src/app/debug-*`)
3. Hooks (`src/lib/hooks/*`)

---

## Notes

1. **Schema Helpers:** The `fromCore()`, `fromCrm()`, etc. helpers are wrappers around Supabase but still use Supabase client. These should be replaced with Drizzle schema-aware queries.

2. **Public Views:** Some queries use public schema views (e.g., `from('tasks')` instead of `schema('common_util').from('tasks')`). These may need special handling.

3. **RPC Functions:** Database functions called via `supabase.rpc()` will need to be either:
   - Recreated as Drizzle-compatible functions
   - Replaced with equivalent Drizzle queries
   - Kept as Supabase-only if they're complex stored procedures

4. **Real-time:** Supabase real-time subscriptions will need a migration strategy (possibly keep Supabase for real-time, use Drizzle for queries).

5. **Cross-Schema Joins:** Many queries fetch related data from multiple schemas separately due to PostgREST limitations. Drizzle can handle these more efficiently with proper joins.

---

**Last Updated:** 2025-01-27  
**Next Steps:** Prioritize migration of core database libraries, then API routes, then client components.


