// CRM Leads Types
// Company OS: Type definitions for CRM leads module

export type LeadStatus =
  | 'new'
  | 'contacted'
  | 'qualified'
  | 'proposal'
  | 'negotiation'
  | 'won'
  | 'lost'

export type LeadSource = 'website' | 'referral' | 'cold_call' | 'event' | 'social' | 'other'

export type InteractionType = 'call' | 'email' | 'meeting' | 'note' | 'task'

export interface Lead {
  id: string
  contact_id: string | null
  company_id: string | null
  owner_id: string | null
  status: LeadStatus
  source: string | null
  value: number | null
  probability: number | null
  expected_close_date: string | null
  notes: string | null
  tags: string[] | null
  meta: Record<string, any> | null
  created_at: string
  updated_at: string
  created_by: string | null
  deleted_at: string | null
}

export interface LeadFull extends Lead {
  contact: {
    id: string
    name: string
    email: string | null
    phone: string | null
  } | null
  company: {
    id: string
    name: string
    website: string | null
    industry: string | null
  } | null
  owner: {
    id: string
    first_name: string | null
    last_name: string | null
    email: string | null
    avatar_url: string | null
  } | null
  interactions_count?: number
  last_interaction_at?: string | null
  last_call_date?: string | null
}

export interface Interaction {
  id: string
  entity_type: string
  entity_id: string
  type: InteractionType
  subject: string | null
  notes: string | null
  scheduled_at: string | null
  duration_minutes: number | null
  outcome: string | null
  meta: Record<string, any> | null
  created_at: string
  created_by: string | null
  deleted_at: string | null
  created_by_profile?: {
    id: string
    first_name: string | null
    last_name: string | null
    email: string | null
    avatar_url: string | null
  } | null
}

export interface StatusHistoryEntry {
  id: string
  lead_id: string
  status: LeadStatus
  previous_status: string | null
  notes: string | null
  created_at: string
  created_by: string | null
  created_by_profile?: {
    id: string
    first_name: string | null
    last_name: string | null
    email: string | null
  } | null
}

export interface Opportunity {
  id: string
  lead_id: string
  pipeline_id: string | null
  stage_id: string | null
  created_at: string
  updated_at: string
  created_by: string | null
  deleted_at: string | null
  pipeline?: {
    id: string
    name: string
  } | null
  stage?: {
    id: string
    name: string
    order_no: number
  } | null
}

export interface Pipeline {
  id: string
  name: string
  description: string | null
  is_default: boolean
  created_at: string
  updated_at: string
  created_by: string | null
  deleted_at: string | null
  stages?: Stage[]
}

export interface Stage {
  id: string
  pipeline_id: string
  name: string
  order_no: number
  description: string | null
  created_at: string
  updated_at: string
}

export interface LeadFilters {
  status?: LeadStatus[]
  owner_id?: string[]
  source?: string[]
  date_from?: string
  date_to?: string
  value_min?: number
  value_max?: number
  tags?: string[]
  search?: string
}

export interface LeadSort {
  field: 'created_at' | 'updated_at' | 'value' | 'status' | 'expected_close_date'
  direction: 'asc' | 'desc'
}

export interface CreateLeadInput {
  contact_id?: string | null
  company_id?: string | null
  owner_id?: string | null
  status?: LeadStatus
  source?: string | null
  value?: number | null
  probability?: number | null
  expected_close_date?: string | null
  notes?: string | null
  tags?: string[] | null
  meta?: Record<string, any> | null
}

export interface UpdateLeadInput extends Partial<CreateLeadInput> {
  id: string
}

export interface CreateInteractionInput {
  entity_type: string
  entity_id: string
  type: InteractionType
  subject?: string | null
  notes?: string | null
  scheduled_at?: string | null
  duration_minutes?: number | null
  outcome?: string | null
  meta?: Record<string, any> | null
}

export interface UpdateLeadStatusInput {
  lead_id: string
  status: LeadStatus
  notes?: string | null
}
