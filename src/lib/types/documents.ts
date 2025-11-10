// Common Util Documents Types
export type DocumentStatus = 'active' | 'archived' | 'deleted'

export interface Document {
  id: string
  title: string
  description: string | null
  file_name: string
  file_url: string
  file_size: number | null
  mime_type: string | null
  category: string | null
  status: DocumentStatus | null
  download_count: number | null
  view_count: number | null
  meta: Record<string, any> | null
  created_at: string
  updated_at: string
  created_by: string | null
  deleted_at: string | null
}

export interface DocumentFull extends Document {
  created_by_profile?: {
    id: string
    first_name: string | null
    last_name: string | null
  } | null
}

export interface DocumentFormData {
  title: string
  description?: string
  file_name: string
  file_url: string
  file_size?: number
  mime_type?: string
  category?: string
  status?: DocumentStatus
}

