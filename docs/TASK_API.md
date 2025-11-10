# Task Management API Documentation

## Overview

This document describes the Task Management API endpoints and database helpers for the Company OS platform.

## Setup Requirements

### Supabase Configuration

Custom schemas (`core`, `common_util`) need to be exposed in Supabase PostgREST configuration:

1. Go to Supabase Dashboard → Settings → API
2. Add schemas to `db.extra_search_path` or configure PostgREST to expose them
3. Alternatively, create views in the `public` schema that reference the custom schemas

**Note:** The current implementation uses qualified table names (`core.profiles`, `common_util.tasks`) which requires proper PostgREST configuration.

## API Endpoints

### GET /api/tasks

Get tasks with optional filters.

**Query Parameters:**

- `status` - Filter by task status
- `priority` - Filter by priority
- `department_id` - Filter by department
- `vertical_key` - Filter by vertical
- `assigned_to` - Filter by assigned profile ID
- `created_by` - Filter by creator profile ID
- `due_date_from` - Filter tasks due after this date
- `due_date_to` - Filter tasks due before this date

**Response:**

```json
{
  "data": [
    {
      "id": "uuid",
      "title": "string",
      "description": "string",
      "priority": "low|medium|high|urgent",
      "status": "pending|in_progress|completed|cancelled",
      "assignees": [...],
      "latest_status": {...},
      "department": {...},
      "created_by_profile": {...},
      "updated_by_profile": {...}
    }
  ]
}
```

### POST /api/tasks

Create a new task.

**Request Body:**

```json
{
  "title": "string (required)",
  "description": "string",
  "priority": "low|medium|high|urgent",
  "status": "pending|in_progress|completed|cancelled",
  "department_id": "uuid",
  "vertical_key": "string",
  "due_date": "ISO 8601 timestamp"
}
```

**Response:**

```json
{
  "data": {
    "id": "uuid",
    "title": "string",
    ...
  }
}
```

### GET /api/tasks/[id]

Get a single task by ID.

**Response:**

```json
{
  "data": {
    "id": "uuid",
    "title": "string",
    "assignees": [...],
    "latest_status": {...},
    ...
  }
}
```

### PATCH /api/tasks/[id]

Update a task.

**Request Body:**

```json
{
  "title": "string",
  "description": "string",
  "priority": "low|medium|high|urgent",
  "status": "pending|in_progress|completed|cancelled",
  "department_id": "uuid",
  "vertical_key": "string",
  "due_date": "ISO 8601 timestamp"
}
```

### POST /api/tasks/[id]/comments

Add a comment to a task.

**Request Body:**

```json
{
  "body": "string (required)"
}
```

### POST /api/tasks/[id]/assign

Assign a user to a task.

**Request Body:**

```json
{
  "profile_id": "uuid (required)",
  "role": "owner|collaborator|watcher (default: collaborator)"
}
```

## Database Helpers

Located in `src/lib/db/tasks.ts`:

- `getTasks(filter)` - Get tasks with filters
- `getTaskById(id)` - Get single task with relations
- `createTask(data)` - Create new task
- `updateTask(id, data)` - Update task
- `addComment(taskId, body)` - Add comment
- `assignUser(taskId, profileId, role)` - Assign user

## RBAC & RLS

All endpoints respect Supabase Row Level Security (RLS) policies:

- **Employees**: Can read/write own tasks + assigned tasks
- **Managers**: Can read/write all tasks in their department
- **Admins/Superadmins**: Full access to all tasks

## Activity Logging

All write operations are automatically logged to `core.activity_events`:

- Task creation
- Task updates
- Comment additions
- User assignments

## Status History

Task status changes are automatically logged to `common_util.task_status_history` via database trigger.
