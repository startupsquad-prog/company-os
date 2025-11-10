'use client'

import { useEffect, useRef } from 'react'
import { MessageBubble } from './message-bubble'
import { ChatMessage } from './types'
import { CURRENT_USER_ID } from '@/lib/chat/mock-data'

interface MessagesAreaProps {
  messages: ChatMessage[]
}

export function MessagesArea({ messages }: MessagesAreaProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Auto-scroll to bottom when messages change
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  if (messages.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <p className="text-sm">No messages yet</p>
          <p className="text-xs mt-1">Start the conversation</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="flex flex-col py-4">
        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            isOwnMessage={message.senderId === CURRENT_USER_ID}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>
    </div>
  )
}

