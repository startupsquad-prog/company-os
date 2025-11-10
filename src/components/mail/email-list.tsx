'use client'

import { ScrollArea } from '@/components/ui/scroll-area'
import { EmailListItem } from './email-list-item'
import { Email } from './types'
import { cn } from '@/lib/utils'

interface EmailListProps {
  emails: Email[]
  selectedEmailId?: string
  onSelectEmail: (emailId: string) => void
}

export function EmailList({
  emails,
  selectedEmailId,
  onSelectEmail,
}: EmailListProps) {
  if (emails.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <p className="text-sm">No emails found</p>
          <p className="text-xs mt-1">Try selecting a different folder</p>
        </div>
      </div>
    )
  }

  return (
    <ScrollArea className="h-full">
      <div>
        {emails.map((email) => (
          <div
            key={email.id}
            className={cn(
              email.id === selectedEmailId && 'bg-muted border-l-2 border-primary'
            )}
          >
            <EmailListItem
              email={email}
              onClick={() => onSelectEmail(email.id)}
            />
          </div>
        ))}
      </div>
    </ScrollArea>
  )
}

