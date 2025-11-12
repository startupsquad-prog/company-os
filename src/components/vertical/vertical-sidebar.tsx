'use client'

import { usePathname } from 'next/navigation'
import { NavMain } from '@/components/nav-main'
import { getIcon } from '@/lib/navigation/icon-map'
import type { VerticalNavConfig, VerticalNavGroup, VerticalNavItem } from '@/lib/navigation/vertical-nav-types'
import type { LucideIcon } from 'lucide-react'

interface VerticalSidebarProps {
  config: VerticalNavConfig
}

export function VerticalSidebar({ config }: VerticalSidebarProps) {
  const pathname = usePathname()

  // Convert VerticalNavConfig to NavMain-compatible format
  const navGroups = config.sections.map((section: VerticalNavGroup) => ({
    label: section.label,
    items: section.items.map((item: VerticalNavItem) => {
      // Resolve icon (string name or LucideIcon component)
      const icon = typeof item.icon === 'string' ? getIcon(item.icon) : item.icon

      // Check if item is active (matches current pathname)
      const isActive = pathname === item.url || pathname.startsWith(item.url + '/')

      // Handle comingSoon/soon alias
      const comingSoon = item.comingSoon ?? item.soon ?? false

      return {
        title: item.title,
        url: item.url,
        icon,
        isActive,
        comingSoon,
        items: item.items?.map((subItem) => ({
          title: subItem.title,
          url: subItem.url,
          comingSoon: subItem.comingSoon ?? subItem.soon ?? false,
        })),
      }
    }),
  }))

  return <NavMain groups={navGroups} />
}

