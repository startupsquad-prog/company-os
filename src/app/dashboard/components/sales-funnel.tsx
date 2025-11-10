'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingDown, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FunnelStage {
  name: string
  value: number
  valueLabel?: string
  conversionRate?: number
  color?: string
}

interface SalesFunnelProps {
  stages: FunnelStage[]
  className?: string
}

export function SalesFunnel({ stages, className }: SalesFunnelProps) {
  if (stages.length === 0) {
    return (
      <div className="flex items-center justify-center h-[400px] text-muted-foreground">
        No funnel data available
      </div>
    )
  }

  // Find max value for proportional sizing
  const maxValue = Math.max(...stages.map((s) => s.value))
  const minWidth = 20 // Minimum width percentage

  return (
    <div className={cn('flex flex-col items-center gap-2 py-4', className)}>
      {stages.map((stage, index) => {
        const widthPercent = maxValue > 0 ? Math.max(minWidth, (stage.value / maxValue) * 100) : minWidth
        const isLast = index === stages.length - 1
        const prevStage = index > 0 ? stages[index - 1] : null
        const conversionRate = stage.conversionRate ?? (prevStage && prevStage.value > 0 
          ? (stage.value / prevStage.value) * 100 
          : 0)

        return (
          <div key={stage.name} className="w-full space-y-2">
            {/* Stage Header */}
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{stage.name}</span>
                {conversionRate > 0 && !isLast && (
                  <span className="text-xs text-muted-foreground">
                    {conversionRate.toFixed(1)}% conversion
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold">{stage.valueLabel || stage.value.toLocaleString()}</span>
                {conversionRate > 0 && prevStage && (
                  <div className={cn(
                    'flex items-center gap-1 text-xs',
                    conversionRate >= 50 ? 'text-green-600' : conversionRate >= 25 ? 'text-yellow-600' : 'text-red-600'
                  )}>
                    {conversionRate >= 50 ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <TrendingDown className="h-3 w-3" />
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Funnel Bar */}
            <div className="relative">
              <div
                className={cn(
                  'h-12 rounded-md transition-all duration-500 ease-out flex items-center justify-center text-sm font-semibold text-white shadow-sm'
                )}
                style={{
                  width: `${widthPercent}%`,
                  marginLeft: 'auto',
                  marginRight: 'auto',
                  backgroundColor: stage.color || `var(--chart-${Math.min(index + 1, 5)})`,
                }}
              >
                {stage.value > 0 && (
                  <span className="drop-shadow-sm">{stage.value.toLocaleString()}</span>
                )}
              </div>
              
              {/* Funnel Connector (trapezoid effect) */}
              {!isLast && (
                <div
                  className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-[20px] border-l-transparent border-r-[20px] border-r-transparent border-t-[12px]"
                  style={{
                    marginTop: '-1px',
                    borderTopColor: 'hsl(var(--border))',
                  }}
                />
              )}
            </div>

            {/* Conversion Info */}
            {!isLast && prevStage && conversionRate > 0 && (
              <div className="text-center">
                <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-muted text-xs">
                  <span className="text-muted-foreground">
                    {prevStage.value.toLocaleString()} → {stage.value.toLocaleString()}
                  </span>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

