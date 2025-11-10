export interface ChatContact {
  id: string
  name: string
  avatar?: string
  initials: string
  isOnline: boolean
  lastMessage: string
  lastMessageTime: string // "10 minutes", "Yesterday", "13 days"
  unreadCount?: number
  isSelected?: boolean
}

export interface ChatMessage {
  id: string
  senderId: string
  content: string
  timestamp: string // "05:23 PM"
  isRead: boolean
  messageType: 'text' | 'image' | 'file'
  attachments?: Array<{ url: string; type: string }>
}

