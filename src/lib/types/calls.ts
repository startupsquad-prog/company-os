// CRM Calls Types
export type CallType = 'inbound' | 'outbound' | 'missed'
export type CallDirection = 'incoming' | 'outgoing'
export type CallStatus = 'completed' | 'no_answer' | 'busy' | 'failed' | 'cancelled'

export interface Call {
  id: string
  lead_id: string | null
  contact_id: string | null
  caller_id: string | null
  call_type: CallType
  direction: CallDirection | null
  phone_number: string | null
  duration_seconds: number | null
  status: CallStatus | null
  outcome: string | null
  subject: string | null
  notes: string | null
  recording_url: string | null
  scheduled_at: string | null
  started_at: string | null
  ended_at: string | null
  meta: Record<string, any> | null
  created_at: string
  updated_at: string
  created_by: string | null
  deleted_at: string | null
}

export interface CallFull extends Call {
  contact?: {
    id: string
    name: string
    phone: string | null
    email: string | null
  } | null
  lead?: {
    id: string
    contact?: {
      name: string
      phone: string | null
      email: string | null
    } | null
  } | null
  caller?: {
    id: string
    first_name: string | null
    last_name: string | null
    email: string | null
    phone: string | null
    avatar_url: string | null
  } | null
  meta?: {
    transcription?: {
      raw?: string
      conversational?: string
    }
    ai_feedback?: {
      sentiment?: string
      key_points?: string[]
      action_items?: string[]
      satisfaction_rating?: number
      professionalism_rating?: number
      responsiveness_rating?: number
      overall_rating?: number
      call_quality?: string
      customer_interest?: string
      next_steps?: string
    }
  } | null
}

export interface CallFormData {
  lead_id?: string
  contact_id?: string
  caller_id?: string
  call_type: CallType
  direction?: CallDirection
  phone_number?: string
  duration_seconds?: number
  status?: CallStatus
  outcome?: string
  subject?: string
  notes?: string
  scheduled_at?: string
  started_at?: string
  ended_at?: string
}

