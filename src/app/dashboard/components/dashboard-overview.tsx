'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckSquare, Users, ShoppingCart, FileText, Clock } from 'lucide-react'
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
} from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import { format, formatDistanceToNow } from 'date-fns'

interface DashboardOverviewProps {
  metrics?: {
    tasks: { total: number; completed: number; overdue: number; trend?: number }
    leads: { total: number; new: number; converted: number; trend?: number }
    orders: { total: number; revenue: number; pending: number; trend?: number }
    applications: { total: number; new: number; interviews: number; trend?: number }
    activityTrend?: Array<{ date: string; tasks: number; leads: number; orders: number; applications: number }>
    moduleDistribution?: Array<{ name: string; value: number }>
    statusOverview?: {
      tasks: Array<{ status: string; count: number }>
      leads: Array<{ status: string; count: number }>
      orders: Array<{ status: string; count: number }>
    }
    recentActivity?: Array<{
      id: string
      entity_type: string
      action: string
      created_at: string
      created_by_name?: string
    }>
  }
  loading?: boolean
}

const chartConfig = {
  tasks: {
    label: 'Tasks',
    color: 'var(--chart-1)',
  },
  leads: {
    label: 'Leads',
    color: 'var(--chart-2)',
  },
  orders: {
    label: 'Orders',
    color: 'var(--chart-3)',
  },
  applications: {
    label: 'Applications',
    color: 'var(--chart-4)',
  },
  count: {
    label: 'Count',
    color: 'var(--chart-1)',
  },
} satisfies ChartConfig

const COLORS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
]

