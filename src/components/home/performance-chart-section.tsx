'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { cn } from '@/lib/utils'

// Mock performance data
const performanceData = [
  { label: 'Mon', value: 65, trend: 'up' },
  { label: 'Tue', value: 78, trend: 'up' },
  { label: 'Wed', value: 82, trend: 'up' },
  { label: 'Thu', value: 75, trend: 'down' },
  { label: 'Fri', value: 88, trend: 'up' },
  { label: 'Sat', value: 92, trend: 'up' },
  { label: 'Sun', value: 85, trend: 'down' },
]

export function PerformanceChartSection() {
  const maxValue = Math.max(...performanceData.map((d) => d.value))
  const avgValue = performanceData.reduce((sum, d) => sum + d.value, 0) / performanceData.length
  const latestTrend = performanceData[performanceData.length - 1].trend

  return (
    <Card className="mb-8">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Weekly Performance</CardTitle>
          <div className="flex items-center gap-2">
            {latestTrend === 'up' ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600" />
            )}
            <span className="text-sm font-medium">{avgValue.toFixed(0)}% avg</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Chart Bars */}
          <div className="flex items-end justify-between gap-2 h-32">
            {performanceData.map((data, index) => {
              const height = (data.value / maxValue) * 100
              const TrendIcon = data.trend === 'up' ? TrendingUp : TrendingDown

              return (
                <div key={index} className="flex-1 flex flex-col items-center gap-2">
                  <div className="relative w-full h-full flex items-end group">
                    <div
                      className={cn(
                        'w-full rounded-t transition-all duration-500 hover:opacity-80 cursor-pointer',
                        'bg-gradient-to-t',
                        data.trend === 'up' ? 'from-green-500 to-green-400' : 'from-red-500 to-red-400'
                      )}
                      style={{ height: `${height}%` }}
                    />
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                      <div className="bg-popover border rounded px-2 py-1 text-xs whitespace-nowrap shadow-lg">
                        {data.value}%
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-xs font-medium">{data.label}</span>
                    <TrendIcon
                      className={cn(
                        'h-3 w-3',
                        data.trend === 'up' ? 'text-green-600' : 'text-red-600'
                      )}
                    />
                  </div>
                </div>
              )
            })}
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {performanceData.filter((d) => d.trend === 'up').length}
              </div>
              <div className="text-xs text-muted-foreground">Positive Days</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{maxValue}%</div>
              <div className="text-xs text-muted-foreground">Peak Performance</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{avgValue.toFixed(1)}%</div>
              <div className="text-xs text-muted-foreground">Average</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

