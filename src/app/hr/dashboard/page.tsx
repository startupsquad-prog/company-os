'use client'

import { useState, useEffect, Suspense } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PageLoader } from '@/components/ui/loader'
import { PageAccessHeader } from '@/components/page-access/page-access-header'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Users,
  Calendar,
  CheckCircle,
  Briefcase,
  FileText,
  Activity,
} from 'lucide-react'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import { format, formatDistanceToNow } from 'date-fns'
import { RecruitmentFunnel } from './components/recruitment-funnel'

interface DashboardStats {
  totalCandidates: number
  candidatesByStatus: Record<string, number>
  activeApplications: number
  upcomingInterviews: number
  openPositions: number
  hiredThisMonth: number
  offersPending: number
  averageTimeToFill: number
  offerAcceptanceRate: number
  applicationsTrend: Array<{ date: string; count: number }>
  interviewsTrend: Array<{ date: string; count: number }>
  hiresTrend: Array<{ date: string; count: number }>
  applicationsByStatus: Record<string, number>
  candidatesByStatusDistribution: Array<{ name: string; value: number }>
  interviewsByType: Array<{ name: string; value: number }>
  interviewsByStatus: Array<{ name: string; value: number }>
  sourceOfHire: Array<{ name: string; value: number }>
  applicationsByDepartment: Array<{ name: string; value: number }>
  funnelData: Array<{ stage: string; count: number; conversionRate: number }>
  interviewCompletionRate: number
  averageInterviewRating: number
  averageRatingByType: Array<{ type: string; average: number }>
  topJobListings: Array<{
    id: string
    title: string
    department: string
    applicationsCount: number
    viewsCount: number
    status: string
    postedAt: string
  }>
  topPortals: Array<{ id: string; name: string; applications: number; views: number }>
  recruiterPerformance: Array<{ id: string; name: string; candidates: number; interviews: number; hires: number }>
  recentActivity: Array<{ id: string; type: string; description: string; timestamp: string }>
}

const chartConfig = {
  count: {
    label: 'Count',
    color: 'var(--chart-1)',
  },
  applications: {
    label: 'Applications',
    color: 'var(--chart-1)',
  },
  interviews: {
    label: 'Interviews',
    color: 'var(--chart-2)',
  },
  hires: {
    label: 'Hires',
    color: 'var(--chart-3)',
  },
} satisfies ChartConfig

const COLORS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
]

