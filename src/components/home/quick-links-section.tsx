'use client'

import { useMemo, useState } from 'react'
import { QuickLinkCard } from './quick-link-card'
import { quickLinks } from '@/lib/home/quick-links-data'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'

export function QuickLinksSection() {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredLinks = useMemo(() => {
    if (!searchQuery.trim()) {
      return quickLinks
    }

    const query = searchQuery.toLowerCase()
    return quickLinks.filter(
      (link) =>
        link.title.toLowerCase().includes(query) ||
        link.description.toLowerCase().includes(query) ||
        link.category.toLowerCase().includes(query)
    )
  }, [searchQuery])

  const groupedLinks = useMemo(() => {
    const groups: Record<string, typeof quickLinks> = {}
    filteredLinks.forEach((link) => {
      if (!groups[link.category]) {
        groups[link.category] = []
      }
      groups[link.category].push(link)
    })
    return groups
  }, [filteredLinks])

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-semibold">Quick Links</h2>
          <p className="text-sm text-muted-foreground">
            Access all modules and pages quickly
          </p>
        </div>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search modules..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {Object.entries(groupedLinks).map(([category, links]) => (
        <div key={category} className="mb-6">
          <h3 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wide">
            {category}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {links.map((link) => (
              <QuickLinkCard key={link.id} link={link} />
            ))}
          </div>
        </div>
      ))}

      {filteredLinks.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-sm">No modules found matching "{searchQuery}"</p>
        </div>
      )}
    </div>
  )
}