export function DashboardOverview({ metrics, loading }: DashboardOverviewProps) {
  if (loading || !metrics) {
    return (
      <div className="space-y-6">
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
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[300px] w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[300px] w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const defaultMetrics = {
    tasks: { total: 0, completed: 0, overdue: 0, trend: 0 },
    leads: { total: 0, new: 0, converted: 0, trend: 0 },
    orders: { total: 0, revenue: 0, pending: 0, trend: 0 },
    applications: { total: 0, new: 0, interviews: 0, trend: 0 },
  }

  const safeMetrics = { ...defaultMetrics, ...metrics }

  // Prepare activity trend data
  const activityData = (metrics.activityTrend || []).map((item) => ({
    ...item,
    date: format(new Date(item.date), 'MMM dd'),
  }))

  // Prepare module distribution data
  const moduleData = metrics.moduleDistribution || [
    { name: 'Tasks', value: safeMetrics.tasks.total },
    { name: 'Leads', value: safeMetrics.leads.total },
    { name: 'Orders', value: safeMetrics.orders.total },
    { name: 'Applications', value: safeMetrics.applications.total },
  ]

  // Prepare status overview data
  const statusData = metrics.statusOverview || {
    tasks: [],
    leads: [],
    orders: [],
  }

  const recentActivity = metrics.recentActivity || []

  return (
    <div className="space-y-6">
      {/* Key Metrics Cards */}
      <div className="grid auto-rows-min gap-4 md:grid-cols-4">
        <Card className="shadow-none border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasks</CardTitle>
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{safeMetrics.tasks.total}</div>
            <p className="text-xs text-muted-foreground">
              {safeMetrics.tasks.completed} completed • {safeMetrics.tasks.overdue} overdue
              {safeMetrics.tasks.trend !== undefined && (
                <span className={safeMetrics.tasks.trend >= 0 ? 'text-green-600' : 'text-red-600'}>
                  {' '}
                  {safeMetrics.tasks.trend >= 0 ? '+' : ''}
                  {safeMetrics.tasks.trend.toFixed(1)}%
                </span>
              )}
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-none border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Leads</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{safeMetrics.leads.total}</div>
            <p className="text-xs text-muted-foreground">
              {safeMetrics.leads.new} new • {safeMetrics.leads.converted} converted
              {safeMetrics.leads.trend !== undefined && (
                <span className={safeMetrics.leads.trend >= 0 ? 'text-green-600' : 'text-red-600'}>
                  {' '}
                  {safeMetrics.leads.trend >= 0 ? '+' : ''}
                  {safeMetrics.leads.trend.toFixed(1)}%
                </span>
              )}
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-none border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{safeMetrics.orders.total}</div>
            <p className="text-xs text-muted-foreground">
              ${safeMetrics.orders.revenue.toLocaleString()} revenue • {safeMetrics.orders.pending} pending
              {safeMetrics.orders.trend !== undefined && (
                <span className={safeMetrics.orders.trend >= 0 ? 'text-green-600' : 'text-red-600'}>
                  {' '}
                  {safeMetrics.orders.trend >= 0 ? '+' : ''}
                  {safeMetrics.orders.trend.toFixed(1)}%
                </span>
              )}
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-none border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Applications</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{safeMetrics.applications.total}</div>
            <p className="text-xs text-muted-foreground">
              {safeMetrics.applications.new} new • {safeMetrics.applications.interviews} interviews
              {safeMetrics.applications.trend !== undefined && (
                <span className={safeMetrics.applications.trend >= 0 ? 'text-green-600' : 'text-red-600'}>
                  {' '}
                  {safeMetrics.applications.trend >= 0 ? '+' : ''}
                  {safeMetrics.applications.trend.toFixed(1)}%
                </span>
              )}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Activity Trend Chart */}
        <Card className="shadow-none border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Activity Trend</CardTitle>
            <CardDescription className="text-xs">Daily activity across all modules (last 30 days)</CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            {activityData.length > 0 ? (
              <div className="w-full h-[300px] overflow-hidden">
                <ChartContainer config={chartConfig} className="h-full w-full">
                  <LineChart
                    accessibilityLayer
                    data={activityData}
                    margin={{
                      left: 8,
                      right: 8,
                      top: 8,
                      bottom: 8,
                    }}
                  >
                    <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                    <XAxis
                      dataKey="date"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      tick={{ fontSize: 11 }}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      tick={{ fontSize: 11 }}
                    />
                    <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                    <Line
                      type="monotone"
                      dataKey="tasks"
                      stroke="var(--color-tasks)"
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="leads"
                      stroke="var(--color-leads)"
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="orders"
                      stroke="var(--color-orders)"
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="applications"
                      stroke="var(--color-applications)"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ChartContainer>
              </div>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                No activity data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Module Distribution Chart */}
        <Card className="shadow-none border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Module Distribution</CardTitle>
            <CardDescription className="text-xs">Activity breakdown by module</CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            {moduleData.length > 0 ? (
              <div className="w-full h-[300px] overflow-hidden">
                <ChartContainer config={chartConfig} className="h-full w-full">
                  <PieChart>
                    <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                    <Pie
                      data={moduleData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label
                    >
                      {moduleData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ChartContainer>
              </div>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                No distribution data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Status Overview Chart */}
        <Card className="shadow-none border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Status Overview</CardTitle>
            <CardDescription className="text-xs">Status distribution across key entities</CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            {statusData.tasks.length > 0 || statusData.leads.length > 0 || statusData.orders.length > 0 ? (
              <div className="w-full h-[300px] overflow-hidden">
                <ChartContainer config={chartConfig} className="h-full w-full">
                  <BarChart
                    accessibilityLayer
                    data={[...statusData.tasks, ...statusData.leads, ...statusData.orders]}
                    margin={{
                      left: 8,
                      right: 8,
                      top: 8,
                      bottom: 8,
                    }}
                  >
                    <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                    <XAxis
                      dataKey="status"
                      tickLine={false}
                      tickMargin={10}
                      axisLine={false}
                      tick={{ fontSize: 11 }}
                    />
                    <YAxis tickLine={false} axisLine={false} tickMargin={8} tick={{ fontSize: 11 }} />
                    <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                    <Bar dataKey="count" fill="var(--color-count)" radius={8} />
                  </BarChart>
                </ChartContainer>
              </div>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                No status data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity Feed */}
        <Card className="shadow-none border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Recent Activity</CardTitle>
            <CardDescription className="text-xs">Latest updates across all modules</CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            {recentActivity.length > 0 ? (
              <div className="space-y-4 max-h-[300px] overflow-y-auto">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center space-x-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                      {activity.entity_type === 'task' && <CheckSquare className="h-5 w-5" />}
                      {activity.entity_type === 'lead' && <Users className="h-5 w-5" />}
                      {activity.entity_type === 'order' && <ShoppingCart className="h-5 w-5" />}
                      {activity.entity_type === 'application' && <FileText className="h-5 w-5" />}
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium leading-none capitalize">
                        {activity.action} {activity.entity_type}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {activity.created_by_name || 'System'} • {activity.entity_type} module
                      </p>
                    </div>
                    <div className="text-sm text-muted-foreground flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                No recent activity
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
