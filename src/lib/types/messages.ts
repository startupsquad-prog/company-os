// Common Util Messages Types
export type MessageType = 'text' | 'file' | 'system'
export type ThreadType = 'direct' | 'group' | 'lead'

export interface MessageThread {
  id: string
  subject: string | null
  thread_type: ThreadType | null
  lead_id: string | null
  last_message_at: string | null
  created_at: string
  updated_at: string
  created_by: string | null
  deleted_at: string | null
}

export interface Message {
  id: string
  thread_id: string
  sender_id: string
  content: string
  message_type: MessageType | null
  file_url: string | null
  file_name: string | null
  file_size: number | null
  is_edited: boolean | null
  edited_at: string | null
  meta: Record<string, any> | null
  created_at: string
  deleted_at: string | null
}

export interface MessageThreadFull extends MessageThread {
  participants?: Array<{
    id: string
    profile: {
      id: string
      first_name: string | null
      last_name: string | null
    }
    last_read_at: string | null
  }>
  last_message?: {
    id: string
    content: string
    sender_id: string
    created_at: string
  } | null
  unread_count?: number
}

export interface MessageFull extends Message {
  sender?: {
    id: string
    first_name: string | null
    last_name: string | null
  } | null
}

