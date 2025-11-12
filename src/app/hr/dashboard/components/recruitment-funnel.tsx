'use client'

import { cn } from '@/lib/utils'

interface FunnelStage {
  name: string
  value: number
  conversionRate?: number
  color?: string
}

interface RecruitmentFunnelProps {
  stages: FunnelStage[]
  className?: string
}

export function RecruitmentFunnel({ stages, className }: RecruitmentFunnelProps) {
  if (stages.length === 0) {
    return (
      <div className="flex items-center justify-center h-[400px] text-muted-foreground">
        No funnel data available
      </div>
    )
  }

  // Find max value for proportional sizing
  const maxValue = Math.max(...stages.map((s) => s.value))
  const minWidthPercent = 20 // Minimum width percentage for the narrowest stage

  // Calculate width percentages - each stage is progressively narrower (funnel shape)
  const widthPercentages = stages.map((stage, index) => {
    if (index === 0) return 100 // First stage is full width
    // Progressive narrowing: 100% -> 75% -> 55% -> 40% -> 25% etc.
    const progress = index / (stages.length - 1)
    const baseWidth = 100 - (progress * 80) // Narrow from 100% to 20%
    return Math.max(minWidthPercent, baseWidth)
  })

  return (
    <div className={cn('flex flex-col items-center justify-center py-2', className)}>
      {stages.map((stage, index) => {
        const widthPercent = widthPercentages[index]
        const isLast = index === stages.length - 1
        const prevStage = index > 0 ? stages[index - 1] : null
        const conversionRate = stage.conversionRate ?? (prevStage && prevStage.value > 0 
          ? (stage.value / prevStage.value) * 100 
          : 0)

        // Calculate left margin to center the bar
        const leftMargin = (100 - widthPercent) / 2

        return (
          <div key={stage.name} className="w-full relative" style={{ marginBottom: '1px' }}>
            {/* Funnel Bar - Stacked directly on top of each other */}
            <div 
              className="relative"
              style={{ 
                marginLeft: `${leftMargin}%`, 
                width: `${widthPercent}%`,
              }}
            >
              <div
                className={cn(
                  'h-10 flex items-center justify-between px-2.5 text-xs font-bold text-white shadow-sm',
                  // Rounded corners only on outer edges
                  index === 0 ? 'rounded-t-md' : '',
                  isLast ? 'rounded-b-md' : ''
                )}
                style={{
                  backgroundColor: stage.color || `var(--chart-${Math.min(index + 1, 5)})`,
                }}
              >
                {/* Stage Name */}
                <span className="text-white drop-shadow-md truncate text-[11px]">{stage.name}</span>
                
                {/* Count and Conversion Rate */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {!isLast && conversionRate > 0 && (
                    <span className="text-[10px] font-normal opacity-90">
                      {conversionRate.toFixed(0)}%
                    </span>
                  )}
                  <span className="text-xs drop-shadow-lg">
                    {stage.value.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

