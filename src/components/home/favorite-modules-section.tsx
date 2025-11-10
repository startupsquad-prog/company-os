'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { QuickLink } from './types'
import { quickLinks } from '@/lib/home/quick-links-data'
import { Star, Clock } from 'lucide-react'
import { QuickLinkCard } from './quick-link-card'

// Mock favorite modules (most visited)
const favoriteModuleIds = ['tasks', 'messages', 'crm/leads', 'mail', 'dashboard', 'users']

export function FavoriteModulesSection() {
  const favoriteModules = quickLinks.filter((link) => favoriteModuleIds.includes(link.id))

  return (
    <Card className="mb-8">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Star className="h-5 w-5 text-amber-500 fill-amber-500" />
            <CardTitle>Favorite Modules</CardTitle>
          </div>
          <span className="text-xs text-muted-foreground">Most visited</span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {favoriteModules.map((link) => (
            <QuickLinkCard key={link.id} link={link} />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

