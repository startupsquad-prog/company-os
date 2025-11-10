'use client'

import { useState, useMemo } from 'react'
import { Search, Plus } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { ChatListItem } from './chat-list-item'
import { ChatContact } from './types'

interface ChatListSidebarProps {
  contacts: ChatContact[]
  selectedChatId?: string
  onSelectChat: (chatId: string) => void
  onNewChat: () => void
}

export function ChatListSidebar({
  contacts,
  selectedChatId,
  onSelectChat,
  onNewChat,
}: ChatListSidebarProps) {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredContacts = useMemo(() => {
    if (!searchQuery.trim()) {
      return contacts.map((contact) => ({
        ...contact,
        isSelected: contact.id === selectedChatId,
      }))
    }

    const query = searchQuery.toLowerCase()
    return contacts
      .filter(
        (contact) =>
          contact.name.toLowerCase().includes(query) ||
          contact.lastMessage.toLowerCase().includes(query)
      )
      .map((contact) => ({
        ...contact,
        isSelected: contact.id === selectedChatId,
      }))
  }, [contacts, searchQuery, selectedChatId])

  return (
    <div className="flex flex-col h-full w-[320px] border-r bg-background overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 flex-shrink-0">
        <h2 className="text-xl font-semibold">Chats</h2>
        <Button
          size="icon"
          variant="ghost"
          onClick={onNewChat}
          className="h-8 w-8 rounded-full"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <Separator />

      {/* Search */}
      <div className="px-4 py-3 flex-shrink-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Chats search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <Separator />

      {/* Chat List - Scrollable */}
      <ScrollArea className="flex-1 min-h-0">
        <div className="py-2">
          {filteredContacts.length > 0 ? (
            filteredContacts.map((contact) => (
              <ChatListItem
                key={contact.id}
                contact={contact}
                onClick={() => onSelectChat(contact.id)}
              />
            ))
          ) : (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              No chats found
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}

