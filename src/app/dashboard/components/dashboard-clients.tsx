'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Building2, Users, Briefcase, DollarSign, TrendingUp } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { format } from 'date-fns'

interface DashboardClientsProps {
  metrics?: {
    companies: { total: number; active: number; new: number }
    contacts: { total: number; active: number; new: number }
    leads: { total: number; active: number; converted: number }
    revenue: { total: number; thisMonth: number; lastMonth: number }
    clientGrowthTrend?: Array<{ date: string; companies: number; contacts: number }>
  }
  loading?: boolean
}

const COLORS = ['#2563eb', '#60a5fa', '#3b82f6', '#1d4ed8', '#1e40af', '#1e3a8a']

export function DashboardClients({ metrics, loading }: DashboardClientsProps) {
  if (loading || !metrics) {
    return (
      <div className="space-y-4">
        <div className="grid auto-rows-min gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  const defaultMetrics = {
    companies: { total: 0, active: 0, new: 0 },
    contacts: { total: 0, active: 0, new: 0 },
    leads: { total: 0, active: 0, converted: 0 },
    revenue: { total: 0, thisMonth: 0, lastMonth: 0 },
  }

  const safeMetrics = { ...defaultMetrics, ...metrics }

  // Client Growth Trend Data
  const growthData = metrics.clientGrowthTrend || []

  // Revenue Change
  const revenueChange =
    safeMetrics.revenue.lastMonth > 0
      ? ((safeMetrics.revenue.thisMonth - safeMetrics.revenue.lastMonth) / safeMetrics.revenue.lastMonth) * 100
      : 0

  // Client Activity Distribution
  const activityData = [
    { name: 'Active', value: safeMetrics.companies.active },
    { name: 'Inactive', value: safeMetrics.companies.total - safeMetrics.companies.active },
  ]

  return (
    <div className="space-y-4">
      {/* Key Metrics Cards */}
      <div className="grid auto-rows-min gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Companies</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{safeMetrics.companies.total}</div>
            <p className="text-xs text-muted-foreground">
              {safeMetrics.companies.active} active • {safeMetrics.companies.new} new
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contacts</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{safeMetrics.contacts.total}</div>
            <p className="text-xs text-muted-foreground">
              {safeMetrics.contacts.active} active • {safeMetrics.contacts.new} new
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Client Leads</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{safeMetrics.leads.total}</div>
            <p className="text-xs text-muted-foreground">
              {safeMetrics.leads.active} active • {safeMetrics.leads.converted} converted
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Client Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${safeMetrics.revenue.total.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              <span className={revenueChange >= 0 ? 'text-green-600' : 'text-red-600'}>
                {revenueChange >= 0 ? '+' : ''}
                {revenueChange.toFixed(1)}%
              </span>{' '}
              from last month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Client Growth Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Client Growth Trend</CardTitle>
            <CardDescription>New companies and contacts over time</CardDescription>
          </CardHeader>
          <CardContent>
            {growthData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={growthData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    tickFormatter={(value) => {
                      const date = new Date(value)
                      return `${date.getMonth() + 1}/${date.getDate()}`
                    }}
                  />
                  <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: 'calc(var(--radius) - 2px)',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="companies"
                    stroke="#2563eb"
                    strokeWidth={2}
                    name="Companies"
                    dot={{ r: 3 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="contacts"
                    stroke="#60a5fa"
                    strokeWidth={2}
                    name="Contacts"
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                No growth data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Client Activity Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Client Activity</CardTitle>
            <CardDescription>Active vs inactive companies</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={activityData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  <Cell fill="#10b981" />
                  <Cell fill="#6b7280" />
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 'calc(var(--radius) - 2px)',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Summary Cards Row */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Client Growth Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Client Growth</CardTitle>
            <CardDescription>New clients this period</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">New Companies</span>
                <span className="text-sm font-medium">{safeMetrics.companies.new}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">New Contacts</span>
                <span className="text-sm font-medium">{safeMetrics.contacts.new}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">New Leads</span>
                <span className="text-sm font-medium">{safeMetrics.leads.total}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Revenue Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue Overview</CardTitle>
            <CardDescription>Monthly comparison</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">This Month</span>
                <span className="text-sm font-medium">${safeMetrics.revenue.thisMonth.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Last Month</span>
                <span className="text-sm font-medium">${safeMetrics.revenue.lastMonth.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Total Revenue</span>
                <span className="text-lg font-bold">${safeMetrics.revenue.total.toLocaleString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
