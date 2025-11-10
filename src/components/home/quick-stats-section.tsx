'use client'

import { Card, CardContent } from '@/components/ui/card'
import { TrendingUp, TrendingDown, Users, MessageSquare, CheckCircle2, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

interface QuickStat {
  id: string
  label: string
  value: string | number
  change?: number
  trend?: 'up' | 'down'
  icon: typeof TrendingUp
  color: string
}

const quickStats: QuickStat[] = [
  {
    id: 'team-active',
    label: 'Team Active',
    value: '12',
    change: 5,
    trend: 'up',
    icon: Users,
    color: 'from-blue-500 to-cyan-500',
  },
  {
    id: 'unread-messages',
    label: 'Unread Messages',
    value: '8',
    change: -3,
    trend: 'down',
    icon: MessageSquare,
    color: 'from-purple-500 to-pink-500',
  },
  {
    id: 'completed-today',
    label: 'Completed Today',
    value: '24',
    change: 12,
    trend: 'up',
    icon: CheckCircle2,
    color: 'from-green-500 to-emerald-500',
  },
  {
    id: 'pending-tasks',
    label: 'Pending Tasks',
    value: '7',
    change: -2,
    trend: 'down',
    icon: Clock,
    color: 'from-orange-500 to-amber-500',
  },
]

export function QuickStatsSection() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      {quickStats.map((stat) => {
        const Icon = stat.icon
        const TrendIcon = stat.trend === 'up' ? TrendingUp : TrendingDown

        return (
          <Card key={stat.id} className="hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div
                  className={cn(
                    'h-10 w-10 rounded-lg flex items-center justify-center',
                    `bg-gradient-to-br ${stat.color}`
                  )}
                >
                  <Icon className="h-5 w-5 text-white" />
                </div>
                {stat.change !== undefined && (
                  <div
                    className={cn(
                      'flex items-center gap-1 text-xs',
                      stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                    )}
                  >
                    <TrendIcon className="h-3 w-3" />
                    <span>{Math.abs(stat.change)}%</span>
                  </div>
                )}
              </div>
              <div className="text-2xl font-bold mb-1">{stat.value}</div>
              <div className="text-xs text-muted-foreground">{stat.label}</div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

