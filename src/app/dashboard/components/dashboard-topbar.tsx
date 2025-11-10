'use client'

import { DashboardTabs } from './dashboard-tabs'
import { DashboardDatePicker } from './dashboard-date-picker'

interface DashboardTopbarProps {
  activeTab: string
  onTabChange: (tab: string) => void
  onDateRangeChange: (dateRange: { from: Date | undefined; to: Date | undefined }) => void
}

export function DashboardTopbar({ activeTab, onTabChange, onDateRangeChange }: DashboardTopbarProps) {
  return (
    <div className="flex-shrink-0 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-12 items-center justify-between px-4 gap-4">
        {/* Center: Tabs */}
        <div className="flex-1 flex justify-center">
          <DashboardTabs activeTab={activeTab} onTabChange={onTabChange} />
        </div>

        {/* Right: Date Picker */}
        <div className="flex items-center gap-2">
          <DashboardDatePicker onDateRangeChange={onDateRangeChange} />
        </div>
      </div>
    </div>
  )
}

