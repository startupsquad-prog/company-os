'use client'

import { useSalesData } from '@/lib/hooks/useSalesData'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { format, differenceInDays, startOfMonth, endOfMonth } from 'date-fns'
import { Loader2, Rocket } from 'lucide-react'

interface SalesModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SalesModal({ open, onOpenChange }: SalesModalProps) {
  const { data, loading } = useSalesData()

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount)
  }

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] my-8 overflow-y-auto">
          <DialogTitle className="sr-only">Loading Sales Data</DialogTitle>
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  if (!data) {
    return null
  }

  // Calculate days remaining and days passed
  const today = new Date()
  const monthStart = startOfMonth(today)
  const monthEnd = endOfMonth(today)
  const daysPassed = differenceInDays(today, monthStart) + 1
  const daysRemaining = differenceInDays(monthEnd, today)

  // Get last 9 days of data for the chart
  const chartData = data.dailyData.slice(-9).map((day, index) => ({
    day: index + 1,
    amount: day.amount,
    date: day.date,
  }))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] my-4 overflow-y-auto p-0">
        <DialogTitle className="sr-only">Sales Dashboard</DialogTitle>
        <div className="space-y-4 p-4">
          {/* Sales This Month Section */}
          <Card className="border-0 shadow-none">
            <CardHeader className="pb-3 pt-4 px-4">
              <CardTitle className="text-base font-semibold">Sales This Month</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                {daysRemaining} days remaining • {daysPassed} days passed
              </p>
            </CardHeader>
            <CardContent className="space-y-3 px-4 pb-4">
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium">Sales Achieved</span>
                  <span className="text-base font-bold">{formatCurrency(data.current)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium">Target</span>
                  <span className="text-base font-bold">{formatCurrency(data.target)}</span>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium">{data.progress.toFixed(1)}%</span>
                  </div>
                  <Progress value={data.progress} className="h-2" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium">Remaining</span>
                  <span className="text-base font-bold">{formatCurrency(data.remaining)}</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 pt-2 border-t">
                <Rocket className="h-3.5 w-3.5 text-primary" />
                <p className="text-xs text-muted-foreground">Great start! Time to accelerate!</p>
              </div>
            </CardContent>
          </Card>

          {/* Daily Sales Trend Section */}
          <Card className="border-0 shadow-none">
            <CardHeader className="pb-3 pt-4 px-4">
              <CardTitle className="text-base font-semibold">Daily Sales Trend</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="hsl(var(--muted))"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="day"
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                    tickFormatter={(value) => `${value}`}
                  />
                  <YAxis
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                    tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: 'calc(var(--radius) - 2px)',
                      color: 'hsl(var(--foreground))',
                      padding: '6px 10px',
                      fontSize: '11px',
                    }}
                    formatter={(value: number, payload: any) => {
                      const dayData = payload?.payload
                      return [
                        formatCurrency(value),
                        dayData ? `Day ${dayData.day}/${chartData.length}` : '',
                      ]
                    }}
                    labelFormatter={(label) => `Day ${label}`}
                  />
                  <Bar dataKey="amount" fill="hsl(var(--foreground))" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}
