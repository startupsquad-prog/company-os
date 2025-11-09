'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useNotifications } from '@/lib/hooks/useNotifications'
import { cn } from '@/lib/utils'
import { CheckCircle2, Trash2, CheckCheck, Loader2 } from 'lucide-react'
import type { NotificationRow } from '@/lib/notifications/notification-types'
import { toast } from 'sonner'

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

function groupNotificationsByDate(notifications: NotificationRow[]) {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const thisWeek = new Date(today)
  thisWeek.setDate(thisWeek.getDate() - 7)

  const groups: {
    today: NotificationRow[]
    yesterday: NotificationRow[]
    thisWeek: NotificationRow[]
    older: NotificationRow[]
  } = {
    today: [],
    yesterday: [],
    thisWeek: [],
    older: [],
  }

  notifications.forEach((notification) => {
    const date = new Date(notification.created_at)
    if (date >= today) {
      groups.today.push(notification)
    } else if (date >= yesterday) {
      groups.yesterday.push(notification)
    } else if (date >= thisWeek) {
      groups.thisWeek.push(notification)
    } else {
      groups.older.push(notification)
    }
  })

  return groups
}

function NotificationItem({
  notification,
  onMarkAsRead,
  onDelete,
  onNavigate,
}: {
  notification: NotificationRow
  onMarkAsRead: (id: string) => void
  onDelete: (id: string) => void
  onNavigate: (url: string) => void
}) {
  const isUnread = !notification.read_at

  return (
    <div
      className={cn(
        'flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-colors hover:bg-muted/50',
        isUnread && 'bg-muted/30 border-primary/20'
      )}
      onClick={() => {
        if (notification.action_url) {
          onNavigate(notification.action_url)
        }
        if (isUnread) {
          onMarkAsRead(notification.id)
        }
      }}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4
                className={cn(
                  'text-sm font-medium',
                  isUnread ? 'text-foreground' : 'text-muted-foreground'
                )}
              >
                {notification.title}
              </h4>
              {isUnread && (
                <span className="h-2 w-2 bg-blue-500 rounded-full flex-shrink-0" />
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs text-muted-foreground">
                {formatRelativeTime(notification.created_at)}
              </span>
              {notification.type && (
                <Badge variant="outline" className="text-xs">
                  {notification.type.replace('_', ' ')}
                </Badge>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1">
            {isUnread && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={(e) => {
                  e.stopPropagation()
                  onMarkAsRead(notification.id)
                }}
              >
                <CheckCircle2 className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={(e) => {
                e.stopPropagation()
                onDelete(notification.id)
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function NotificationsPage() {
  const router = useRouter()
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const {
    notifications,
    loading,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refresh,
  } = useNotifications({
    filters: {
      read: filter === 'unread' ? false : undefined,
      limit: 100,
    },
    autoRefresh: true,
  })

  const filteredNotifications = filter === 'unread' 
    ? notifications.filter(n => !n.read_at)
    : notifications

  const groupedNotifications = groupNotificationsByDate(filteredNotifications)

  const handleMarkAsRead = async (id: string) => {
    try {
      await markAsRead(id)
      toast.success('Notification marked as read')
    } catch (error) {
      toast.error('Failed to mark notification as read')
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead()
      toast.success('All notifications marked as read')
    } catch (error) {
      toast.error('Failed to mark all notifications as read')
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteNotification(id)
      toast.success('Notification deleted')
    } catch (error) {
      toast.error('Failed to delete notification')
    }
  }

  const handleNavigate = (url: string) => {
    router.push(url)
  }

  return (
    <div className="flex flex-1 flex-col gap-4 min-w-0 h-full overflow-hidden">
      <div className="flex items-center justify-between flex-shrink-0">
            <div>
              <h1 className="text-2xl font-bold">Notifications</h1>
              <p className="text-sm text-muted-foreground">
                {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleMarkAllAsRead}
                  disabled={loading}
                >
                  <CheckCheck className="h-4 w-4 mr-2" />
                  Mark all as read
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={refresh} disabled={loading}>
                {loading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  'Refresh'
                )}
              </Button>
            </div>
          </div>

      <Tabs value={filter} onValueChange={(v) => setFilter(v as 'all' | 'unread')} className="flex flex-col flex-1 min-h-0 overflow-hidden">
        <TabsList className="flex-shrink-0">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="unread">
            Unread {unreadCount > 0 && `(${unreadCount})`}
          </TabsTrigger>
        </TabsList>

        <TabsContent value={filter} className="mt-4 flex-1 overflow-y-auto min-h-0">
              {loading && filteredNotifications.length === 0 ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : filteredNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <p className="text-muted-foreground">
                    {filter === 'unread' ? 'No unread notifications' : 'No notifications'}
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {groupedNotifications.today.length > 0 && (
                    <div>
                      <h2 className="text-sm font-semibold mb-3">Today</h2>
                      <div className="space-y-2">
                        {groupedNotifications.today.map((notification) => (
                          <NotificationItem
                            key={notification.id}
                            notification={notification}
                            onMarkAsRead={handleMarkAsRead}
                            onDelete={handleDelete}
                            onNavigate={handleNavigate}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {groupedNotifications.yesterday.length > 0 && (
                    <div>
                      <h2 className="text-sm font-semibold mb-3">Yesterday</h2>
                      <div className="space-y-2">
                        {groupedNotifications.yesterday.map((notification) => (
                          <NotificationItem
                            key={notification.id}
                            notification={notification}
                            onMarkAsRead={handleMarkAsRead}
                            onDelete={handleDelete}
                            onNavigate={handleNavigate}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {groupedNotifications.thisWeek.length > 0 && (
                    <div>
                      <h2 className="text-sm font-semibold mb-3">This Week</h2>
                      <div className="space-y-2">
                        {groupedNotifications.thisWeek.map((notification) => (
                          <NotificationItem
                            key={notification.id}
                            notification={notification}
                            onMarkAsRead={handleMarkAsRead}
                            onDelete={handleDelete}
                            onNavigate={handleNavigate}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {groupedNotifications.older.length > 0 && (
                    <div>
                      <h2 className="text-sm font-semibold mb-3">Older</h2>
                      <div className="space-y-2">
                        {groupedNotifications.older.map((notification) => (
                          <NotificationItem
                            key={notification.id}
                            notification={notification}
                            onMarkAsRead={handleMarkAsRead}
                            onDelete={handleDelete}
                            onNavigate={handleNavigate}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
        )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
