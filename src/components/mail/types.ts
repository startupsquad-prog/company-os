export interface MailFolder {
  id: string
  name: string
  icon: string // Icon name from lucide-react
  unreadCount?: number
  isActive?: boolean
}

export interface MailCategory {
  id: string
  name: string
  color: string // Tailwind color class for dot indicator
  count: number
}

export interface Email {
  id: string
  sender: {
    name: string
    email: string
    avatar?: string
  }
  subject: string
  preview: string
  timestamp: string // "about 2 years ago", "over 2 years ago"
  isUnread: boolean
  tags: string[] // ["meeting", "work", "important", "personal", "budget"]
  folder: string // "inbox", "sent", etc.
  categories?: string[] // ["social", "updates", etc.]
}

export interface EmailContent {
  id: string
  sender: {
    name: string
    email: string
    avatar?: string
  }
  replyTo?: string
  subject: string
  date: string // "Oct 22, 2023, 9:00:00 AM"
  body: string
  attachments?: Array<{ name: string; size: string; url: string }>
}

