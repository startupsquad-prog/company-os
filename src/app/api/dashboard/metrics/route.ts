import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'
import { auth } from '@clerk/nextjs/server'
import { format, subDays, startOfDay, endOfDay } from 'date-fns'

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createClient()
    const searchParams = request.nextUrl.searchParams
    const from = searchParams.get('from')
    const to = searchParams.get('to')
    const tab = searchParams.get('tab') || 'overview'

    // Default to last 30 days if no date range provided
    const dateFrom = from ? new Date(from) : subDays(new Date(), 30)
    const dateTo = to ? new Date(to) : new Date()

    let metrics: any = {}

    if (tab === 'overview' || tab === 'all') {
      // Tasks metrics
      const tasksQuery = supabase.from('tasks').select('id, status, due_date, created_at', { count: 'exact' }).is('deleted_at', null)
      if (from) tasksQuery.gte('created_at', from)
      if (to) tasksQuery.lte('created_at', to)
      const { data: tasks, count: tasksCount } = await tasksQuery
      const tasksTyped = tasks as any

      const tasksCompleted = tasksTyped?.filter((t: any) => t.status === 'completed').length || 0
      const now = new Date().toISOString()
      const tasksOverdue = tasksTyped?.filter((t: any) => t.due_date && t.due_date < now && t.status !== 'completed').length || 0

      // Calculate trend (compare with previous period)
      const prevPeriodStart = subDays(dateFrom, Math.ceil((dateTo.getTime() - dateFrom.getTime()) / (1000 * 60 * 60 * 24)))
      const { count: prevTasksCount } = await supabase
        .from('tasks')
        .select('id', { count: 'exact', head: true })
        .is('deleted_at', null)
        .gte('created_at', prevPeriodStart.toISOString())
        .lt('created_at', dateFrom.toISOString())
      const tasksTrend = prevTasksCount && prevTasksCount > 0 ? ((tasksCount || 0 - prevTasksCount) / prevTasksCount) * 100 : 0

      // Leads metrics
      const leadsQuery = supabase.from('leads').select('id, status, created_at', { count: 'exact' }).is('deleted_at', null)
      if (from) leadsQuery.gte('created_at', from)
      if (to) leadsQuery.lte('created_at', to)
      const { data: leads, count: leadsCount } = await leadsQuery
      const leadsTyped = leads as any

      const leadsNew = leadsTyped?.filter((l: any) => {
        const created = new Date(l.created_at)
        const daysDiff = (Date.now() - created.getTime()) / (1000 * 60 * 60 * 24)
        return daysDiff <= 7
      }).length || 0
      const leadsConverted = leadsTyped?.filter((l: any) => l.status === 'converted' || l.status === 'won').length || 0

      const { count: prevLeadsCount } = await supabase
        .from('leads')
        .select('id', { count: 'exact', head: true })
        .is('deleted_at', null)
        .gte('created_at', prevPeriodStart.toISOString())
        .lt('created_at', dateFrom.toISOString())
      const leadsTrend = prevLeadsCount && prevLeadsCount > 0 ? ((leadsCount || 0 - prevLeadsCount) / prevLeadsCount) * 100 : 0

      // Orders metrics
      const ordersQuery = supabase.from('orders').select('id, status, created_at', { count: 'exact' }).is('deleted_at', null)
      if (from) ordersQuery.gte('created_at', from)
      if (to) ordersQuery.lte('created_at', to)
      const { data: orders, count: ordersCount } = await ordersQuery
      const ordersTyped = orders as any

      const ordersPending = ordersTyped?.filter((o: any) => o.status === 'pending' || o.status === 'processing').length || 0
      const ordersCompleted = ordersTyped?.filter((o: any) => o.status === 'completed' || o.status === 'delivered').length || 0

      // Calculate revenue from order_items
      const orderIds = ordersTyped?.map((o: any) => o.id) || []
      let revenue = 0
      if (orderIds.length > 0) {
        const { data: orderItems } = await supabase
          .from('order_items')
          .select('price, quantity')
          .in('order_id', orderIds)
          .is('deleted_at', null)
        revenue = (orderItems as any)?.reduce((sum: number, item: any) => sum + (Number(item.price) || 0) * (item.quantity || 0), 0) || 0
      }

      const { count: prevOrdersCount } = await supabase
        .from('orders')
        .select('id', { count: 'exact', head: true })
        .is('deleted_at', null)
        .gte('created_at', prevPeriodStart.toISOString())
        .lt('created_at', dateFrom.toISOString())
      const ordersTrend = prevOrdersCount && prevOrdersCount > 0 ? ((ordersCount || 0 - prevOrdersCount) / prevOrdersCount) * 100 : 0

      // Applications metrics
      const applicationsQuery = supabase
        .from('applications')
        .select('id, created_at', { count: 'exact' })
        .is('deleted_at', null)
      if (from) applicationsQuery.gte('created_at', from)
      if (to) applicationsQuery.lte('created_at', to)
      const { data: applications, count: applicationsCount } = await applicationsQuery
      const applicationsTyped = applications as any

      const applicationsNew = applicationsTyped?.filter((a: any) => {
        const created = new Date(a.created_at)
        const daysDiff = (Date.now() - created.getTime()) / (1000 * 60 * 60 * 24)
        return daysDiff <= 7
      }).length || 0

      // Interviews count
      const interviewsQuery = supabase.from('interviews').select('id', { count: 'exact', head: true }).is('deleted_at', null)
      if (from) interviewsQuery.gte('created_at', from)
      if (to) interviewsQuery.lte('created_at', to)
      const { count: interviewsCount } = await interviewsQuery

      // Activity Trend Data (last 30 days) - OPTIMIZED: Single batch query
      const daysToShow = Math.min(30, Math.ceil((dateTo.getTime() - dateFrom.getTime()) / (1000 * 60 * 60 * 24)))
      const trendStart = subDays(dateTo, daysToShow - 1)
      
      // Fetch all data at once
      const [tasksTrendData, leadsTrendData, ordersTrendData, applicationsTrendData] = await Promise.all([
        supabase
          .from('tasks')
          .select('created_at')
          .is('deleted_at', null)
          .gte('created_at', startOfDay(trendStart).toISOString())
          .lte('created_at', endOfDay(dateTo).toISOString()),
        supabase
          .from('leads')
          .select('created_at')
          .is('deleted_at', null)
          .gte('created_at', startOfDay(trendStart).toISOString())
          .lte('created_at', endOfDay(dateTo).toISOString()),
        supabase
          .from('orders')
          .select('created_at')
          .is('deleted_at', null)
          .gte('created_at', startOfDay(trendStart).toISOString())
          .lte('created_at', endOfDay(dateTo).toISOString()),
        supabase
          .from('applications')
          .select('created_at')
          .is('deleted_at', null)
          .gte('created_at', startOfDay(trendStart).toISOString())
          .lte('created_at', endOfDay(dateTo).toISOString()),
      ])

      // Group by date in JavaScript
      const activityTrendData = []
      for (let i = daysToShow - 1; i >= 0; i--) {
        const date = subDays(dateTo, i)
        const dateStr = format(date, 'yyyy-MM-dd')
        const dayStart = startOfDay(date).getTime()
        const dayEnd = endOfDay(date).getTime()

        const dayTasks = ((tasksTrendData.data as any) || []).filter((t: any) => {
          const created = new Date(t.created_at).getTime()
          return created >= dayStart && created <= dayEnd
        }).length

        const dayLeads = ((leadsTrendData.data as any) || []).filter((l: any) => {
          const created = new Date(l.created_at).getTime()
          return created >= dayStart && created <= dayEnd
        }).length

        const dayOrders = ((ordersTrendData.data as any) || []).filter((o: any) => {
          const created = new Date(o.created_at).getTime()
          return created >= dayStart && created <= dayEnd
        }).length

        const dayApplications = ((applicationsTrendData.data as any) || []).filter((a: any) => {
          const created = new Date(a.created_at).getTime()
          return created >= dayStart && created <= dayEnd
        }).length

        activityTrendData.push({
          date: dateStr,
          tasks: dayTasks,
          leads: dayLeads,
          orders: dayOrders,
          applications: dayApplications,
        })
      }

      // Module Distribution
      const moduleDistribution = [
        { name: 'Tasks', value: tasksCount || 0 },
        { name: 'Leads', value: leadsCount || 0 },
        { name: 'Orders', value: ordersCount || 0 },
        { name: 'Applications', value: applicationsCount || 0 },
      ]

      // Status Overview
      const taskStatusCounts = tasksTyped?.reduce((acc: any, task: any) => {
        acc[task.status] = (acc[task.status] || 0) + 1
        return acc
      }, {}) || {}
      const leadStatusCounts = leadsTyped?.reduce((acc: any, lead: any) => {
        acc[lead.status] = (acc[lead.status] || 0) + 1
        return acc
      }, {}) || {}
      const orderStatusCounts = orders?.reduce((acc: any, order: any) => {
        acc[order.status] = (acc[order.status] || 0) + 1
        return acc
      }, {}) || {}

      const statusOverview = {
        tasks: Object.entries(taskStatusCounts).map(([status, count]) => ({ status, count: count as number })),
        leads: Object.entries(leadStatusCounts).map(([status, count]) => ({ status, count: count as number })),
        orders: Object.entries(orderStatusCounts).map(([status, count]) => ({ status, count: count as number })),
      }

      // Recent Activity (from activity_events)
      const { data: recentActivity } = await supabase
        .from('activity_events')
        .select('id, entity_type, action, created_at, created_by')
        .order('created_at', { ascending: false })
        .limit(15)

      // Get user names for activities
      const recentActivityTyped = recentActivity as any
      const userIds = [...new Set(recentActivityTyped?.map((a: any) => a.created_by).filter(Boolean) || [])]
      let profilesMap: Record<string, any> = {}
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, user_id, first_name, last_name')
          .in('user_id', userIds)
        profilesMap = ((profiles as any) || []).reduce((acc: any, p: any) => {
          acc[p.user_id] = p
          return acc
        }, {} as Record<string, any>)
      }

      const recentActivityWithNames = (recentActivityTyped || []).map((activity: any) => ({
        ...activity,
        created_by_name: activity.created_by
          ? `${profilesMap[activity.created_by]?.first_name || ''} ${profilesMap[activity.created_by]?.last_name || ''}`.trim() || 'Unknown'
          : 'System',
      }))

      metrics.overview = {
        tasks: { total: tasksCount || 0, completed: tasksCompleted, overdue: tasksOverdue, trend: tasksTrend },
        leads: { total: leadsCount || 0, new: leadsNew, converted: leadsConverted, trend: leadsTrend },
        orders: { total: ordersCount || 0, pending: ordersPending, completed: ordersCompleted, revenue, trend: ordersTrend },
        applications: { total: applicationsCount || 0, new: applicationsNew, interviews: interviewsCount || 0 },
        activityTrend: activityTrendData,
        moduleDistribution,
        statusOverview,
        recentActivity: recentActivityWithNames,
      }
    }

    if (tab === 'sales' || tab === 'all') {
      // Sales metrics - enhanced with chart data
      const leadsQuery = supabase.from('leads').select('id, status, value, created_at, source', { count: 'exact' }).is('deleted_at', null)
      if (from) leadsQuery.gte('created_at', from)
      if (to) leadsQuery.lte('created_at', to)
      const { data: leads } = await leadsQuery
      const leadsSalesTyped = leads as any

      const leadsNew = leadsSalesTyped?.filter((l: any) => {
        const created = new Date(l.created_at)
        const daysDiff = (Date.now() - created.getTime()) / (1000 * 60 * 60 * 24)
        return daysDiff <= 7
      }).length || 0
      const leadsConverted = leadsSalesTyped?.filter((l: any) => l.status === 'converted' || l.status === 'won').length || 0
      const leadsValue = leadsSalesTyped?.reduce((sum: number, l: any) => sum + (Number(l.value) || 0), 0) || 0

      // Opportunities
      const opportunitiesQuery = supabase
        .from('opportunities')
        .select('id, stage_id, value, created_at', { count: 'exact' })
        .is('deleted_at', null)
      if (from) opportunitiesQuery.gte('created_at', from)
      if (to) opportunitiesQuery.lte('created_at', to)
      const { data: opportunities, count: opportunitiesCount } = await opportunitiesQuery
      const opportunitiesTyped = opportunities as any

      const opportunitiesOpen = opportunitiesTyped?.filter((o: any) => o.stage_id).length || 0
      const opportunitiesWon = 0 // Would need to check stage name
      const opportunitiesValue = opportunitiesTyped?.reduce((sum: number, o: any) => sum + (Number(o.value) || 0), 0) || 0

      // Quotations (CRM)
      const quotationsQuery = supabase
        .from('quotations')
        .select('id, status, total_amount, created_at', { count: 'exact' })
        .is('deleted_at', null)
      if (from) quotationsQuery.gte('created_at', from)
      if (to) quotationsQuery.lte('created_at', to)
      const { data: quotations, count: quotationsCount } = await quotationsQuery
      const quotationsSalesTyped = quotations as any

      const quotationsSent = quotationsSalesTyped?.filter((q: any) => q.status === 'sent' || q.status === 'viewed').length || 0
      const quotationsApproved = quotationsSalesTyped?.filter((q: any) => q.status === 'accepted').length || 0
      const quotationsValue = quotationsSalesTyped?.reduce((sum: number, q: any) => sum + (Number(q.total_amount) || 0), 0) || 0

      // Calls
      const callsQuery = supabase.from('calls').select('id, status, duration, created_at', { count: 'exact' }).is('deleted_at', null)
      if (from) callsQuery.gte('created_at', from)
      if (to) callsQuery.lte('created_at', to)
      const { data: calls, count: callsCount } = await callsQuery
      const callsTyped = calls as any

      const callsCompleted = callsTyped?.filter((c: any) => c.status === 'completed').length || 0
      const callsScheduled = callsTyped?.filter((c: any) => c.status === 'scheduled').length || 0
      const avgCallDuration = callsTyped && callsTyped.length > 0 ? callsTyped.reduce((sum: number, c: any) => sum + (Number(c.duration) || 0), 0) / callsTyped.length : 0

      // Lead Source Distribution
      const leadSourceCounts = leadsSalesTyped?.reduce((acc: any, lead: any) => {
        const source = lead.source || 'other'
        acc[source] = (acc[source] || 0) + 1
        return acc
      }, {}) || {}
      const leadSourceDistribution = Object.entries(leadSourceCounts).map(([name, value]) => ({ name, value: value as number }))

      // Revenue Trend (from won opportunities and approved quotations) - OPTIMIZED
      const daysToShow = Math.min(30, Math.ceil((dateTo.getTime() - dateFrom.getTime()) / (1000 * 60 * 60 * 24)))
      const trendStart = subDays(dateTo, daysToShow - 1)
      
      // Fetch all quotations at once
      const { data: allQuotations } = await supabase
        .from('quotations')
        .select('total_amount, created_at')
        .is('deleted_at', null)
        .eq('status', 'accepted')
        .gte('created_at', startOfDay(trendStart).toISOString())
        .lte('created_at', endOfDay(dateTo).toISOString())

      // Group by date
      const revenueTrendData = []
      for (let i = daysToShow - 1; i >= 0; i--) {
        const date = subDays(dateTo, i)
        const dateStr = format(date, 'yyyy-MM-dd')
        const dayStart = startOfDay(date).getTime()
        const dayEnd = endOfDay(date).getTime()

        const dayRevenue = ((allQuotations as any) || []).reduce((sum: number, q: any) => {
          const created = new Date(q.created_at).getTime()
          if (created >= dayStart && created <= dayEnd) {
            return sum + (Number(q.total_amount) || 0)
          }
          return sum
        }, 0)

        revenueTrendData.push({
          date: dateStr,
          revenue: dayRevenue,
        })
      }

      metrics.sales = {
        leads: { total: leads?.length || 0, new: leadsNew, converted: leadsConverted, value: leadsValue },
        opportunities: {
          total: opportunitiesCount || 0,
          open: opportunitiesOpen,
          won: opportunitiesWon,
          value: opportunitiesValue,
        },
        quotations: {
          total: quotationsCount || 0,
          sent: quotationsSent,
          approved: quotationsApproved,
          value: quotationsValue,
        },
        calls: { total: callsCount || 0, completed: callsCompleted, scheduled: callsScheduled, avgDuration: avgCallDuration },
        leadSourceDistribution,
        revenueTrend: revenueTrendData,
      }
    }

    if (tab === 'operations' || tab === 'all') {
      // Operations metrics
      const ordersQuery = supabase.from('orders').select('id, status, created_at', { count: 'exact' }).is('deleted_at', null)
      if (from) ordersQuery.gte('created_at', from)
      if (to) ordersQuery.lte('created_at', to)
      const { data: orders, count: ordersCount } = await ordersQuery
      const ordersOpsTyped = orders as any

      const ordersPending = ordersOpsTyped?.filter((o: any) => o.status === 'pending' || o.status === 'processing').length || 0
      const ordersCompleted = ordersOpsTyped?.filter((o: any) => o.status === 'completed' || o.status === 'delivered').length || 0

      // Calculate revenue
      const orderIds = ordersOpsTyped?.map((o: any) => o.id) || []
      let revenue = 0
      if (orderIds.length > 0) {
        const { data: orderItems } = await supabase
          .from('order_items')
          .select('price, quantity')
          .in('order_id', orderIds)
          .is('deleted_at', null)
        revenue = (orderItems as any)?.reduce((sum: number, item: any) => sum + (Number(item.price) || 0) * (item.quantity || 0), 0) || 0
      }

      // Quotations (Ops - all types)
      const quotationsQuery = supabase
        .from('quotations')
        .select('id, status, amount, quotation_type, created_at', { count: 'exact' })
        .is('deleted_at', null)
      if (from) quotationsQuery.gte('created_at', from)
      if (to) quotationsQuery.lte('created_at', to)
      const { data: quotations, count: quotationsCount } = await quotationsQuery
      const quotationsOpsTyped = quotations as any

      const quotationsPending = quotationsOpsTyped?.filter((q: any) => q.status === 'draft' || q.status === 'sent').length || 0
      const quotationsApproved = quotationsOpsTyped?.filter((q: any) => q.status === 'approved').length || 0
      const quotationsValue = quotationsOpsTyped?.reduce((sum: number, q: any) => sum + (Number(q.amount) || 0), 0) || 0

      // Quotation Types Breakdown
      const quotationTypeCounts = quotationsOpsTyped?.reduce((acc: any, q: any) => {
        const type = q.quotation_type || 'unknown'
        acc[type] = (acc[type] || 0) + 1
        return acc
      }, {}) || {}
      const quotationTypes = Object.entries(quotationTypeCounts).map(([name, value]) => ({ name, value: value as number }))

      // Shipments
      const shipmentsQuery = supabase.from('shipments').select('id, status, shipment_type, created_at', { count: 'exact' }).is('deleted_at', null)
      if (from) shipmentsQuery.gte('created_at', from)
      if (to) shipmentsQuery.lte('created_at', to)
      const { data: shipments, count: shipmentsCount } = await shipmentsQuery
      const shipmentsTyped = shipments as any

      const shipmentsInTransit = shipmentsTyped?.filter((s: any) => s.status === 'in_transit').length || 0
      const shipmentsDelivered = shipmentsTyped?.filter((s: any) => s.status === 'delivered').length || 0
      const shipmentsPending = shipmentsTyped?.filter((s: any) => s.status === 'pending').length || 0

      // Shipment Types
      const shipmentTypeCounts = shipmentsTyped?.reduce((acc: any, s: any) => {
        const type = s.shipment_type || 'unknown'
        acc[type] = (acc[type] || 0) + 1
        return acc
      }, {}) || {}
      const shipmentTypes = Object.entries(shipmentTypeCounts).map(([name, value]) => ({ name, value: value as number }))

      // Payments
      const paymentsQuery = supabase.from('payments').select('id, status, amount, created_at', { count: 'exact' }).is('deleted_at', null)
      if (from) paymentsQuery.gte('created_at', from)
      if (to) paymentsQuery.lte('created_at', to)
      const { data: payments, count: paymentsCount } = await paymentsQuery
      const paymentsTyped = payments as any

      const paymentsPending = paymentsTyped?.filter((p: any) => p.status === 'pending').length || 0
      const paymentsCompleted = paymentsTyped?.filter((p: any) => p.status === 'completed' || p.status === 'paid').length || 0
      const paymentsAmount = paymentsTyped?.reduce((sum: number, p: any) => sum + (Number(p.amount) || 0), 0) || 0

      // Order Status Distribution
      const orderStatusCounts = ordersOpsTyped?.reduce((acc: any, order: any) => {
        acc[order.status] = (acc[order.status] || 0) + 1
        return acc
      }, {}) || {}
      const orderStatusDistribution = Object.entries(orderStatusCounts).map(([name, value]) => ({ name, value: value as number }))

      // Shipment Status Timeline - OPTIMIZED
      const daysToShow = Math.min(30, Math.ceil((dateTo.getTime() - dateFrom.getTime()) / (1000 * 60 * 60 * 24)))
      const trendStart = subDays(dateTo, daysToShow - 1)
      
      // Fetch all shipments at once
      const { data: allShipments } = await supabase
        .from('shipments')
        .select('status, created_at')
        .is('deleted_at', null)
        .gte('created_at', startOfDay(trendStart).toISOString())
        .lte('created_at', endOfDay(dateTo).toISOString())

      // Group by date
      const shipmentStatusTimeline = []
      for (let i = daysToShow - 1; i >= 0; i--) {
        const date = subDays(dateTo, i)
        const dateStr = format(date, 'yyyy-MM-dd')
        const dayStart = startOfDay(date).getTime()
        const dayEnd = endOfDay(date).getTime()

        const dayShipments = ((allShipments as any) || []).filter((s: any) => {
          const created = new Date(s.created_at).getTime()
          return created >= dayStart && created <= dayEnd
        })

        const statusCounts = dayShipments.reduce((acc: any, s: any) => {
          acc[s.status] = (acc[s.status] || 0) + 1
          return acc
        }, {})

        shipmentStatusTimeline.push({
          date: dateStr,
          pending: statusCounts.pending || 0,
          in_transit: statusCounts.in_transit || 0,
          delivered: statusCounts.delivered || 0,
          returned: statusCounts.returned || 0,
          cancelled: statusCounts.cancelled || 0,
        })
      }

      metrics.operations = {
        orders: { total: ordersCount || 0, pending: ordersPending, completed: ordersCompleted, revenue },
        quotations: {
          total: quotationsCount || 0,
          pending: quotationsPending,
          approved: quotationsApproved,
          value: quotationsValue,
        },
        shipments: {
          total: shipmentsCount || 0,
          inTransit: shipmentsInTransit,
          delivered: shipmentsDelivered,
          pending: shipmentsPending,
        },
        payments: {
          total: paymentsCount || 0,
          pending: paymentsPending,
          completed: paymentsCompleted,
          amount: paymentsAmount,
        },
        quotationTypes,
        shipmentTypes,
        orderStatusDistribution,
        shipmentStatusTimeline,
      }
    }

    if (tab === 'hr' || tab === 'all') {
      // HR metrics
      const { count: employeesCount } = await supabase
        .from('employees')
        .select('id', { count: 'exact', head: true })
        .is('deleted_at', null)
      const employeesActive = employeesCount || 0

      // Attendance
      const today = new Date().toISOString().split('T')[0]
      const { count: attendanceToday } = await supabase
        .from('attendance_sessions')
        .select('id', { count: 'exact', head: true })
        .eq('date', today)
        .is('deleted_at', null)

      const { data: attendanceSessions } = await supabase
        .from('attendance_sessions')
        .select('id, status, date')
        .is('deleted_at', null)
      if (from) {
        // Filter by date range if provided
      }
      const attendanceSessionsTyped = attendanceSessions as any

      const attendancePresent = attendanceSessionsTyped?.filter((a: any) => a.status === 'present' || a.status === 'checked_in').length || 0
      const attendanceAbsent = attendanceSessionsTyped?.filter((a: any) => a.status === 'absent').length || 0
      const attendanceLate = 0 // Would need to check check-in time

      // Leave requests
      const leaveRequestsQuery = supabase
        .from('leave_requests')
        .select('id, status, leave_type, created_at', { count: 'exact' })
        .is('deleted_at', null)
      if (from) leaveRequestsQuery.gte('created_at', from)
      if (to) leaveRequestsQuery.lte('created_at', to)
      const { data: leaveRequests, count: leaveRequestsCount } = await leaveRequestsQuery
      const leaveRequestsTyped = leaveRequests as any

      const leaveRequestsPending = leaveRequestsTyped?.filter((l: any) => l.status === 'pending').length || 0
      const leaveRequestsApproved = leaveRequestsTyped?.filter((l: any) => l.status === 'approved').length || 0
      const leaveRequestsRejected = leaveRequestsTyped?.filter((l: any) => l.status === 'rejected').length || 0

      // Leave Types Distribution
      const leaveTypeCounts = leaveRequestsTyped?.reduce((acc: any, l: any) => {
        const type = l.leave_type || 'other'
        acc[type] = (acc[type] || 0) + 1
        return acc
      }, {}) || {}
      const leaveTypes = Object.entries(leaveTypeCounts).map(([name, value]) => ({ name, value: value as number }))

      // Attendance Trend - OPTIMIZED
      const daysToShow = Math.min(30, Math.ceil((dateTo.getTime() - dateFrom.getTime()) / (1000 * 60 * 60 * 24)))
      const trendStart = subDays(dateTo, daysToShow - 1)
      
      // Fetch all attendance sessions at once
      const { data: allSessions } = await supabase
        .from('attendance_sessions')
        .select('status, created_at')
        .is('deleted_at', null)
        .gte('created_at', startOfDay(trendStart).toISOString())
        .lte('created_at', endOfDay(dateTo).toISOString())

      // Group by date
      const attendanceTrendData = []
      for (let i = daysToShow - 1; i >= 0; i--) {
        const date = subDays(dateTo, i)
        const dateStr = format(date, 'yyyy-MM-dd')
        const dayStart = startOfDay(date).getTime()
        const dayEnd = endOfDay(date).getTime()

        const daySessions = ((allSessions as any) || []).filter((s: any) => {
          const created = new Date(s.created_at).getTime()
          return created >= dayStart && created <= dayEnd
        })

        const present = daySessions.filter((s: any) => s.status === 'present' || s.status === 'checked_in').length
        const absent = daySessions.filter((s: any) => s.status === 'absent').length
        const late = 0 // Would need time-based calculation

        attendanceTrendData.push({
          date: dateStr,
          present,
          absent,
          late,
        })
      }

      // Attendance Rate Trend
      const attendanceRateData = attendanceTrendData.map((day) => {
        const total = day.present + day.absent
        const rate = total > 0 ? (day.present / total) * 100 : 0
        return {
          date: day.date,
          rate: Math.round(rate * 10) / 10,
        }
      })

      metrics.hr = {
        employees: { total: employeesCount || 0, active: employeesActive, onLeave: 0 },
        attendance: {
          present: attendancePresent,
          absent: attendanceAbsent,
          late: attendanceLate,
          today: attendanceToday || 0,
        },
        leaveRequests: {
          total: leaveRequestsCount || 0,
          pending: leaveRequestsPending,
          approved: leaveRequestsApproved,
          rejected: leaveRequestsRejected,
        },
        leaveTypes,
        attendanceTrend: attendanceTrendData,
        attendanceRateTrend: attendanceRateData,
      }
    }

    if (tab === 'clients' || tab === 'all') {
      // Clients metrics
      const companiesQuery = supabase.from('companies').select('id, created_at', { count: 'exact' }).is('deleted_at', null)
      if (from) companiesQuery.gte('created_at', from)
      if (to) companiesQuery.lte('created_at', to)
      const { data: companies, count: companiesCount } = await companiesQuery
      const companiesTyped = companies as any

      const companiesNew = companiesTyped?.filter((c: any) => {
        const created = new Date(c.created_at)
        const daysDiff = (Date.now() - created.getTime()) / (1000 * 60 * 60 * 24)
        return daysDiff <= 30
      }).length || 0
      const companiesActive = companiesCount || 0

      // Contacts
      const contactsQuery = supabase.from('contacts').select('id, created_at', { count: 'exact' }).is('deleted_at', null)
      if (from) contactsQuery.gte('created_at', from)
      if (to) contactsQuery.lte('created_at', to)
      const { data: contacts, count: contactsCount } = await contactsQuery
      const contactsTyped = contacts as any

      const contactsNew = contactsTyped?.filter((c: any) => {
        const created = new Date(c.created_at)
        const daysDiff = (Date.now() - created.getTime()) / (1000 * 60 * 60 * 24)
        return daysDiff <= 30
      }).length || 0
      const contactsActive = contactsCount || 0

      // Client leads
      const leadsQuery = supabase.from('leads').select('id, status, company_id, created_at', { count: 'exact' }).is('deleted_at', null)
      if (from) leadsQuery.gte('created_at', from)
      if (to) leadsQuery.lte('created_at', to)
      const { data: leads, count: leadsCount } = await leadsQuery
      const leadsClientsTyped = leads as any

      const leadsActive = leadsClientsTyped?.filter((l: any) => l.status !== 'closed' && l.status !== 'lost').length || 0
      const leadsConverted = leadsClientsTyped?.filter((l: any) => l.status === 'converted' || l.status === 'won').length || 0

      // Client Growth Trend - OPTIMIZED
      const daysToShow = Math.min(30, Math.ceil((dateTo.getTime() - dateFrom.getTime()) / (1000 * 60 * 60 * 24)))
      const trendStart = subDays(dateTo, daysToShow - 1)
      
      // Fetch all data at once
      const [companiesData, contactsData] = await Promise.all([
        supabase
          .from('companies')
          .select('created_at')
          .is('deleted_at', null)
          .gte('created_at', startOfDay(trendStart).toISOString())
          .lte('created_at', endOfDay(dateTo).toISOString()),
        supabase
          .from('contacts')
          .select('created_at')
          .is('deleted_at', null)
          .gte('created_at', startOfDay(trendStart).toISOString())
          .lte('created_at', endOfDay(dateTo).toISOString()),
      ])

      // Group by date
      const clientGrowthData = []
      for (let i = daysToShow - 1; i >= 0; i--) {
        const date = subDays(dateTo, i)
        const dateStr = format(date, 'yyyy-MM-dd')
        const dayStart = startOfDay(date).getTime()
        const dayEnd = endOfDay(date).getTime()

        const dayCompanies = ((companiesData.data as any) || []).filter((c: any) => {
          const created = new Date(c.created_at).getTime()
          return created >= dayStart && created <= dayEnd
        }).length

        const dayContacts = ((contactsData.data as any) || []).filter((c: any) => {
          const created = new Date(c.created_at).getTime()
          return created >= dayStart && created <= dayEnd
        }).length

        clientGrowthData.push({
          date: dateStr,
          companies: dayCompanies,
          contacts: dayContacts,
        })
      }

      // Revenue calculation (simplified - would need actual order/payment data linked to companies)
      const revenueTotal = 0
      const revenueThisMonth = 0
      const revenueLastMonth = 0

      metrics.clients = {
        companies: { total: companiesCount || 0, active: companiesActive, new: companiesNew },
        contacts: { total: contactsCount || 0, active: contactsActive, new: contactsNew },
        leads: { total: leadsCount || 0, active: leadsActive, converted: leadsConverted },
        revenue: { total: revenueTotal, thisMonth: revenueThisMonth, lastMonth: revenueLastMonth },
        clientGrowthTrend: clientGrowthData,
      }
    }

    return NextResponse.json({ metrics })
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error)
    return NextResponse.json({ error: 'Failed to fetch metrics' }, { status: 500 })
  }
}
