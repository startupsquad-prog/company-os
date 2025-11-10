'use client'

import { Video, Phone, MoreVertical } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ChatContact } from './types'

interface ChatHeaderProps {
  contact: ChatContact | null
}

export function ChatHeader({ contact }: ChatHeaderProps) {
  if (!contact) {
    return (
      <div className="flex items-center justify-between px-6 py-4 border-b bg-background flex-shrink-0">
        <div className="text-muted-foreground">Select a chat to start messaging</div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-between px-6 py-4 border-b bg-background flex-shrink-0">
      <div className="flex items-center gap-3">
        <Avatar className="h-10 w-10">
          <AvatarImage src={contact.avatar} alt={contact.name} />
          <AvatarFallback>{contact.initials}</AvatarFallback>
        </Avatar>
        <div className="flex flex-col">
          <span className="font-semibold text-sm">{contact.name}</span>
          {contact.isOnline && (
            <span className="text-xs text-green-500">Online</span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button size="icon" variant="ghost" className="h-9 w-9">
          <Video className="h-4 w-4" />
        </Button>
        <Button size="icon" variant="ghost" className="h-9 w-9">
          <Phone className="h-4 w-4" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="icon" variant="ghost" className="h-9 w-9">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>View Profile</DropdownMenuItem>
            <DropdownMenuItem>Mute Notifications</DropdownMenuItem>
            <DropdownMenuItem>Archive Chat</DropdownMenuItem>
            <DropdownMenuItem className="text-destructive">Delete Chat</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}

