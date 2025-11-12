'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, TrendingUp, CheckCircle, XCircle, DollarSign, Sparkles } from 'lucide-react'
import type { LeadFull } from '@/lib/types/leads'

interface LeadMetricsProps {
  leads: LeadFull[]
  loading?: boolean
}

export function LeadMetrics({ leads, loading }: LeadMetricsProps) {
  const metrics = useMemo(() => {
    if (!leads || leads.length === 0) {
      return {
        totalLeads: 0,
        activeLeads: 0,
        wonLeads: 0,
        wonValue: 0,
        lostLeads: 0,
        totalValue: 0,
        newLeads: 0,
      }
    }

    const activeLeads = leads.filter((lead) => lead.status !== 'lost' && lead.status !== 'won')
    const wonLeads = leads.filter((lead) => lead.status === 'won')
    const lostLeads = leads.filter((lead) => lead.status === 'lost')
    const newLeads = leads.filter((lead) => lead.status === 'new')

    const totalValue = leads.reduce((sum, lead) => {
      return sum + (lead.value || 0)
    }, 0)

    const wonValue = wonLeads.reduce((sum, lead) => {
      return sum + (lead.value || 0)
    }, 0)

    return {
      totalLeads: leads.length,
      activeLeads: activeLeads.length,
      wonLeads: wonLeads.length,
      wonValue,
      lostLeads: lostLeads.length,
      totalValue,
      newLeads: newLeads.length,
    }
  }, [leads])

  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3 mb-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2 px-3 py-2">
              <div className="h-3 bg-muted rounded w-16"></div>
            </CardHeader>
            <CardContent className="px-3 pb-3">
              <div className="h-6 bg-muted rounded w-20 mb-1"></div>
              <div className="h-2 bg-muted rounded w-16"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const cards = [
    {
      title: 'Total Leads',
      value: metrics.totalLeads.toString(),
      subtitle: 'All leads',
      icon: Users,
      color: 'from-blue-500 to-blue-600',
    },
    {
      title: 'Active Leads',
      value: metrics.activeLeads.toString(),
      subtitle: `of ${metrics.totalLeads} total`,
      icon: TrendingUp,
      color: 'from-green-500 to-green-600',
    },
    {
      title: 'New Leads',
      value: metrics.newLeads.toString(),
      subtitle: 'Recently added',
      icon: Sparkles,
      color: 'from-purple-500 to-purple-600',
    },
    {
      title: 'Won Leads',
      value: metrics.wonLeads.toString(),
      subtitle: formatCurrency(metrics.wonValue),
      icon: CheckCircle,
      color: 'from-emerald-500 to-emerald-600',
    },
    {
      title: 'Lost Leads',
      value: metrics.lostLeads.toString(),
      subtitle: 'Closed lost',
      icon: XCircle,
      color: 'from-red-500 to-red-600',
    },
    {
      title: 'Total Value',
      value: formatCurrency(metrics.totalValue),
      subtitle: 'All leads combined',
      icon: DollarSign,
      color: 'from-orange-500 to-orange-600',
    },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3 mb-4">
      {cards.map((card) => (
        <Card key={card.title} className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 py-2">
            <CardTitle className="text-xs font-medium leading-tight">{card.title}</CardTitle>
            <div className={`h-6 w-6 sm:h-7 sm:w-7 rounded-md flex items-center justify-center bg-gradient-to-br ${card.color} flex-shrink-0`}>
              <card.icon className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-white" />
            </div>
          </CardHeader>
          <CardContent className="px-3 pb-3 pt-0">
            <div className="text-lg sm:text-xl font-bold">{card.value}</div>
            {card.subtitle && (
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 line-clamp-1">{card.subtitle}</p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

