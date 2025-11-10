'use client'

import { Bell, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useNotifications } from '@/lib/hooks/useNotifications'
import { useNotificationCount } from '@/lib/hooks/useNotificationCount'
import { cn } from '@/lib/utils'

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) {
    return 'just now'
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60)
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`
  }

  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`
  }

  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 7) {
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`
  }

  return date.toLocaleDateString()
}

export function NotificationsDropdown() {
  const router = useRouter()
  const { count, loading: countLoading } = useNotificationCount()
  const {
    notifications,
    loading: notificationsLoading,
    markAsRead,
  } = useNotifications({ filters: { limit: 10 } })

  const unreadCount = count
  const isLoading = countLoading || notificationsLoading

  const handleNotificationClick = async (notification: (typeof notifications)[0]) => {
    // Mark as read if unread
    if (!notification.read_at) {
      try {
        await markAsRead(notification.id)
      } catch (error) {
        console.error('Error marking notification as read:', error)
      }
    }

    // Navigate to action URL if available
    if (notification.action_url) {
      router.push(notification.action_url)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9 relative">
          <Bell className="h-4 w-4" />
          {!countLoading && unreadCount > 0 && (
            <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full border-2 border-background" />
          )}
          <span className="sr-only">Notifications</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between px-2 py-1.5">
          <DropdownMenuLabel>Notifications</DropdownMenuLabel>
          {unreadCount > 0 && (
            <span className="text-xs text-muted-foreground">{unreadCount} unread</span>
          )}
        </div>
        <DropdownMenuSeparator />
        {isLoading ? (
          <div className="p-4 text-center">
            <Loader2 className="h-4 w-4 animate-spin mx-auto text-muted-foreground" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">No notifications</div>
        ) : (
          <div className="max-h-96 overflow-y-auto">
            {notifications.map((notification) => {
              const isUnread = !notification.read_at
              return (
                <DropdownMenuItem
                  key={notification.id}
                  className={cn(
                    'flex flex-col items-start gap-1 p-3 cursor-pointer',
                    isUnread && 'bg-muted/50'
                  )}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start justify-between w-full">
                    <div className="flex-1 min-w-0">
                      <p
                        className={cn(
                          'text-sm font-medium truncate',
                          isUnread ? 'text-foreground' : 'text-muted-foreground'
                        )}
                      >
                        {notification.title}
                      </p>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatRelativeTime(notification.created_at)}
                      </p>
                    </div>
                    {isUnread && (
                      <span className="h-2 w-2 bg-blue-500 rounded-full mt-1 flex-shrink-0 ml-2" />
                    )}
                  </div>
                </DropdownMenuItem>
              )
            })}
          </div>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="justify-center"
          onClick={() => router.push('/dashboard/notifications')}
        >
          View all notifications
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
