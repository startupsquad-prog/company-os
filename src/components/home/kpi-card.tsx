'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { KPI } from './types'
import { ArrowUp, ArrowDown, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface KPICardProps {
  kpi: KPI
}

export function KPICard({ kpi }: KPICardProps) {
  const TrendIcon = kpi.trend === 'up' ? ArrowUp : kpi.trend === 'down' ? ArrowDown : Minus
  const trendColor =
    kpi.trend === 'up'
      ? 'text-green-600'
      : kpi.trend === 'down'
        ? 'text-red-600'
        : 'text-muted-foreground'

  return (
    <Card className="hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
        <div className={cn('h-8 w-8 rounded-lg flex items-center justify-center', `bg-gradient-to-br ${kpi.color || 'from-gray-500 to-gray-600'}`)}>
          <kpi.icon className="h-4 w-4 text-white" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{kpi.value}</div>
        {kpi.subtitle && (
          <p className="text-xs text-muted-foreground mt-1">{kpi.subtitle}</p>
        )}
        {kpi.change !== undefined && (
          <div className={cn('flex items-center gap-1 text-xs mt-2', trendColor)}>
            <TrendIcon className="h-3 w-3" />
            <span>
              {Math.abs(kpi.change)}% {kpi.trend === 'up' ? 'increase' : kpi.trend === 'down' ? 'decrease' : ''}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

