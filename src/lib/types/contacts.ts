// CRM Contacts Types
// Company OS: Type definitions for CRM contacts module

export type ContactType = 'person' | 'organization'

export interface Contact {
  id: string
  name: string
  email: string | null
  phone: string | null
  contact_type: ContactType | null
  notes: string | null
  created_at: string
  updated_at: string
  created_by: string | null
  deleted_at: string | null
}

export interface ContactFull extends Contact {
  companies?: {
    id: string
    name: string
    industry: string | null
  }[]
}

export interface ContactFormData {
  name: string
  email?: string
  phone?: string
  contact_type?: ContactType
  notes?: string
}

