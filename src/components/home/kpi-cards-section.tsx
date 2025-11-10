'use client'

import { useState, useMemo } from 'react'
import { KPICard } from './kpi-card'
import { getKPIData } from '@/lib/home/kpi-mock-data'
import { DashboardDatePicker } from '@/app/dashboard/components/dashboard-date-picker'
import { format } from 'date-fns'

export function KPICardsSection() {
  // Default to today
  const getToday = () => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return today
  }
  
  const [dateFilter, setDateFilter] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: getToday(),
    to: getToday(),
  })

  const kpis = useMemo(() => {
    return getKPIData(dateFilter)
  }, [dateFilter])

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-semibold">Key Metrics</h2>
          <p className="text-sm text-muted-foreground">
            {dateFilter.from && dateFilter.to
              ? format(dateFilter.from, 'MMM d, yyyy') === format(dateFilter.to, 'MMM d, yyyy')
                ? format(dateFilter.from, 'MMMM d, yyyy')
                : `${format(dateFilter.from, 'MMM d')} - ${format(dateFilter.to, 'MMM d, yyyy')}`
              : 'All time'}
          </p>
        </div>
        <DashboardDatePicker onDateRangeChange={setDateFilter} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <KPICard key={kpi.id} kpi={kpi} />
        ))}
      </div>
    </div>
  )
}

