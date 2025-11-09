import { formatDistanceToNow, formatDistance, isPast, differenceInDays, format } from "date-fns"
import type { TaskFull } from "@/lib/types/tasks"

/**
 * Calculate urgency tag for a task
 * Returns: 'overdue', 'expiring_soon', or null
 */
export function calculateUrgencyTag(task: TaskFull): 'overdue' | 'expiring_soon' | null {
  if (!task.due_date) {
    return null
  }

  // If task is completed, no urgency
  if (task.status === 'completed') {
    return null
  }

  const dueDate = new Date(task.due_date)
  const now = new Date()
  const daysUntilDue = differenceInDays(dueDate, now)

  // Overdue: past due date
  if (daysUntilDue < 0) {
    return 'overdue'
  }

  // Expiring soon: within 3 days (0-3 days)
  if (daysUntilDue <= 3 && daysUntilDue >= 0) {
    return 'expiring_soon'
  }

  return null
}

/**
 * Get urgency tag color configuration
 */
export function getUrgencyTagConfig(tag: 'overdue' | 'expiring_soon' | null) {
  if (tag === 'overdue') {
    return {
      label: 'Overdue',
      className: 'bg-red-100 text-red-800 border-red-200 hover:bg-red-200',
      color: 'text-red-600',
      icon: '⚠️'
    }
  }
  if (tag === 'expiring_soon') {
    return {
      label: 'Expiring Soon',
      className: 'bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-200',
      color: 'text-orange-600',
      icon: '⏰'
    }
  }
  return null
}

/**
 * Format date with relative time
 * Returns: "MMM dd, yyyy (x days ago)" or "MMM dd, yyyy (in x days)"
 */
export function formatDateWithRelative(date: Date | string | null, options?: { 
  showRelative?: boolean
  futurePrefix?: string
  pastPrefix?: string
}): string {
  if (!date) return '—'
  
  const dateObj = typeof date === 'string' ? new Date(date) : date
  const formatted = format(dateObj, 'MMM dd, yyyy')
  
  if (options?.showRelative === false) {
    return formatted
  }

  const now = new Date()
  const isFuture = dateObj > now
  const relative = formatDistanceToNow(dateObj, { addSuffix: true })
  
  const prefix = isFuture 
    ? (options?.futurePrefix || 'in')
    : (options?.pastPrefix || '')
  
  return `${formatted} (${prefix ? `${prefix} ` : ''}${relative})`
}

/**
 * Format relative time for due dates
 * Returns: "in 5 days" or "5 days ago" or "today" or "tomorrow"
 */
export function formatDueDateRelative(dueDate: Date | string | null): string | null {
  if (!dueDate) return null
  
  const date = typeof dueDate === 'string' ? new Date(dueDate) : dueDate
  const now = new Date()
  const days = differenceInDays(date, now)
  
  if (days === 0) return 'today'
  if (days === 1) return 'tomorrow'
  if (days === -1) return 'yesterday'
  if (days > 0) return `in ${days} days`
  if (days < 0) return `${Math.abs(days)} days ago`
  
  return null
}

/**
 * Format created date relative time
 * Returns: "x days ago" or "x hours ago"
 */
export function formatCreatedRelative(createdAt: Date | string): string {
  const date = typeof createdAt === 'string' ? new Date(createdAt) : createdAt
  return formatDistanceToNow(date, { addSuffix: true })
}

