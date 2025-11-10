'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { UpcomingDeadline } from '@/lib/home/upcoming-deadlines-data'
import { format, isToday, isTomorrow, differenceInDays } from 'date-fns'
import { Calendar, Clock, AlertCircle, CheckCircle2, Circle, Package } from 'lucide-react'
import { cn } from '@/lib/utils'

interface UpcomingDeadlinesSectionProps {
  deadlines: UpcomingDeadline[]
}

const typeIcons = {
  task: Circle,
  meeting: Calendar,
  delivery: Package,
  deadline: AlertCircle,
}

const priorityColors = {
  high: 'bg-red-100 text-red-700 border-red-200',
  medium: 'bg-amber-100 text-amber-700 border-amber-200',
  low: 'bg-blue-100 text-blue-700 border-blue-200',
}

const statusIcons = {
  pending: Circle,
  'in-progress': Clock,
  completed: CheckCircle2,
}

export function UpcomingDeadlinesSection({ deadlines }: UpcomingDeadlinesSectionProps) {
  const formatDueDate = (date: Date) => {
    if (isToday(date)) return 'Today'
    if (isTomorrow(date)) return 'Tomorrow'
    const days = differenceInDays(date, new Date())
    if (days <= 7) return `In ${days} days`
    return format(date, 'MMM d, yyyy')
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Upcoming Deadlines</CardTitle>
          <Badge variant="outline" className="text-xs">
            {deadlines.length} items
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {deadlines.slice(0, 5).map((deadline) => {
            const TypeIcon = typeIcons[deadline.type]
            const StatusIcon = statusIcons[deadline.status]
            const isUrgent = differenceInDays(deadline.dueDate, new Date()) <= 2

            return (
              <Link
                key={deadline.id}
                href={deadline.url || '#'}
                className="flex items-start gap-3 p-3 rounded-lg hover:bg-accent transition-colors group"
              >
                <div
                  className={cn(
                    'h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0',
                    'bg-muted group-hover:bg-primary/10 transition-colors'
                  )}
                >
                  <TypeIcon className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className={cn('font-medium text-sm', isUrgent && 'text-red-600')}>
                      {deadline.title}
                    </p>
                    <StatusIcon
                      className={cn(
                        'h-4 w-4 flex-shrink-0',
                        deadline.status === 'completed'
                          ? 'text-green-600'
                          : deadline.status === 'in-progress'
                            ? 'text-blue-600'
                            : 'text-muted-foreground'
                      )}
                    />
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-muted-foreground">
                      {formatDueDate(deadline.dueDate)}
                    </span>
                    <Badge
                      variant="outline"
                      className={cn('text-xs px-1.5 py-0 h-5', priorityColors[deadline.priority])}
                    >
                      {deadline.priority}
                    </Badge>
                    {deadline.assignee && (
                      <span className="text-xs text-muted-foreground">• {deadline.assignee}</span>
                    )}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
        {deadlines.length > 5 && (
          <Link
            href="/tasks"
            className="block text-center text-sm text-primary hover:underline mt-4"
          >
            View all {deadlines.length} deadlines →
          </Link>
        )}
      </CardContent>
    </Card>
  )
}

