import { type LucideIcon } from 'lucide-react'

export interface QuickLink {
  id: string
  title: string
  description: string
  url: string
  icon: LucideIcon
  category: string
  color: string // Gradient color class
  comingSoon?: boolean
}

export interface AIAgent {
  id: string
  name: string
  description: string
  category: string
  icon: LucideIcon // Lucide icon component
  color: string // Gradient color class
}

export interface KPI {
  id: string
  title: string
  value: number | string
  change?: number // Percentage change
  trend?: 'up' | 'down' | 'neutral'
  icon: LucideIcon
  subtitle?: string
  color?: string
}

export interface RecentActivity {
  id: string
  type: 'task' | 'lead' | 'message' | 'file' | 'status' | 'user'
  title: string
  description: string
  user?: {
    name: string
    avatar?: string
  }
  timestamp: string
  url?: string
}

