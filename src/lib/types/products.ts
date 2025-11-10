// CRM Products Types
// Company OS: Type definitions for CRM products module

export interface Product {
  id: string
  name: string
  sku: string | null
  description: string | null
  category: string | null
  brand: string | null
  supplier_id: string | null
  manufacturer_id: string | null
  base_price: number | null
  currency: string | null
  cost_price: number | null
  image_url: string | null
  images: string[] | null
  tags: string[] | null
  meta: Record<string, any> | null
  is_active: boolean | null
  created_at: string
  updated_at: string
  created_by: string | null
  deleted_at: string | null
}

export interface ProductFull extends Product {
  supplier?: {
    id: string
    name: string
    email: string | null
  } | null
  manufacturer?: {
    id: string
    name: string
    industry: string | null
  } | null
}

export interface ProductFormData {
  name: string
  sku?: string
  description?: string
  category?: string
  brand?: string
  supplier_id?: string
  manufacturer_id?: string
  base_price?: number
  currency?: string
  cost_price?: number
  image_url?: string
  tags?: string[]
  is_active?: boolean
}

