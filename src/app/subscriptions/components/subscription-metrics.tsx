'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DollarSign, CreditCard, CheckCircle, Calendar, AlertCircle } from 'lucide-react'
import type { SubscriptionFull } from '@/lib/types/subscriptions'
import { format, addDays, isBefore } from 'date-fns'

interface SubscriptionMetricsProps {
  subscriptions: SubscriptionFull[]
  loading?: boolean
}

export function SubscriptionMetrics({ subscriptions, loading }: SubscriptionMetricsProps) {
  const metrics = useMemo(() => {
    if (!subscriptions || subscriptions.length === 0) {
      return {
        totalMonthlySpend: 0,
        totalAnnualSpend: 0,
        activeCount: 0,
        totalCount: 0,
        upcomingRenewals: 0,
        expiringSoon: 0,
      }
    }
    
    const activeSubscriptions = subscriptions.filter((s) => s.status === 'active')
    
    // Calculate total monthly spend
    const totalMonthlySpend = subscriptions.reduce((sum, sub) => {
      if (!sub.cost_per_period || !sub.billing_cycle) return sum
      
      let monthlyCost = 0
      switch (sub.billing_cycle) {
        case 'monthly':
          monthlyCost = sub.cost_per_period
          break
        case 'quarterly':
          monthlyCost = sub.cost_per_period / 3
          break
        case 'yearly':
          monthlyCost = sub.cost_per_period / 12
          break
        case 'one_time':
          monthlyCost = 0 // One-time costs don't contribute to monthly spend
          break
      }
      
      return sum + monthlyCost
    }, 0)

    // Calculate total annual spend
    const totalAnnualSpend = subscriptions.reduce((sum, sub) => {
      if (!sub.cost_per_period || !sub.billing_cycle) return sum
      
      let annualCost = 0
      switch (sub.billing_cycle) {
        case 'monthly':
          annualCost = sub.cost_per_period * 12
          break
        case 'quarterly':
          annualCost = sub.cost_per_period * 4
          break
        case 'yearly':
          annualCost = sub.cost_per_period
          break
        case 'one_time':
          annualCost = sub.cost_per_period
          break
      }
      
      return sum + annualCost
    }, 0)

    // Count upcoming renewals (within next 30 days)
    const thirtyDaysFromNow = addDays(new Date(), 30)
    const upcomingRenewals = subscriptions.filter((sub) => {
      if (!sub.renewal_date) return false
      const renewalDate = new Date(sub.renewal_date)
      return isBefore(renewalDate, thirtyDaysFromNow) && !isBefore(renewalDate, new Date())
    }).length

    // Count expiring soon (within next 30 days)
    const expiringSoon = subscriptions.filter((sub) => {
      if (!sub.expiry_date) return false
      const expiryDate = new Date(sub.expiry_date)
      return isBefore(expiryDate, thirtyDaysFromNow) && !isBefore(expiryDate, new Date())
    }).length

    return {
      totalMonthlySpend,
      totalAnnualSpend,
      activeCount: activeSubscriptions.length,
      totalCount: subscriptions.length,
      upcomingRenewals,
      expiringSoon,
    }
  }, [subscriptions])

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-muted rounded w-24"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded w-32 mb-2"></div>
              <div className="h-3 bg-muted rounded w-20"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const cards = [
    {
      title: 'Total Monthly Spend',
      value: formatCurrency(metrics.totalMonthlySpend),
      subtitle: `${subscriptions.length} subscriptions`,
      icon: DollarSign,
      color: 'from-green-500 to-green-600',
    },
    {
      title: 'Total Annual Spend',
      value: formatCurrency(metrics.totalAnnualSpend),
      subtitle: 'Projected yearly cost',
      icon: CreditCard,
      color: 'from-blue-500 to-blue-600',
    },
    {
      title: 'Active Subscriptions',
      value: metrics.activeCount.toString(),
      subtitle: `of ${metrics.totalCount} total`,
      icon: CheckCircle,
      color: 'from-purple-500 to-purple-600',
    },
    {
      title: 'Upcoming Renewals',
      value: metrics.upcomingRenewals.toString(),
      subtitle: 'Next 30 days',
      icon: Calendar,
      color: 'from-orange-500 to-orange-600',
    },
    {
      title: 'Expiring Soon',
      value: metrics.expiringSoon.toString(),
      subtitle: 'Next 30 days',
      icon: AlertCircle,
      color: 'from-red-500 to-red-600',
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
      {cards.map((card) => (
        <Card key={card.title} className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
            <div className={`h-8 w-8 rounded-lg flex items-center justify-center bg-gradient-to-br ${card.color}`}>
              <card.icon className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{card.value}</div>
            {card.subtitle && (
              <p className="text-xs text-muted-foreground mt-1">{card.subtitle}</p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

