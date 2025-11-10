// CRM Opportunities Types
export interface Opportunity {
  id: string
  lead_id: string
  pipeline_id: string | null
  stage_id: string | null
  created_at: string
  updated_at: string
  created_by: string | null
  deleted_at: string | null
}

export interface OpportunityFull extends Opportunity {
  lead?: {
    id: string
    contact?: {
      name: string
      email: string | null
    } | null
    company?: {
      name: string
    } | null
    status: string
    value: number | null
  } | null
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

export interface OpportunityFormData {
  lead_id: string
  pipeline_id?: string
  stage_id?: string
}

