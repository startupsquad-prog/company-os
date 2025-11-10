// Common Util Tickets Types
export type TicketStatus = 'new' | 'open' | 'in_progress' | 'waiting' | 'resolved' | 'closed' | 'cancelled'
export type TicketPriority = 'low' | 'medium' | 'high' | 'critical'

export interface Ticket {
  id: string
  ticket_number: string
  title: string
  description: string | null
  client_id: string | null
  client_email: string | null
  client_name: string | null
  status: TicketStatus | null
  priority: TicketPriority | null
  category: string | null
  assignee_id: string | null
  due_date: string | null
  resolution: string | null
  resolved_at: string | null
  resolved_by: string | null
  meta: Record<string, any> | null
  created_at: string
  updated_at: string
  created_by: string | null
  deleted_at: string | null
}

export interface TicketFull extends Ticket {
  client?: {
    id: string
    name: string
    email: string | null
  } | null
  assignee?: {
    id: string
    first_name: string | null
    last_name: string | null
  } | null
}

export interface TicketFormData {
  title: string
  description?: string
  client_id?: string
  client_email?: string
  client_name?: string
  status?: TicketStatus
  priority?: TicketPriority
  category?: string
  assignee_id?: string
  due_date?: string
}

