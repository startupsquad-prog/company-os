'use client'

import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { QuickLink } from './types'
import { cn } from '@/lib/utils'

interface QuickLinkCardProps {
  link: QuickLink
}

export function QuickLinkCard({ link }: QuickLinkCardProps) {
  const Icon = link.icon

  return (
    <Link href={link.url} className="block h-full">
      <Card
        className={cn(
          'h-full transition-all duration-300 hover:scale-[1.02] hover:shadow-xl cursor-pointer',
          'border-2 hover:border-primary/50 group relative overflow-hidden',
          'hover:-translate-y-1'
        )}
      >
        <div
          className={cn(
            'absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-10 transition-opacity',
            link.color
          )}
        />
        <CardContent className="p-4 relative">
          <div className="flex items-start gap-3">
            <div
              className={cn(
                'h-12 w-12 rounded-lg flex items-center justify-center flex-shrink-0',
                'bg-gradient-to-br shadow-sm group-hover:shadow-md transition-shadow',
                link.color
              )}
            >
              <Icon className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-1">
                <h3 className="font-semibold text-sm group-hover:text-primary transition-colors line-clamp-1">
                  {link.title}
                </h3>
                {link.comingSoon && (
                  <Badge variant="secondary" className="text-xs flex-shrink-0">
                    Soon
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground line-clamp-2">
                {link.description}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

