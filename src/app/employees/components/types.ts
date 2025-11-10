export interface Employee {
  id: string
  employee_id?: string | null
  profile_id: string
  status: 'active' | 'onboarding' | 'resigned'
  hire_date?: string | null
  termination_date?: string | null
  first_name: string
  last_name: string
  email: string
  phone?: string | null
  avatar_url?: string | null
  department?: {
    id: string
    name: string
  } | null
  created_at: string
  updated_at: string
}

export interface EmployeeStats {
  total: number
  active: number
  onboarding: number
  resigned: number
}

