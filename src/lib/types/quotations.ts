// CRM Quotations Types
export type QuotationStatus = 'draft' | 'sent' | 'viewed' | 'accepted' | 'rejected' | 'expired' | 'cancelled'

export interface Quotation {
  id: string
  lead_id: string
  quote_number: string
  title: string | null
  description: string | null
  total_amount: number
  currency: string | null
  tax_amount: number | null
  discount_amount: number | null
  status: QuotationStatus | null
  valid_until: string | null
  items: any[] | null
  terms: string | null
  notes: string | null
  pdf_url: string | null
  meta: Record<string, any> | null
  created_at: string
  updated_at: string
  created_by: string | null
  deleted_at: string | null
}

export interface QuotationFull extends Quotation {
  lead?: {
    id: string
    contact?: {
      name: string
      email: string | null
    } | null
  } | null
}

export interface QuotationFormData {
  lead_id: string
  quote_number: string
  title?: string
  description?: string
  total_amount: number
  currency?: string
  tax_amount?: number
  discount_amount?: number
  status?: QuotationStatus
  valid_until?: string
  items?: any[]
  terms?: string
  notes?: string
}

