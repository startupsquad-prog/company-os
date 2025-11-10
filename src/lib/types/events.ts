// Common Util Events Types
export type EventType = 'meeting' | 'call' | 'task' | 'reminder' | 'other'
export type EventStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled'

export interface Event {
  id: string
  title: string
  description: string | null
  event_type: EventType | null
  start_time: string
  end_time: string
  all_day: boolean | null
  location: string | null
  organizer_id: string
  lead_id: string | null
  status: EventStatus | null
  reminder_minutes: number[] | null
  meta: Record<string, any> | null
  created_at: string
  updated_at: string
  created_by: string | null
  deleted_at: string | null
}

export interface EventFull extends Event {
  organizer?: {
    id: string
    first_name: string | null
    last_name: string | null
  } | null
  participants?: Array<{
    id: string
    profile: {
      id: string
      first_name: string | null
      last_name: string | null
    }
    status: string
  }>
}

export interface EventFormData {
  title: string
  description?: string
  event_type?: EventType
  start_time: string
  end_time: string
  all_day?: boolean
  location?: string
  organizer_id: string
  lead_id?: string
  status?: EventStatus
  reminder_minutes?: number[]
}

