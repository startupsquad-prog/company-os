'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Phone, PhoneCall, PhoneOff, Clock, TrendingUp, CheckCircle } from 'lucide-react'
import type { CallFull } from '@/lib/types/calls'

interface CallMetricsProps {
  calls: CallFull[]
  loading?: boolean
}

export function CallMetrics({ calls, loading }: CallMetricsProps) {
  const metrics = useMemo(() => {
    if (!calls || calls.length === 0) {
      return {
        totalCalls: 0,
        completedCalls: 0,
        totalDuration: 0,
        averageDuration: 0,
        inboundCalls: 0,
        outboundCalls: 0,
        missedCalls: 0,
        noAnswerCalls: 0,
      }
    }

    const completedCalls = calls.filter((c) => c.status === 'completed')
    const inboundCalls = calls.filter((c) => c.call_type === 'inbound')
    const outboundCalls = calls.filter((c) => c.call_type === 'outbound')
    const missedCalls = calls.filter((c) => c.call_type === 'missed')
    const noAnswerCalls = calls.filter((c) => c.status === 'no_answer')

    const totalDuration = calls.reduce((sum, call) => {
      return sum + (call.duration_seconds || 0)
    }, 0)

    const averageDuration = completedCalls.length > 0 ? totalDuration / completedCalls.length : 0

    return {
      totalCalls: calls.length,
      completedCalls: completedCalls.length,
      totalDuration,
      averageDuration,
      inboundCalls: inboundCalls.length,
      outboundCalls: outboundCalls.length,
      missedCalls: missedCalls.length,
      noAnswerCalls: noAnswerCalls.length,
    }
  }, [calls])

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours}h ${minutes}m`
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`
    } else {
      return `${secs}s`
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-muted rounded w-24"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded w-32 mb-2"></div>
              <div className="h-3 bg-muted rounded w-20"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const cards = [
    {
      title: 'Total Calls',
      value: metrics.totalCalls.toString(),
      subtitle: `${metrics.completedCalls} completed`,
      icon: Phone,
      color: 'from-blue-500 to-blue-600',
    },
    {
      title: 'Total Duration',
      value: formatDuration(metrics.totalDuration),
      subtitle: `Avg: ${formatDuration(Math.round(metrics.averageDuration))}`,
      icon: Clock,
      color: 'from-green-500 to-green-600',
    },
    {
      title: 'Inbound Calls',
      value: metrics.inboundCalls.toString(),
      subtitle: `${Math.round((metrics.inboundCalls / metrics.totalCalls) * 100) || 0}% of total`,
      icon: PhoneCall,
      color: 'from-purple-500 to-purple-600',
    },
    {
      title: 'Outbound Calls',
      value: metrics.outboundCalls.toString(),
      subtitle: `${Math.round((metrics.outboundCalls / metrics.totalCalls) * 100) || 0}% of total`,
      icon: TrendingUp,
      color: 'from-orange-500 to-orange-600',
    },
    {
      title: 'Missed Calls',
      value: metrics.missedCalls.toString(),
      subtitle: `${metrics.noAnswerCalls} no answer`,
      icon: PhoneOff,
      color: 'from-red-500 to-red-600',
    },
    {
      title: 'Completion Rate',
      value: `${Math.round((metrics.completedCalls / metrics.totalCalls) * 100) || 0}%`,
      subtitle: `${metrics.completedCalls} of ${metrics.totalCalls} calls`,
      icon: CheckCircle,
      color: 'from-teal-500 to-teal-600',
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
      {cards.map((card) => (
        <Card key={card.title} className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
            <div className={`h-8 w-8 rounded-lg flex items-center justify-center bg-gradient-to-br ${card.color}`}>
              <card.icon className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{card.value}</div>
            {card.subtitle && (
              <p className="text-xs text-muted-foreground mt-1">{card.subtitle}</p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

