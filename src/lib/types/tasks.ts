import type {
  Task,
  TaskInsert,
  TaskUpdate,
  TaskWithRelations,
  TaskAssignee,
  TaskComment,
  TaskStatusHistory,
  Profile,
} from './supabase'

// Re-export base types
export type {
  Task,
  TaskInsert,
  TaskUpdate,
  TaskWithRelations,
  TaskAssignee,
  TaskComment,
  TaskStatusHistory,
}

// Extended Task type with all relations for UI
export type TaskFull = TaskWithRelations & {
  comments: (TaskComment & { author: Profile })[]
  status_history: (TaskStatusHistory & { changed_by_profile: Profile | null })[]
  urgency_tag?: 'overdue' | 'expiring_soon' | null // Computed field for quick filtering
}

// Task filter type
export interface TaskFilter {
  status?: string[]
  priority?: string[]
  department_id?: string[]
  vertical_key?: string
  assigned_to?: string[] // profile_ids
  created_by?: string[] // profile_ids
  due_date_from?: Date
  due_date_to?: Date
  urgency_tag?: string[] // 'overdue' | 'expiring_soon'
  search?: string
}

// Task form data type
export interface TaskFormData {
  title: string
  description?: string
  priority?: string
  status?: string
  department_id?: string
  vertical_key?: string
  project_id?: string
  due_date?: Date
  estimated_duration?: number // Duration in minutes
  important_links?: Array<{ url: string; label: string }>
  assignees?: { profile_id: string; role: 'owner' | 'collaborator' | 'watcher' }[]
}
