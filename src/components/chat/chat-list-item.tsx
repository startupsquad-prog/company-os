'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { ChatContact } from './types'

interface ChatListItemProps {
  contact: ChatContact
  onClick: () => void
}

export function ChatListItem({ contact, onClick }: ChatListItemProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-accent',
        contact.isSelected && 'bg-muted'
      )}
    >
      <div className="relative flex-shrink-0">
        <Avatar className="h-10 w-10">
          <AvatarImage src={contact.avatar} alt={contact.name} />
          <AvatarFallback className="text-xs">{contact.initials}</AvatarFallback>
        </Avatar>
        {contact.isOnline && (
          <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-background" />
        )}
      </div>
      <div className="flex-1 min-w-0 flex flex-col gap-1">
        <div className="flex items-center justify-between gap-2">
          <span className="font-semibold text-sm truncate">{contact.name}</span>
          {contact.lastMessageTime && (
            <span className="text-xs text-muted-foreground whitespace-nowrap flex-shrink-0">
              {contact.lastMessageTime}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            {contact.lastMessage && (
              <span className="text-xs text-muted-foreground truncate">
                {contact.lastMessage}
              </span>
            )}
          </div>
          {contact.unreadCount && contact.unreadCount > 0 && (
            <Badge
              variant="default"
              className="h-5 min-w-[20px] px-1.5 flex items-center justify-center text-xs bg-green-500 hover:bg-green-500 flex-shrink-0"
            >
              {contact.unreadCount}
            </Badge>
          )}
        </div>
      </div>
    </div>
  )
}

