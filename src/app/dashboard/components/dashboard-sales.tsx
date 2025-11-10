'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Briefcase, Users, FileCheck, Phone } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
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
import { Progress } from '@/components/ui/progress'
import { format } from 'date-fns'
import { SalesFunnel } from './sales-funnel'

interface DashboardSalesProps {
  metrics?: {
    leads: { total: number; new: number; converted: number; value: number }
    opportunities: { total: number; open: number; won: number; value: number }
    quotations: { total: number; sent: number; approved: number; value: number }
    calls: { total: number; completed: number; scheduled: number; avgDuration?: number }
    leadSourceDistribution?: Array<{ name: string; value: number }>
    revenueTrend?: Array<{ date: string; revenue: number }>
  }
  loading?: boolean
}

const chartConfig = {
  value: {
    label: 'Value',
    color: 'var(--chart-1)',
  },
  revenue: {
    label: 'Revenue',
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

export function DashboardSales({ metrics, loading }: DashboardSalesProps) {
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
    leads: { total: 0, new: 0, converted: 0, value: 0 },
    opportunities: { total: 0, open: 0, won: 0, value: 0 },
    quotations: { total: 0, sent: 0, approved: 0, value: 0 },
    calls: { total: 0, completed: 0, scheduled: 0, avgDuration: 0 },
  }

  const safeMetrics = { ...defaultMetrics, ...metrics }

  // Pipeline Funnel Data with conversion rates
  const funnelStages = [
    {
      name: 'Leads',
      value: safeMetrics.leads.total,
      valueLabel: `${safeMetrics.leads.total.toLocaleString()} leads`,
      color: 'var(--chart-1)',
    },
    {
      name: 'Opportunities',
      value: safeMetrics.opportunities.total,
      valueLabel: `${safeMetrics.opportunities.total.toLocaleString()} opportunities`,
      conversionRate: leadToOppRate,
      color: 'var(--chart-2)',
    },
    {
      name: 'Quotations',
      value: safeMetrics.quotations.total,
      valueLabel: `${safeMetrics.quotations.total.toLocaleString()} quotations`,
      conversionRate: safeMetrics.opportunities.total > 0 
        ? (safeMetrics.quotations.total / safeMetrics.opportunities.total) * 100 
        : 0,
      color: 'var(--chart-3)',
    },
    {
      name: 'Won',
      value: safeMetrics.opportunities.won,
      valueLabel: `${safeMetrics.opportunities.won.toLocaleString()} won`,
      conversionRate: oppToWonRate,
      color: 'var(--chart-4)',
    },
  ]

  // Pipeline Funnel Data (for bar chart fallback)
  const pipelineData = [
    { stage: 'Leads', value: safeMetrics.leads.total },
    { stage: 'Opportunities', value: safeMetrics.opportunities.total },
    { stage: 'Quotations', value: safeMetrics.quotations.total },
    { stage: 'Won', value: safeMetrics.opportunities.won },
  ]

  // Revenue Trend Data
  const revenueData = metrics.revenueTrend || []

  // Lead Source Distribution
  const leadSourceData = metrics.leadSourceDistribution || []

  // Conversion Rates
  const leadToOppRate = safeMetrics.leads.total > 0 ? (safeMetrics.opportunities.total / safeMetrics.leads.total) * 100 : 0
  const oppToWonRate = safeMetrics.opportunities.total > 0 ? (safeMetrics.opportunities.won / safeMetrics.opportunities.total) * 100 : 0
  const quoteApprovalRate = safeMetrics.quotations.total > 0 ? (safeMetrics.quotations.approved / safeMetrics.quotations.total) * 100 : 0

  // Total Pipeline Value
  const totalPipelineValue = safeMetrics.leads.value + safeMetrics.opportunities.value + safeMetrics.quotations.value

  // Format revenue data
  const formattedRevenueData = revenueData.map((item) => ({
    ...item,
    date: format(new Date(item.date), 'MMM dd'),
  }))

  return (
    <div className="space-y-6">
      {/* Key Metrics Cards */}
      <div className="grid auto-rows-min gap-4 md:grid-cols-4">
        <Card className="shadow-none border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Leads</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{safeMetrics.leads.total}</div>
            <p className="text-xs text-muted-foreground">
              {safeMetrics.leads.new} new • ${safeMetrics.leads.value.toLocaleString()} value
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-none border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Opportunities</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{safeMetrics.opportunities.total}</div>
            <p className="text-xs text-muted-foreground">
              {safeMetrics.opportunities.open} open • ${safeMetrics.opportunities.value.toLocaleString()} value
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-none border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quotations</CardTitle>
            <FileCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{safeMetrics.quotations.total}</div>
            <p className="text-xs text-muted-foreground">
              {safeMetrics.quotations.sent} sent • ${safeMetrics.quotations.value.toLocaleString()} value
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-none border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Calls</CardTitle>
            <Phone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{safeMetrics.calls.total}</div>
            <p className="text-xs text-muted-foreground">
              {safeMetrics.calls.completed} completed • {safeMetrics.calls.scheduled} scheduled
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Sales Pipeline Funnel */}
        <Card className="shadow-none border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Sales Pipeline Funnel</CardTitle>
            <CardDescription className="text-xs">Conversion funnel from leads to won with conversion rates</CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            {funnelStages.length > 0 ? (
              <SalesFunnel stages={funnelStages} className="h-[400px]" />
            ) : (
              <div className="flex items-center justify-center h-[400px] text-muted-foreground">
                No pipeline data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Lead Source Distribution */}
        <Card className="shadow-none border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Lead Sources</CardTitle>
            <CardDescription className="text-xs">Distribution of leads by source</CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            {leadSourceData.length > 0 ? (
              <div className="w-full h-[300px] overflow-hidden">
                <ChartContainer config={chartConfig} className="h-full w-full">
                  <PieChart>
                    <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                    <Pie
                      data={leadSourceData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label
                    >
                      {leadSourceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ChartContainer>
              </div>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                No lead source data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Revenue Trend */}
        <Card className="shadow-none border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Revenue Trend</CardTitle>
            <CardDescription className="text-xs">Daily revenue from approved quotations</CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            {formattedRevenueData.length > 0 ? (
              <div className="w-full h-[300px] overflow-hidden">
                <ChartContainer config={chartConfig} className="h-full w-full">
                  <AreaChart
                    accessibilityLayer
                    data={formattedRevenueData}
                    margin={{
                      left: 8,
                      right: 8,
                      top: 8,
                      bottom: 8,
                    }}
                  >
                    <defs>
                      <linearGradient id="fillRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-revenue)" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="var(--color-revenue)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
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
                      tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                    />
                    <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                    <Area
                      type="natural"
                      dataKey="revenue"
                      fill="url(#fillRevenue)"
                      fillOpacity={0.4}
                      stroke="var(--color-revenue)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ChartContainer>
              </div>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                No revenue data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Conversion Rates */}
        <Card className="shadow-none border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Conversion Metrics</CardTitle>
            <CardDescription className="text-xs">Key conversion rates</CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Lead to Opportunity</span>
                  <span className="font-medium">{leadToOppRate.toFixed(1)}%</span>
                </div>
                <Progress value={leadToOppRate} className="h-2" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Opportunity to Won</span>
                  <span className="font-medium">{oppToWonRate.toFixed(1)}%</span>
                </div>
                <Progress value={oppToWonRate} className="h-2" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Quotation Approval</span>
                  <span className="font-medium">{quoteApprovalRate.toFixed(1)}%</span>
                </div>
                <Progress value={quoteApprovalRate} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Summary Card */}
      <Card className="shadow-none border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Revenue Summary</CardTitle>
          <CardDescription className="text-xs">Total value across pipeline</CardDescription>
        </CardHeader>
        <CardContent className="p-4">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Total Pipeline Value</p>
              <p className="text-2xl font-bold">${totalPipelineValue.toLocaleString()}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Leads Value</p>
              <p className="text-lg font-semibold">${safeMetrics.leads.value.toLocaleString()}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Opportunities Value</p>
              <p className="text-lg font-semibold">${safeMetrics.opportunities.value.toLocaleString()}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Quotations Value</p>
              <p className="text-lg font-semibold">${safeMetrics.quotations.value.toLocaleString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
