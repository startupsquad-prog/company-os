'use client'

import { useState, useEffect } from 'react'
import { DashboardTopbar } from './components/dashboard-topbar'
import { DashboardOverview } from './components/dashboard-overview'
import { DashboardSales } from './components/dashboard-sales'
import { DashboardOperations } from './components/dashboard-operations'
import { DashboardHR } from './components/dashboard-hr'
import { DashboardClients } from './components/dashboard-clients'
import { Tabs, TabsContent } from '@/components/ui/tabs'

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState('overview')
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  })
  const [metrics, setMetrics] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMetrics()
  }, [activeTab, dateRange])

  const fetchMetrics = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (dateRange.from) params.append('from', dateRange.from.toISOString())
      if (dateRange.to) params.append('to', dateRange.to.toISOString())
      params.append('tab', activeTab)

      const response = await fetch(`/api/dashboard/metrics?${params.toString()}`)
      if (!response.ok) throw new Error('Failed to fetch metrics')
      const data = await response.json()
      setMetrics(data.metrics)
    } catch (error) {
      console.error('Error fetching dashboard metrics:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-1 flex-col min-w-0 h-full overflow-hidden">
      <DashboardTopbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onDateRangeChange={setDateRange}
      />
      <div className="flex-1 overflow-y-auto min-h-0 p-4 md:p-6 lg:p-8">
        <Tabs value={activeTab} className="w-full">
          <TabsContent value="overview" className="mt-0">
            <DashboardOverview metrics={metrics?.overview} loading={loading} />
          </TabsContent>
          <TabsContent value="sales" className="mt-0">
            <DashboardSales metrics={metrics?.sales} loading={loading} />
          </TabsContent>
          <TabsContent value="operations" className="mt-0">
            <DashboardOperations metrics={metrics?.operations} loading={loading} />
          </TabsContent>
          <TabsContent value="hr" className="mt-0">
            <DashboardHR metrics={metrics?.hr} loading={loading} />
          </TabsContent>
          <TabsContent value="clients" className="mt-0">
            <DashboardClients metrics={metrics?.clients} loading={loading} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
