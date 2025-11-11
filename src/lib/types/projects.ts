import type {
  Project,
  ProjectInsert,
  ProjectUpdate,
  ProjectWithRelations,
  ProjectMember,
  ProjectStatusHistory,
  Profile,
  TaskWithRelations,
} from './supabase'

// Re-export base types
export type {
  Project,
  ProjectInsert,
  ProjectUpdate,
  ProjectWithRelations,
  ProjectMember,
  ProjectStatusHistory,
}

// Extended Project type with all relations for UI
export type ProjectFull = ProjectWithRelations & {
  tasks?: TaskWithRelations[] // Tasks in this project
  progress?: number // Computed progress percentage (0-100)
  total_tasks?: number // Total number of tasks
  completed_tasks?: number // Number of completed tasks
}

// Project filter type
export interface ProjectFilter {
  status?: string[]
  category?: string[]
  department_id?: string[]
  vertical_key?: string
  assigned_to?: string[] // profile_ids
  created_by?: string[] // profile_ids
  due_date_from?: Date
  due_date_to?: Date
  search?: string
}

// Project form data type
export interface ProjectFormData {
  name: string
  description?: string
  category?: string
  status?: string
  start_date?: Date
  due_date?: Date
  department_id?: string
  vertical_key?: string
  members?: { profile_id: string; role: 'owner' | 'collaborator' | 'watcher' }[]
}

