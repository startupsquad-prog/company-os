'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Ticket, AlertCircle, Clock, TrendingUp } from 'lucide-react'
import type { TicketFull } from '@/lib/types/tickets'
import { isPast } from 'date-fns'
import { useUser } from '@clerk/nextjs'

interface TicketMetricsProps {
  tickets: TicketFull[]
  loading?: boolean
}

export function TicketMetrics({ tickets, loading }: TicketMetricsProps) {
  const { user: clerkUser } = useUser()

  const metrics = useMemo(() => {
    if (!tickets || tickets.length === 0) {
      return {
        totalTickets: 0,
        openTickets: 0,
        overdueTickets: 0,
        highPriorityTickets: 0,
        myAssignedTickets: 0,
        resolvedTickets: 0,
      }
    }

    const now = new Date()
    
    // Total tickets
    const totalTickets = tickets.length

    // Open tickets (new, open, in_progress, waiting)
    const openStatuses = ['new', 'open', 'in_progress', 'waiting']
    const openTickets = tickets.filter((t) => t.status && openStatuses.includes(t.status)).length

    // Overdue tickets (past due date and not resolved/closed)
    const overdueTickets = tickets.filter((t) => {
      if (!t.due_date) return false
      const dueDate = new Date(t.due_date)
      const isOverdue = isPast(dueDate)
      const isResolved = t.status === 'resolved' || t.status === 'closed' || t.status === 'cancelled'
      return isOverdue && !isResolved
    }).length

    // High priority tickets (high or critical priority)
    const highPriorityTickets = tickets.filter((t) => {
      const isOpen = t.status && openStatuses.includes(t.status)
      const isHighPriority = t.priority === 'high' || t.priority === 'critical'
      return isOpen && isHighPriority
    }).length

    // My assigned tickets (for employees)
    const myAssignedTickets = clerkUser?.id
      ? tickets.filter((t) => {
          const isOpen = t.status && openStatuses.includes(t.status)
          // Check if assignee_id matches or if created_by matches
          return isOpen && (t.assignee_id === clerkUser.id || t.created_by === clerkUser.id)
        }).length
      : 0

    // Resolved tickets (resolved or closed)
    const resolvedTickets = tickets.filter(
      (t) => t.status === 'resolved' || t.status === 'closed'
    ).length

    return {
      totalTickets,
      openTickets,
      overdueTickets,
      highPriorityTickets,
      myAssignedTickets,
      resolvedTickets,
    }
  }, [tickets, clerkUser?.id])

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-1.5 pt-3 px-3">
              <div className="h-3 bg-muted rounded w-20"></div>
            </CardHeader>
            <CardContent className="px-3 pb-3">
              <div className="h-6 bg-muted rounded w-24 mb-1"></div>
              <div className="h-3 bg-muted rounded w-16"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const cards = [
    {
      title: 'Total Tickets',
      value: metrics.totalTickets.toString(),
      subtitle: `${metrics.resolvedTickets} resolved`,
      icon: Ticket,
      color: 'from-blue-500 to-blue-600',
    },
    {
      title: 'Open Tickets',
      value: metrics.openTickets.toString(),
      subtitle: `${metrics.totalTickets - metrics.openTickets} closed`,
      icon: AlertCircle,
      color: 'from-orange-500 to-orange-600',
    },
    {
      title: 'Overdue Tickets',
      value: metrics.overdueTickets.toString(),
      subtitle: 'Past due date',
      icon: Clock,
      color: 'from-red-500 to-red-600',
    },
    {
      title: 'High Priority',
      value: metrics.highPriorityTickets.toString(),
      subtitle: 'Critical & High priority',
      icon: TrendingUp,
      color: 'from-purple-500 to-purple-600',
    },
  ]

  // If user is logged in, show "My Tickets" instead of "High Priority" for employees
  if (clerkUser?.id && metrics.myAssignedTickets > 0) {
    cards[3] = {
      title: 'My Assigned Tickets',
      value: metrics.myAssignedTickets.toString(),
      subtitle: 'Assigned to me',
      icon: TrendingUp,
      color: 'from-green-500 to-green-600',
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
      {cards.map((card) => (
        <Card key={card.title} className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 pt-3 px-3">
            <CardTitle className="text-xs font-medium">{card.title}</CardTitle>
            <div className={`h-7 w-7 rounded-lg flex items-center justify-center bg-gradient-to-br ${card.color}`}>
              <card.icon className="h-3.5 w-3.5 text-white" />
            </div>
          </CardHeader>
          <CardContent className="px-3 pb-3">
            <div className="text-xl font-bold">{card.value}</div>
            {card.subtitle && (
              <p className="text-xs text-muted-foreground mt-0.5">{card.subtitle}</p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

