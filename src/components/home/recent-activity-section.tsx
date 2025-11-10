'use client'

import Link from 'next/link'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { RecentActivity } from './types'
import { CheckSquare, Users, MessageSquare, FileText, ArrowRight, UserPlus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface RecentActivitySectionProps {
  activities: RecentActivity[]
}

const activityIcons = {
  task: CheckSquare,
  lead: Users,
  message: MessageSquare,
  file: FileText,
  status: ArrowRight,
  user: UserPlus,
}

const activityColors = {
  task: 'text-green-600 bg-green-100',
  lead: 'text-blue-600 bg-blue-100',
  message: 'text-purple-600 bg-purple-100',
  file: 'text-orange-600 bg-orange-100',
  status: 'text-amber-600 bg-amber-100',
  user: 'text-pink-600 bg-pink-100',
}

export function RecentActivitySection({ activities }: RecentActivitySectionProps) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => {
            const Icon = activityIcons[activity.type]
            const colorClass = activityColors[activity.type]

            return (
              <Link
                key={activity.id}
                href={activity.url || '#'}
                className="flex items-start gap-3 p-3 rounded-lg hover:bg-accent transition-colors group"
              >
                <div className={cn('h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0', colorClass)}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-sm">{activity.title}</p>
                    <span className="text-xs text-muted-foreground">•</span>
                    <span className="text-xs text-muted-foreground">{activity.timestamp}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{activity.description}</p>
                  {activity.user && (
                    <div className="flex items-center gap-2 mt-2">
                      <Avatar className="h-5 w-5">
                        <AvatarImage src={activity.user.avatar} alt={activity.user.name} />
                        <AvatarFallback className="text-xs">
                          {activity.user.name
                            .split(' ')
                            .map((n) => n[0])
                            .join('')
                            .toUpperCase()
                            .slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs text-muted-foreground">{activity.user.name}</span>
                    </div>
                  )}
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
              </Link>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

