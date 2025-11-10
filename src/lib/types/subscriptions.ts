// Common Util Subscriptions Types
export type BillingCycle = 'monthly' | 'quarterly' | 'yearly' | 'one_time'
export type SubscriptionStatus = 'active' | 'expired' | 'cancelled' | 'pending' | 'trial'
export type AutoRenewalStatus = 'enabled' | 'disabled' | 'cancelled'

export interface Subscription {
  id: string
  subscription_name: string
  vendor_id: string | null
  vendor_name: string | null
  plan_tier: string | null
  cost_per_period: number | null
  cost_per_user: number | null
  billing_cycle: BillingCycle | null
  currency: string | null
  auto_renewal_status: AutoRenewalStatus | null
  owner_id: string | null
  team_id: string | null
  start_date: string | null
  expiry_date: string | null
  renewal_date: string | null
  status: SubscriptionStatus | null
  number_of_users: number | null
  portal_url: string | null
  category: string | null
  notes: string | null
  credentials_encrypted: Record<string, any> | null
  meta: Record<string, any> | null
  created_at: string
  updated_at: string
  created_by: string | null
  deleted_at: string | null
}

export interface SubscriptionFull extends Subscription {
  vendor?: {
    id: string
    name: string
  } | null
  owner?: {
    id: string
    first_name: string | null
    last_name: string | null
  } | null
}

export interface SubscriptionFormData {
  subscription_name: string
  vendor_id?: string
  vendor_name?: string
  plan_tier?: string
  cost_per_period?: number
  cost_per_user?: number
  billing_cycle?: BillingCycle
  currency?: string
  auto_renewal_status?: AutoRenewalStatus
  owner_id?: string
  team_id?: string
  start_date?: string
  expiry_date?: string
  renewal_date?: string
  status?: SubscriptionStatus
  number_of_users?: number
  category?: string
  notes?: string
}

