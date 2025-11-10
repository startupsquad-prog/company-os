export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  core: {
    Tables: {
      profiles: {
        Row: {
          id: string
          user_id: string
          first_name: string | null
          last_name: string | null
          email: string | null
          phone: string | null
          department_id: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
          created_by: string | null
          deleted_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          first_name?: string | null
          last_name?: string | null
          email?: string | null
          phone?: string | null
          department_id?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
          deleted_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          first_name?: string | null
          last_name?: string | null
          email?: string | null
          phone?: string | null
          department_id?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
          deleted_at?: string | null
        }
      }
      departments: {
        Row: {
          id: string
          name: string
          description: string | null
          created_at: string
          updated_at: string
          created_by: string | null
          deleted_at: string | null
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
          deleted_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
          deleted_at?: string | null
        }
      }
      activity_events: {
        Row: {
          id: string
          entity_type: string
          entity_id: string
          action: string
          metadata: Json | null
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          entity_type: string
          entity_id: string
          action: string
          metadata?: Json | null
          created_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          entity_type?: string
          entity_id?: string
          action?: string
          metadata?: Json | null
          created_by?: string | null
          created_at?: string
        }
      }
    }
  }
  common_util: {
    Tables: {
      tasks: {
        Row: {
          id: string
          title: string
          description: string | null
          priority: string | null
          status: string | null
          department_id: string | null
          vertical_key: string | null
          due_date: string | null
          created_by: string | null
          updated_by: string | null
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          priority?: string | null
          status?: string | null
          department_id?: string | null
          vertical_key?: string | null
          due_date?: string | null
          created_by?: string | null
          updated_by?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          priority?: string | null
          status?: string | null
          department_id?: string | null
          vertical_key?: string | null
          due_date?: string | null
          created_by?: string | null
          updated_by?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
      }
      task_assignees: {
        Row: {
          id: string
          task_id: string
          profile_id: string
          role: 'owner' | 'collaborator' | 'watcher'
          created_at: string
        }
        Insert: {
          id?: string
          task_id: string
          profile_id: string
          role?: 'owner' | 'collaborator' | 'watcher'
          created_at?: string
        }
        Update: {
          id?: string
          task_id?: string
          profile_id?: string
          role?: 'owner' | 'collaborator' | 'watcher'
          created_at?: string
        }
      }
      task_comments: {
        Row: {
          id: string
          task_id: string
          author_id: string
          body: string
          created_at: string
        }
        Insert: {
          id?: string
          task_id: string
          author_id: string
          body: string
          created_at?: string
        }
        Update: {
          id?: string
          task_id?: string
          author_id?: string
          body?: string
          created_at?: string
        }
      }
      task_status_history: {
        Row: {
          id: string
          task_id: string
          from_status: string | null
          to_status: string
          changed_by: string | null
          changed_at: string
        }
        Insert: {
          id?: string
          task_id: string
          from_status?: string | null
          to_status: string
          changed_by?: string | null
          changed_at?: string
        }
        Update: {
          id?: string
          task_id?: string
          from_status?: string | null
          to_status?: string
          changed_by?: string | null
          changed_at?: string
        }
      }
    }
  }
}

// Helper types
export type Task = Database['common_util']['Tables']['tasks']['Row']
export type TaskInsert = Database['common_util']['Tables']['tasks']['Insert']
export type TaskUpdate = Database['common_util']['Tables']['tasks']['Update']

export type TaskAssignee = Database['common_util']['Tables']['task_assignees']['Row']
export type TaskAssigneeInsert = Database['common_util']['Tables']['task_assignees']['Insert']

export type TaskComment = Database['common_util']['Tables']['task_comments']['Row']
export type TaskCommentInsert = Database['common_util']['Tables']['task_comments']['Insert']

export type TaskStatusHistory = Database['common_util']['Tables']['task_status_history']['Row']

export type Profile = Database['core']['Tables']['profiles']['Row']
export type ActivityEventInsert = Database['core']['Tables']['activity_events']['Insert']

// Expanded types with relations
export type TaskWithRelations = Task & {
  assignees: (TaskAssignee & { profile: Profile })[]
  latest_status: TaskStatusHistory | null
  department: Database['core']['Tables']['departments']['Row'] | null
  created_by_profile: Profile | null
  updated_by_profile: Profile | null
}
