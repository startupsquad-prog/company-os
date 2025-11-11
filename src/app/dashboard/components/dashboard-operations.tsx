'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ShoppingCart, Package, Truck, DollarSign, FileCheck, Clock } from 'lucide-react'
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
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { format } from 'date-fns'

interface DashboardOperationsProps {
  metrics?: {
    orders: { total: number; pending: number; completed: number; revenue: number }
    quotations: { total: number; pending: number; approved: number; value: number }
    shipments: { total: number; inTransit: number; delivered: number; pending: number }
    payments: { total: number; pending: number; completed: number; amount: number }
    quotationTypes?: Array<{ name: string; value: number }>
    shipmentTypes?: Array<{ name: string; value: number }>
    orderStatusDistribution?: Array<{ name: string; value: number }>
    shipmentStatusTimeline?: Array<{
      date: string
      pending: number
      in_transit: number
      delivered: number
      returned: number
      cancelled: number
    }>
  }
  loading?: boolean
}

const COLORS = ['#2563eb', '#60a5fa', '#3b82f6', '#1d4ed8', '#1e40af', '#1e3a8a']

export function DashboardOperations({ metrics, loading }: DashboardOperationsProps) {
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
    orders: { total: 0, pending: 0, completed: 0, revenue: 0 },
    quotations: { total: 0, pending: 0, approved: 0, value: 0 },
    shipments: { total: 0, inTransit: 0, delivered: 0, pending: 0 },
    payments: { total: 0, pending: 0, completed: 0, amount: 0 },
  }

  const safeMetrics = { ...defaultMetrics, ...metrics }

  // Order Status Distribution
  const orderStatusData = metrics.orderStatusDistribution || []

  // Quotation Types
  const quotationTypeData = metrics.quotationTypes || []

  // Shipment Types
  const shipmentTypeData = metrics.shipmentTypes || []

  // Shipment Status Timeline
  const shipmentTimelineData = metrics.shipmentStatusTimeline || []

  // Order Fulfillment Rate
  const fulfillmentRate = safeMetrics.orders.total > 0 ? (safeMetrics.orders.completed / safeMetrics.orders.total) * 100 : 0

  return (
    <div className="space-y-4">
      {/* Key Metrics Cards */}
      <div className="grid auto-rows-min gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{safeMetrics.orders.total}</div>
            <p className="text-xs text-muted-foreground">
              {safeMetrics.orders.pending} pending • ${safeMetrics.orders.revenue.toLocaleString()} revenue
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quotations</CardTitle>
            <FileCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{safeMetrics.quotations.total}</div>
            <p className="text-xs text-muted-foreground">
              {safeMetrics.quotations.pending} pending • ${safeMetrics.quotations.value.toLocaleString()} value
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Shipments</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{safeMetrics.shipments.total}</div>
            <p className="text-xs text-muted-foreground">
              {safeMetrics.shipments.inTransit} in transit • {safeMetrics.shipments.delivered} delivered
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Payments</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{safeMetrics.payments.total}</div>
            <p className="text-xs text-muted-foreground">
              {safeMetrics.payments.pending} pending • ${safeMetrics.payments.amount.toLocaleString()} total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Order Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Order Status</CardTitle>
            <CardDescription>Breakdown by status</CardDescription>
          </CardHeader>
          <CardContent>
            {orderStatusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={orderStatusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(props: any) => {
                      const { name, percent } = props
                      return `${name} ${((percent as number) * 100).toFixed(0)}%`
                    }}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {orderStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
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
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                No order status data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quotation Types Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Quotation Types</CardTitle>
            <CardDescription>Distribution by quotation type</CardDescription>
          </CardHeader>
          <CardContent>
            {quotationTypeData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={quotationTypeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: 'calc(var(--radius) - 2px)',
                    }}
                  />
                  <Bar dataKey="value" fill="#2563eb" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                No quotation type data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Shipment Status Timeline */}
        <Card>
          <CardHeader>
            <CardTitle>Shipment Status Timeline</CardTitle>
            <CardDescription>Shipment status over time</CardDescription>
          </CardHeader>
          <CardContent>
            {shipmentTimelineData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={shipmentTimelineData}>
                  <defs>
                    <linearGradient id="colorPending" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorInTransit" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorDelivered" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
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
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="pending"
                    stackId="1"
                    stroke="#f59e0b"
                    fill="url(#colorPending)"
                    name="Pending"
                  />
                  <Area
                    type="monotone"
                    dataKey="in_transit"
                    stackId="1"
                    stroke="#2563eb"
                    fill="url(#colorInTransit)"
                    name="In Transit"
                  />
                  <Area
                    type="monotone"
                    dataKey="delivered"
                    stackId="1"
                    stroke="#10b981"
                    fill="url(#colorDelivered)"
                    name="Delivered"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                No shipment timeline data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Shipment Types */}
        <Card>
          <CardHeader>
            <CardTitle>Shipment Types</CardTitle>
            <CardDescription>Distribution by shipment type</CardDescription>
          </CardHeader>
          <CardContent>
            {shipmentTypeData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={shipmentTypeData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(props: any) => {
                      const { name, percent } = props
                      return `${name} ${((percent as number) * 100).toFixed(0)}%`
                    }}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {shipmentTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
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
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                No shipment type data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Summary Cards Row */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Order Fulfillment */}
        <Card>
          <CardHeader>
            <CardTitle>Order Fulfillment Rate</CardTitle>
            <CardDescription>Completed orders vs total orders</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Fulfillment Rate</span>
                <span className="text-2xl font-bold">{fulfillmentRate.toFixed(1)}%</span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Completed</span>
                  <span className="font-medium">{safeMetrics.orders.completed}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Total Orders</span>
                  <span className="font-medium">{safeMetrics.orders.total}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Status */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Status</CardTitle>
            <CardDescription>Payment breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Total Amount</span>
                <span className="text-2xl font-bold">${safeMetrics.payments.amount.toLocaleString()}</span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Pending</span>
                  <span className="font-medium">{safeMetrics.payments.pending}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Completed</span>
                  <span className="font-medium">{safeMetrics.payments.completed}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
