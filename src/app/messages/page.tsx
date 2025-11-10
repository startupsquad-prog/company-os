'use client'

import { useState, useMemo, useCallback } from 'react'
import { ChatListSidebar } from '@/components/chat/chat-list-sidebar'
import { ChatHeader } from '@/components/chat/chat-header'
import { MessagesArea } from '@/components/chat/messages-area'
import { MessageInput } from '@/components/chat/message-input'
import { mockChatContacts, mockMessages, CURRENT_USER_ID } from '@/lib/chat/mock-data'
import { ChatContact, ChatMessage } from '@/components/chat/types'

export default function MessagesPage() {
  const [selectedChatId, setSelectedChatId] = useState<string | undefined>('chat-2')
  const [messagesMap, setMessagesMap] = useState<Record<string, ChatMessage[]>>(mockMessages)
  const [contacts, setContacts] = useState<ChatContact[]>(mockChatContacts)

  // Get selected contact
  const selectedContact = useMemo(() => {
    return contacts.find((c) => c.id === selectedChatId) || null
  }, [contacts, selectedChatId])

  // Get messages for selected chat
  const selectedMessages = useMemo(() => {
    if (!selectedChatId) return []
    return messagesMap[selectedChatId] || []
  }, [selectedChatId, messagesMap])

  // Handle chat selection
  const handleSelectChat = useCallback((chatId: string) => {
    setSelectedChatId(chatId)
    // Mark as read (remove unread count)
    setContacts((prev) =>
      prev.map((contact) =>
        contact.id === chatId ? { ...contact, unreadCount: 0 } : contact
      )
    )
  }, [])

  // Handle sending a message
  const handleSendMessage = useCallback(
    (content: string) => {
      if (!selectedChatId || !content.trim()) return

      const newMessage: ChatMessage = {
        id: `msg-${Date.now()}`,
        senderId: CURRENT_USER_ID,
        content,
        timestamp: new Date().toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        }),
        isRead: false,
        messageType: 'text',
      }

      // Add message to messages map
      setMessagesMap((prev) => ({
        ...prev,
        [selectedChatId]: [...(prev[selectedChatId] || []), newMessage],
      }))

      // Update last message in contact list
      setContacts((prev) =>
        prev.map((contact) =>
          contact.id === selectedChatId
            ? {
                ...contact,
                lastMessage: content,
                lastMessageTime: 'Just now',
                unreadCount: 0,
              }
            : contact
        )
      )

      // Simulate read receipt after 1-2 seconds
      setTimeout(() => {
        setMessagesMap((prev) => ({
          ...prev,
          [selectedChatId]: (prev[selectedChatId] || []).map((msg) =>
            msg.id === newMessage.id ? { ...msg, isRead: true } : msg
          ),
        }))
      }, 1500)
    },
    [selectedChatId]
  )

  // Handle new chat (placeholder)
  const handleNewChat = useCallback(() => {
    // TODO: Implement new chat dialog
    console.log('New chat clicked')
  }, [])

  return (
    <div className="flex flex-1 flex-col min-w-0 h-full overflow-hidden">
      <div className="flex flex-1 min-w-0 overflow-hidden">
        {/* Chat List Sidebar */}
        <ChatListSidebar
          contacts={contacts}
          selectedChatId={selectedChatId}
          onSelectChat={handleSelectChat}
          onNewChat={handleNewChat}
        />

        {/* Main Chat Area */}
        <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
          {/* Chat Header - Fixed at top */}
          <div className="flex-shrink-0">
            <ChatHeader contact={selectedContact} />
          </div>

          {/* Messages Area - Scrollable */}
          <div className="flex-1 min-h-0 overflow-hidden">
            <MessagesArea messages={selectedMessages} />
          </div>

          {/* Message Input - Fixed at bottom */}
          <div className="flex-shrink-0">
            {selectedChatId && (
              <MessageInput onSend={handleSendMessage} disabled={!selectedChatId} />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
