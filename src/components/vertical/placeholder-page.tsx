'use client'

import { type LucideIcon } from 'lucide-react'
import { ComingSoonBadge } from '@/components/coming-soon-badge'
import { getIcon } from '@/lib/navigation/icon-map'

interface PlaceholderPageProps {
  title: string
  description?: string
  icon?: string | LucideIcon
  comingSoon?: boolean
}

export function PlaceholderPage({ title, description, icon, comingSoon = true }: PlaceholderPageProps) {
  // Resolve icon (string name or LucideIcon component)
  const IconComponent = typeof icon === 'string' ? getIcon(icon) : icon

  return (
    <div className="flex flex-1 flex-col min-w-0 h-full overflow-hidden">
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
          {comingSoon && <ComingSoonBadge />}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="text-center py-12 text-muted-foreground">
          {IconComponent && <IconComponent className="h-12 w-12 mx-auto mb-4 opacity-50" />}
          <p className="text-base font-medium">{title}</p>
          {description && <p className="text-sm mt-2">{description}</p>}
          {!description && <p className="text-sm mt-2">Database schema and RLS policies are ready</p>}
        </div>
      </div>
    </div>
  )
}

