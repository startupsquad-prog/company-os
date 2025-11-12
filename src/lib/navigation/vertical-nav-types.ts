import type { LucideIcon } from 'lucide-react'

/**
 * Navigation item structure matching NavMain component
 */
export interface VerticalNavItem {
  title: string
  url: string
  icon?: string | LucideIcon // Icon name (string) or LucideIcon component
  isActive?: boolean
  comingSoon?: boolean
  soon?: boolean // Alias for comingSoon
  items?: {
    title: string
    url: string
    comingSoon?: boolean
    soon?: boolean // Alias for comingSoon
  }[]
}

/**
 * Navigation group structure matching NavMain component
 */
export interface VerticalNavGroup {
  label: string
  items: VerticalNavItem[]
}

/**
 * Complete vertical navigation configuration
 */
export interface VerticalNavConfig {
  topbarTitle: string
  basePath: string
  planBadge?: 'free' | 'pro' | 'enterprise'
  sections: VerticalNavGroup[]
}

