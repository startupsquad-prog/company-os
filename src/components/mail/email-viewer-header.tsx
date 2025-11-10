'use client'

import { Reply, ReplyAll, Forward, MoreVertical } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { EmailContent } from './types'

interface EmailViewerHeaderProps {
  email: EmailContent | null
  onReply?: () => void
  onReplyAll?: () => void
  onForward?: () => void
}

export function EmailViewerHeader({
  email,
  onReply,
  onReplyAll,
  onForward,
}: EmailViewerHeaderProps) {
  if (!email) {
    return (
      <div className="px-6 py-4 border-b bg-background flex-shrink-0">
        <div className="text-muted-foreground">Select an email to view</div>
      </div>
    )
  }

  const senderInitials = email.sender.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className="px-6 py-4 border-b bg-background flex-shrink-0">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <Avatar className="h-10 w-10">
              <AvatarImage src={email.sender.avatar} alt={email.sender.name} />
              <AvatarFallback>{senderInitials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm">{email.sender.name}</div>
              {email.replyTo && (
                <div className="text-xs text-muted-foreground">
                  Reply-To: {email.replyTo}
                </div>
              )}
            </div>
          </div>
          <div className="font-semibold text-base mb-1">{email.subject}</div>
          <div className="text-xs text-muted-foreground">{email.date}</div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button size="icon" variant="ghost" className="h-9 w-9" onClick={onReply}>
            <Reply className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-9 w-9"
            onClick={onReplyAll}
          >
            <ReplyAll className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-9 w-9"
            onClick={onForward}
          >
            <Forward className="h-4 w-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="ghost" className="h-9 w-9">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Mark as Unread</DropdownMenuItem>
              <DropdownMenuItem>Archive</DropdownMenuItem>
              <DropdownMenuItem>Move to Folder</DropdownMenuItem>
              <DropdownMenuItem>Add Label</DropdownMenuItem>
              <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  )
}