function DashboardPageContent() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await fetch('/api/recruitment/dashboard/stats')
        if (!response.ok) {
          throw new Error('Failed to fetch dashboard stats')
        }
        const data = await response.json()
        setStats(data)
      } catch (err: any) {
        console.error('Error fetching stats:', err)
        setError(err.message || 'Failed to load dashboard data')
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  if (loading) {
    return (
      <div className="flex flex-1 flex-col min-w-0 h-full overflow-hidden">
        <div className="flex items-center justify-between mb-6 flex-shrink-0">
          <div>
            <Skeleton className="h-7 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-1 flex-col min-w-0 h-full overflow-hidden">
        <div className="flex items-center justify-between mb-6 flex-shrink-0">
          <div>
            <h1 className="text-lg font-semibold tracking-tight">Recruitment Dashboard</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Overview of recruitment activities</p>
          </div>
          <PageAccessHeader pagePath="/hr/dashboard" />
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">{error}</div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!stats) {
    return null
  }

  // Format trend data for charts
  const applicationsTrendData = stats.applicationsTrend.map((item) => ({
    ...item,
    date: format(new Date(item.date), 'MMM dd'),
  }))

  const combinedTrendData = stats.applicationsTrend.map((item, index) => ({
    date: format(new Date(item.date), 'MMM dd'),
    applications: item.count,
    interviews: stats.interviewsTrend[index]?.count || 0,
    hires: stats.hiresTrend[index]?.count || 0,
  }))

  // Format funnel data for SalesFunnel component
  const funnelStages = stats.funnelData.map((stage, index) => ({
    name: stage.stage,
    value: stage.count,
    valueLabel: `${stage.count.toLocaleString()}`,
    conversionRate: stage.conversionRate,
    color: COLORS[index % COLORS.length],
  }))

  return (
    <div className="flex flex-1 flex-col min-w-0 h-full overflow-hidden">
      <div className="flex items-center justify-between mb-6 flex-shrink-0">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Recruitment Dashboard</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Overview of recruitment activities</p>
        </div>
        <PageAccessHeader pagePath="/hr/dashboard" />
      </div>

      <div className="flex-1 overflow-y-auto min-h-0 space-y-6 pb-6">
        {/* Section 1: Key Performance Indicators */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 py-2">
              <CardTitle className="text-xs font-medium leading-tight">Total Candidates</CardTitle>
              <div className="h-7 w-7 rounded-lg flex items-center justify-center bg-gradient-to-br from-blue-500 to-blue-600 flex-shrink-0">
                <Users className="h-3.5 w-3.5 text-white" />
              </div>
            </CardHeader>
            <CardContent className="px-3 pb-3 pt-0">
              <div className="text-xl font-bold">{stats.totalCandidates}</div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {stats.candidatesByStatusDistribution.find((s) => s.name === 'hired')?.value || 0} hired
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 py-2">
              <CardTitle className="text-xs font-medium leading-tight">Active Applications</CardTitle>
              <div className="h-7 w-7 rounded-lg flex items-center justify-center bg-gradient-to-br from-green-500 to-green-600 flex-shrink-0">
                <FileText className="h-3.5 w-3.5 text-white" />
              </div>
            </CardHeader>
            <CardContent className="px-3 pb-3 pt-0">
              <div className="text-xl font-bold">{stats.activeApplications}</div>
              <p className="text-xs text-muted-foreground mt-0.5">In pipeline</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 py-2">
              <CardTitle className="text-xs font-medium leading-tight">Upcoming Interviews</CardTitle>
              <div className="h-7 w-7 rounded-lg flex items-center justify-center bg-gradient-to-br from-purple-500 to-purple-600 flex-shrink-0">
                <Calendar className="h-3.5 w-3.5 text-white" />
              </div>
            </CardHeader>
            <CardContent className="px-3 pb-3 pt-0">
              <div className="text-xl font-bold">{stats.upcomingInterviews}</div>
              <p className="text-xs text-muted-foreground mt-0.5">Next 7 days</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 py-2">
              <CardTitle className="text-xs font-medium leading-tight">Hired This Month</CardTitle>
              <div className="h-7 w-7 rounded-lg flex items-center justify-center bg-gradient-to-br from-orange-500 to-orange-600 flex-shrink-0">
                <CheckCircle className="h-3.5 w-3.5 text-white" />
              </div>
            </CardHeader>
            <CardContent className="px-3 pb-3 pt-0">
              <div className="text-xl font-bold">{stats.hiredThisMonth}</div>
              <p className="text-xs text-muted-foreground mt-0.5">Current month</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 py-2">
              <CardTitle className="text-xs font-medium leading-tight">Open Positions</CardTitle>
              <div className="h-7 w-7 rounded-lg flex items-center justify-center bg-gradient-to-br from-indigo-500 to-indigo-600 flex-shrink-0">
                <Briefcase className="h-3.5 w-3.5 text-white" />
              </div>
            </CardHeader>
            <CardContent className="px-3 pb-3 pt-0">
              <div className="text-xl font-bold">{stats.openPositions}</div>
              <p className="text-xs text-muted-foreground mt-0.5">Active listings</p>
            </CardContent>
          </Card>
        </div>

        {/* Section 2: Recruitment Funnel & Interview Status */}
        <div className="grid gap-3 md:grid-cols-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Recruitment Funnel</CardTitle>
              <CardDescription className="text-xs">Candidate progression through stages</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              {funnelStages.length > 0 ? (
                <RecruitmentFunnel stages={funnelStages} className="h-[240px]" />
              ) : (
                <div className="flex items-center justify-center h-[240px] text-muted-foreground text-sm">
                  No funnel data available
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Interview Status</CardTitle>
              <CardDescription className="text-xs">Breakdown by interview status</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              {stats.interviewsByStatus.length > 0 ? (
                <ChartContainer config={chartConfig} className="h-[240px]">
                  <PieChart>
                    <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                    <Pie
                      data={stats.interviewsByStatus}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={70}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {stats.interviewsByStatus.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ChartContainer>
              ) : (
                <div className="flex items-center justify-center h-[240px] text-muted-foreground text-sm">
                  No interview status data available
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Section 3: Charts Row 1 - Applications Trend, Candidate Status, Applications by Department */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Applications Trend</CardTitle>
              <CardDescription className="text-xs">Daily applications over last 30 days</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              {applicationsTrendData.length > 0 ? (
                <ChartContainer config={chartConfig} className="h-[240px]">
                  <LineChart data={applicationsTrendData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 10 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="var(--chart-1)"
                      strokeWidth={2}
                      dot={{ r: 2 }}
                    />
                  </LineChart>
                </ChartContainer>
              ) : (
                <div className="flex items-center justify-center h-[240px] text-muted-foreground text-sm">
                  No trend data available
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Candidate Status</CardTitle>
              <CardDescription className="text-xs">Breakdown by current status</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              {stats.candidatesByStatusDistribution.length > 0 ? (
                <ChartContainer config={chartConfig} className="h-[240px]">
                  <PieChart>
                    <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                    <Pie
                      data={stats.candidatesByStatusDistribution}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={70}
                      label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                    >
                      {stats.candidatesByStatusDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ChartContainer>
              ) : (
                <div className="flex items-center justify-center h-[240px] text-muted-foreground text-sm">
                  No status data available
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">By Department</CardTitle>
              <CardDescription className="text-xs">Applications by department</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              {stats.applicationsByDepartment.length > 0 ? (
                <ChartContainer config={chartConfig} className="h-[240px]">
                  <BarChart data={stats.applicationsByDepartment}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 10 }}
                      tickLine={false}
                      axisLine={false}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="value" fill="var(--chart-3)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ChartContainer>
              ) : (
                <div className="flex items-center justify-center h-[240px] text-muted-foreground text-sm">
                  No department data available
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Section 4: Charts Row 2 - Interview Pipeline, Source of Hire, Interview Types */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Interview Pipeline</CardTitle>
              <CardDescription className="text-xs">Interviews by type</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              {stats.interviewsByType.length > 0 ? (
                <ChartContainer config={chartConfig} className="h-[240px]">
                  <BarChart data={stats.interviewsByType}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 10 }}
                      tickLine={false}
                      axisLine={false}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="value" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ChartContainer>
              ) : (
                <div className="flex items-center justify-center h-[240px] text-muted-foreground text-sm">
                  No interview data available
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Source of Hire</CardTitle>
              <CardDescription className="text-xs">Applications by source channel</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              {stats.sourceOfHire.length > 0 ? (
                <ChartContainer config={chartConfig} className="h-[240px]">
                  <BarChart data={stats.sourceOfHire} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                    <YAxis
                      dataKey="name"
                      type="category"
                      tick={{ fontSize: 10 }}
                      tickLine={false}
                      axisLine={false}
                      width={80}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="value" fill="var(--chart-2)" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ChartContainer>
              ) : (
                <div className="flex items-center justify-center h-[240px] text-muted-foreground text-sm">
                  No source data available
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Activity Trend</CardTitle>
              <CardDescription className="text-xs">Applications, interviews, and hires</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              {combinedTrendData.length > 0 ? (
                <ChartContainer config={chartConfig} className="h-[240px]">
                  <AreaChart data={combinedTrendData}>
                    <defs>
                      <linearGradient id="colorApplications" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorInterviews" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--chart-2)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="var(--chart-2)" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorHires" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--chart-3)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="var(--chart-3)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 10 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Area
                      type="monotone"
                      dataKey="applications"
                      stroke="var(--chart-1)"
                      fill="url(#colorApplications)"
                      strokeWidth={2}
                    />
                    <Area
                      type="monotone"
                      dataKey="interviews"
                      stroke="var(--chart-2)"
                      fill="url(#colorInterviews)"
                      strokeWidth={2}
                    />
                    <Area
                      type="monotone"
                      dataKey="hires"
                      stroke="var(--chart-3)"
                      fill="url(#colorHires)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ChartContainer>
              ) : (
                <div className="flex items-center justify-center h-[240px] text-muted-foreground text-sm">
                  No trend data available
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Section 5: Charts Row 3 - Interview Ratings, Top Job Listings, Recent Activity */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Interview Ratings</CardTitle>
              <CardDescription className="text-xs">Average rating by interview type</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              {stats.averageRatingByType.length > 0 ? (
                <ChartContainer config={chartConfig} className="h-[240px]">
                  <BarChart data={stats.averageRatingByType}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="type"
                      tick={{ fontSize: 10 }}
                      tickLine={false}
                      axisLine={false}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis
                      tick={{ fontSize: 10 }}
                      tickLine={false}
                      axisLine={false}
                      domain={[0, 5]}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="average" fill="var(--chart-4)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ChartContainer>
              ) : (
                <div className="flex items-center justify-center h-[240px] text-muted-foreground text-sm">
                  No rating data available
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Top Job Listings</CardTitle>
              <CardDescription className="text-xs">Most active job postings</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              {stats.topJobListings.length > 0 ? (
                <div className="space-y-2 max-h-[240px] overflow-y-auto">
                  {stats.topJobListings.slice(0, 5).map((listing) => (
                    <div key={listing.id} className="flex items-center justify-between p-2 border rounded-md text-xs">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{listing.title}</div>
                        <div className="text-muted-foreground truncate">{listing.department}</div>
                      </div>
                      <div className="text-right ml-2 flex-shrink-0">
                        <div className="font-medium">{listing.applicationsCount}</div>
                        <div className="text-muted-foreground">apps</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-[240px] text-muted-foreground text-sm">
                  No job listings available
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Recent Activity</CardTitle>
              <CardDescription className="text-xs">Latest recruitment activities</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              {stats.recentActivity.length > 0 ? (
                <div className="space-y-2 max-h-[240px] overflow-y-auto">
                  {stats.recentActivity.slice(0, 6).map((activity) => (
                    <div key={activity.id} className="flex items-start gap-2 p-2 border rounded-md text-xs">
                      <Activity className="h-3 w-3 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="line-clamp-1">{activity.description}</div>
                        <div className="text-muted-foreground mt-0.5">
                          {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-[240px] text-muted-foreground text-sm">
                  No recent activity
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <DashboardPageContent />
    </Suspense>
  )
}
