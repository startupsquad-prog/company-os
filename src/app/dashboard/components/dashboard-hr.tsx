'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Clock, Calendar, UserCheck } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { format } from 'date-fns'

interface DashboardHRProps {
  metrics?: {
    employees: { total: number; active: number; onLeave: number }
    attendance: { present: number; absent: number; late: number; today: number }
    leaveRequests: { total: number; pending: number; approved: number; rejected: number }
    leaveTypes?: Array<{ name: string; value: number }>
    attendanceTrend?: Array<{ date: string; present: number; absent: number; late: number }>
    attendanceRateTrend?: Array<{ date: string; rate: number }>
  }
  loading?: boolean
}

const COLORS = ['#2563eb', '#60a5fa', '#3b82f6', '#1d4ed8', '#1e40af', '#1e3a8a']
const LEAVE_COLORS: Record<string, string> = {
  sick: '#ef4444',
  vacation: '#10b981',
  personal: '#f59e0b',
  other: '#6b7280',
}

export function DashboardHR({ metrics, loading }: DashboardHRProps) {
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
    employees: { total: 0, active: 0, onLeave: 0 },
    attendance: { present: 0, absent: 0, late: 0, today: 0 },
    leaveRequests: { total: 0, pending: 0, approved: 0, rejected: 0 },
  }

  const safeMetrics = { ...defaultMetrics, ...metrics }

  // Attendance Trend Data
  const attendanceTrendData = metrics.attendanceTrend || []

  // Attendance Rate Trend
  const attendanceRateData = metrics.attendanceRateTrend || []

  // Leave Types Distribution
  const leaveTypeData = metrics.leaveTypes || []

  // Attendance Rate
  const attendanceRate =
    safeMetrics.employees.active > 0
      ? (safeMetrics.attendance.present / safeMetrics.employees.active) * 100
      : 0

  return (
    <div className="space-y-4">
      {/* Key Metrics Cards */}
      <div className="grid auto-rows-min gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Employees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{safeMetrics.employees.total}</div>
            <p className="text-xs text-muted-foreground">
              {safeMetrics.employees.active} active • {safeMetrics.employees.onLeave} on leave
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Attendance Today</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{safeMetrics.attendance.today}</div>
            <p className="text-xs text-muted-foreground">
              {safeMetrics.attendance.present} present • {safeMetrics.attendance.absent} absent
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Leave Requests</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{safeMetrics.leaveRequests.total}</div>
            <p className="text-xs text-muted-foreground">
              {safeMetrics.leaveRequests.pending} pending • {safeMetrics.leaveRequests.approved} approved
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{attendanceRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {safeMetrics.attendance.present} present • {safeMetrics.attendance.late} late
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Attendance Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Attendance Trend</CardTitle>
            <CardDescription>Daily attendance over time</CardDescription>
          </CardHeader>
          <CardContent>
            {attendanceTrendData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={attendanceTrendData}>
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
                    dataKey="present"
                    stroke="#10b981"
                    strokeWidth={2}
                    name="Present"
                    dot={{ r: 3 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="absent"
                    stroke="#ef4444"
                    strokeWidth={2}
                    name="Absent"
                    dot={{ r: 3 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="late"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    name="Late"
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                No attendance trend data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Leave Request Status */}
        <Card>
          <CardHeader>
            <CardTitle>Leave Request Status</CardTitle>
            <CardDescription>Breakdown by status</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'Pending', value: safeMetrics.leaveRequests.pending },
                    { name: 'Approved', value: safeMetrics.leaveRequests.approved },
                    { name: 'Rejected', value: safeMetrics.leaveRequests.rejected },
                  ]}
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
                  <Cell fill="#f59e0b" />
                  <Cell fill="#10b981" />
                  <Cell fill="#ef4444" />
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

      {/* Charts Row 2 */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Attendance Rate Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Attendance Rate Trend</CardTitle>
            <CardDescription>Daily attendance rate percentage</CardDescription>
          </CardHeader>
          <CardContent>
            {attendanceRateData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={attendanceRateData}>
                  <defs>
                    <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
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
                  <YAxis
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    domain={[0, 100]}
                    tickFormatter={(value) => `${value}%`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: 'calc(var(--radius) - 2px)',
                    }}
                    formatter={(value: number) => [`${value.toFixed(1)}%`, 'Attendance Rate']}
                  />
                  <Area
                    type="monotone"
                    dataKey="rate"
                    stroke="#2563eb"
                    strokeWidth={2}
                    fill="url(#colorRate)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                No attendance rate data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Leave Types Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Leave Types</CardTitle>
            <CardDescription>Distribution by leave type</CardDescription>
          </CardHeader>
          <CardContent>
            {leaveTypeData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={leaveTypeData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" horizontal={false} />
                  <XAxis type="number" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                  <YAxis
                    dataKey="name"
                    type="category"
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    width={100}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: 'calc(var(--radius) - 2px)',
                    }}
                  />
                  <Bar
                    dataKey="value"
                    fill="#2563eb"
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                No leave type data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Summary Cards Row */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Employee Status */}
        <Card>
          <CardHeader>
            <CardTitle>Employee Status</CardTitle>
            <CardDescription>Current workforce overview</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Active Employees</span>
                <span className="text-sm font-medium">{safeMetrics.employees.active}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">On Leave</span>
                <span className="text-sm font-medium">{safeMetrics.employees.onLeave}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Total Employees</span>
                <span className="text-lg font-bold">{safeMetrics.employees.total}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Leave Requests Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Leave Requests</CardTitle>
            <CardDescription>Status breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Pending</span>
                <span className="text-sm font-medium">{safeMetrics.leaveRequests.pending}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Approved</span>
                <span className="text-sm font-medium">{safeMetrics.leaveRequests.approved}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Rejected</span>
                <span className="text-sm font-medium">{safeMetrics.leaveRequests.rejected}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
