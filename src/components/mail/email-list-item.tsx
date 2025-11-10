'use client'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { Email } from './types'

interface EmailListItemProps {
  email: Email
  onClick: () => void
}

const tagColors: Record<string, string> = {
  work: 'bg-black text-white',
  important: 'bg-red-500 text-white',
  meeting: 'bg-blue-500 text-white',
  personal: 'bg-gray-500 text-white',
  budget: 'bg-yellow-500 text-black',
  conference: 'bg-purple-500 text-white',
}

export function EmailListItem({ email, onClick }: EmailListItemProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'flex flex-col gap-2 px-4 py-3 cursor-pointer transition-colors hover:bg-accent border-b last:border-b-0'
      )}
    >
      <div className="flex items-start gap-3">
        {/* Unread Indicator */}
        {email.isUnread && (
          <div className="h-2 w-2 rounded-full bg-blue-500 flex-shrink-0 mt-2" />
        )}
        {!email.isUnread && <div className="w-2 flex-shrink-0" />}

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span
              className={cn(
                'text-sm truncate',
                email.isUnread ? 'font-semibold' : 'font-medium'
              )}
            >
              {email.sender.name}
            </span>
            <span className="text-xs text-muted-foreground whitespace-nowrap flex-shrink-0">
              {email.timestamp}
            </span>
          </div>

          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex-1 min-w-0">
              <div
                className={cn(
                  'text-sm mb-1 truncate',
                  email.isUnread ? 'font-semibold' : 'font-normal'
                )}
              >
                {email.subject}
              </div>
              <div className="text-xs text-muted-foreground line-clamp-2">
                {email.preview}
              </div>
            </div>
          </div>

          {/* Tags */}
          {email.tags && email.tags.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 mt-1">
              {email.tags.map((tag) => (
                <Badge
                  key={tag}
                  variant="outline"
                  className={cn(
                    'text-xs px-1.5 py-0.5 h-5',
                    tagColors[tag.toLowerCase()] || 'bg-gray-100 text-gray-700'
                  )}
                >
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

