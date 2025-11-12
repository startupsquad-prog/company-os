import type { Profile } from './supabase'

// Extended User type with roles and department
export interface UserFull extends Profile {
  roles: {
    id: string
    name: string
    description: string | null
  }[]
  department: {
    id: string
    name: string
  } | null
  clerk_user_id: string // user_id from profiles
}

// User table response for pagination
export interface UserTableResponse {
  users: UserFull[]
  pagination: {
    page: number
    pageSize: number
    totalPages: number
    totalCount: number
  }
}

// User filters
export interface UserFilters {
  search?: string
  role?: string[]
  department?: string[]
}

// User form data for create/update
export interface UserFormData {
  first_name: string
  last_name: string
  email: string
  phone?: string
  department_id?: string
  role_ids: string[] // Multiple roles can be assigned
}








