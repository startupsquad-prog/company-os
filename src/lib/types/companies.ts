// CRM Companies Types
// Company OS: Type definitions for CRM companies module

export interface Company {
  id: string
  name: string
  legal_name: string | null
  tax_id: string | null
  website: string | null
  industry: string | null
  notes: string | null
  created_at: string
  updated_at: string
  created_by: string | null
  deleted_at: string | null
}

export interface CompanyFull extends Company {
  contacts?: {
    id: string
    name: string
    email: string | null
    phone: string | null
  }[]
}

export interface CompanyFormData {
  name: string
  legal_name?: string
  tax_id?: string
  website?: string
  industry?: string
  notes?: string
}

