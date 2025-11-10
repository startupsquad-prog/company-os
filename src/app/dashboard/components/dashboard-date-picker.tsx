'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CalendarIcon } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

interface DashboardDatePickerProps {
  onDateRangeChange: (dateRange: { from: Date | undefined; to: Date | undefined }) => void
}

export function DashboardDatePicker({ onDateRangeChange }: DashboardDatePickerProps) {
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  })

  // Initialize with today on mount and notify parent
  useEffect(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const initialRange = { from: today, to: today }
    setDateRange(initialRange)
    onDateRangeChange(initialRange)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Only run on mount

  const handlePresetClick = (preset: string) => {
    const now = new Date()
    let from: Date | undefined
    let to: Date | undefined

    switch (preset) {
      case 'today':
        from = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        to = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        break
      case 'last7days':
        from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        to = now
        break
      case 'last30days':
        from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        to = now
        break
      case 'last90days':
        from = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
        to = now
        break
      case 'thisMonth':
        from = new Date(now.getFullYear(), now.getMonth(), 1)
        to = now
        break
      case 'lastMonth':
        from = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        to = new Date(now.getFullYear(), now.getMonth(), 0)
        break
      case 'all':
        from = undefined
        to = undefined
        break
    }

    setDateRange({ from, to })
    onDateRangeChange({ from, to })
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            'justify-start text-left font-normal h-9',
            !dateRange.from && 'text-muted-foreground'
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {dateRange.from ? (
            dateRange.to ? (
              <>
                {format(dateRange.from, 'LLL dd')} - {format(dateRange.to, 'LLL dd, y')}
              </>
            ) : (
              format(dateRange.from, 'LLL dd, y')
            )
          ) : (
            <span>Date Range</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="end">
        <Card className="max-w-[300px] py-4">
          <CardContent className="px-4">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={dateRange.from}
              selected={dateRange}
              onSelect={(range) => {
                const newRange = range
                  ? { from: range.from, to: range.to }
                  : { from: undefined, to: undefined }
                setDateRange(newRange)
                onDateRangeChange(newRange)
              }}
              className="bg-transparent p-0 [--cell-size:2.375rem]"
            />
          </CardContent>
          <CardFooter className="flex flex-wrap gap-2 border-t px-4 pb-0 pt-4">
            {[
              { label: 'Today', value: 'today' },
              { label: 'Last 7 days', value: 'last7days' },
              { label: 'Last 30 days', value: 'last30days' },
              { label: 'This Month', value: 'thisMonth' },
              { label: 'Last Month', value: 'lastMonth' },
              { label: 'All time', value: 'all' },
            ].map((preset) => (
              <Button
                key={preset.value}
                variant="outline"
                size="sm"
                className="flex-1 text-xs"
                onClick={() => handlePresetClick(preset.value)}
              >
                {preset.label}
              </Button>
            ))}
          </CardFooter>
        </Card>
      </PopoverContent>
    </Popover>
  )
}

