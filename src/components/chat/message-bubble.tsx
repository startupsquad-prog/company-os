'use client'

import { Check, CheckCheck, MoreHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ChatMessage } from './types'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { CURRENT_USER_ID } from '@/lib/chat/mock-data'
import Image from 'next/image'

interface MessageBubbleProps {
  message: ChatMessage
  isOwnMessage: boolean
}

export function MessageBubble({ message, isOwnMessage }: MessageBubbleProps) {
  return (
    <div
      className={cn(
        'flex gap-2 px-4 py-2 group',
        isOwnMessage ? 'justify-end' : 'justify-start'
      )}
    >
      <div
        className={cn(
          'flex flex-col gap-1 max-w-[70%]',
          isOwnMessage ? 'items-end' : 'items-start'
        )}
      >
        {/* Message Content */}
        <div
          className={cn(
            'rounded-lg px-4 py-2 text-sm',
            isOwnMessage
              ? 'bg-muted text-foreground'
              : 'bg-background border text-foreground'
          )}
        >
          {message.messageType === 'image' && message.attachments ? (
            <div className="flex gap-2">
              {message.attachments.map((attachment, idx) => (
                <div key={idx} className="relative w-32 h-32 rounded-md overflow-hidden">
                  <Image
                    src={attachment.url}
                    alt={`Attachment ${idx + 1}`}
                    fill
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          ) : (
            <p className="whitespace-pre-wrap break-words">{message.content}</p>
          )}
        </div>

        {/* Timestamp and Status */}
        <div
          className={cn(
            'flex items-center gap-1.5 text-xs text-muted-foreground',
            isOwnMessage ? 'flex-row-reverse' : 'flex-row'
          )}
        >
          <span>{message.timestamp}</span>
          {isOwnMessage && (
            <div className="flex items-center">
              {message.isRead ? (
                <CheckCheck className="h-3.5 w-3.5 text-green-500" />
              ) : (
                <Check className="h-3.5 w-3.5" />
              )}
            </div>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreHorizontal className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align={isOwnMessage ? 'end' : 'start'}>
              <DropdownMenuItem>Copy</DropdownMenuItem>
              {isOwnMessage && <DropdownMenuItem>Edit</DropdownMenuItem>}
              <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  )
}

