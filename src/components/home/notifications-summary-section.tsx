'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Bell, CheckCircle2, AlertCircle, Info, X } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface Notification {
  id: string
  type: 'success' | 'warning' | 'info' | 'error'
  title: string
  message: string
  time: string
  read: boolean
}

const mockNotifications: Notification[] = [
  {
    id: 'notif-1',
    type: 'success',
    title: 'Task Completed',
    message: 'John completed "Review Q4 Sales Report"',
    time: '5 min ago',
    read: false,
  },
  {
    id: 'notif-2',
    type: 'warning',
    title: 'Deadline Approaching',
    message: 'Client Presentation due in 2 days',
    time: '1 hour ago',
    read: false,
  },
  {
    id: 'notif-3',
    type: 'info',
    title: 'New Message',
    message: 'You have 3 unread messages',
    time: '2 hours ago',
    read: true,
  },
]

const notificationIcons = {
  success: CheckCircle2,
  warning: AlertCircle,
  info: Info,
  error: X,
}

const notificationColors = {
  success: 'text-green-600 bg-green-100',
  warning: 'text-amber-600 bg-amber-100',
  info: 'text-blue-600 bg-blue-100',
  error: 'text-red-600 bg-red-100',
}

export function NotificationsSummarySection() {
  const unreadCount = mockNotifications.filter((n) => !n.read).length

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            <CardTitle>Notifications</CardTitle>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unreadCount}
              </Badge>
            )}
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/notifications">View All</Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {mockNotifications.slice(0, 3).map((notification) => {
            const Icon = notificationIcons[notification.type]

            return (
              <div
                key={notification.id}
                className={cn(
                  'flex items-start gap-3 p-3 rounded-lg transition-colors',
                  !notification.read && 'bg-accent'
                )}
              >
                <div
                  className={cn(
                    'h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0',
                    notificationColors[notification.type]
                  )}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-sm">{notification.title}</p>
                    {!notification.read && (
                      <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mb-1">{notification.message}</p>
                  <span className="text-xs text-muted-foreground">{notification.time}</span>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

