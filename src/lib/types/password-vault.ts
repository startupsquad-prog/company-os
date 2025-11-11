// Password Vault Types
// Company OS: Type definitions for password vault module

export interface Password {
  id: string
  title: string
  username: string | null
  password_encrypted: string
  url: string | null
  category: string | null
  company_id: string | null
  notes: string | null
  tags: string[] | null
  is_favorite: boolean | null
  last_accessed_at: string | null
  created_at: string
  updated_at: string
  created_by: string | null
  deleted_at: string | null
}

export interface PasswordFull extends Password {
  company?: {
    id: string
    name: string
    industry: string | null
  } | null
}

export interface PasswordFormData {
  title: string
  username?: string
  password?: string // Plain text for form input
  url?: string
  category?: string
  company_id?: string
  notes?: string
  tags?: string[]
  is_favorite?: boolean
}

export interface Card {
  id: string
  title: string
  cardholder_name: string | null
  card_number_encrypted: string
  expiry_month: number | null
  expiry_year: number | null
  cvv_encrypted: string | null
  card_type: 'debit' | 'credit' | null
  bank_name: string
  billing_address: string | null
  category: string | null
  company_id: string | null
  notes: string | null
  tags: string[] | null
  is_favorite: boolean | null
  last_accessed_at: string | null
  created_at: string
  updated_at: string
  created_by: string | null
  deleted_at: string | null
}

export interface CardFull extends Card {
  company?: {
    id: string
    name: string
    industry: string | null
  } | null
}

export interface CardFormData {
  title: string
  cardholder_name?: string
  card_number?: string // Plain text for form input
  expiry_month?: number
  expiry_year?: number
  cvv?: string // Plain text for form input
  card_type?: 'debit' | 'credit'
  bank_name: string
  billing_address?: string
  category?: string
  company_id?: string
  notes?: string
  tags?: string[]
  is_favorite?: boolean
}

export interface Document {
  id: string
  title: string
  document_type: 'passport' | 'license' | 'certificate' | 'contract' | 'other' | null
  document_number_encrypted: string | null
  issuer: string | null
  issue_date: string | null
  expiry_date: string | null
  file_url: string | null
  file_name: string | null
  category: string | null
  company_id: string | null
  notes: string | null
  tags: string[] | null
  is_favorite: boolean | null
  last_accessed_at: string | null
  created_at: string
  updated_at: string
  created_by: string | null
  deleted_at: string | null
}

export interface DocumentFull extends Document {
  company?: {
    id: string
    name: string
    industry: string | null
  } | null
}

export interface DocumentFormData {
  title: string
  document_type?: 'passport' | 'license' | 'certificate' | 'contract' | 'other'
  document_number?: string // Plain text for form input
  issuer?: string
  issue_date?: string
  expiry_date?: string
  file_url?: string
  file_name?: string
  category?: string
  company_id?: string
  notes?: string
  tags?: string[]
  is_favorite?: boolean
}

