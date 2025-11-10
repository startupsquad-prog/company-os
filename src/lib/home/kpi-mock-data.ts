import { KPI } from '@/components/home/types'
import { CheckSquare, Users, DollarSign, UserCheck } from 'lucide-react'

export const getKPIData = (dateFilter: { from: Date | undefined; to: Date | undefined }): KPI[] => {
  // Mock data - in real app, this would be fetched based on dateFilter
  const isToday = dateFilter.from && dateFilter.to && 
    dateFilter.from.toDateString() === new Date().toDateString() &&
    dateFilter.to.toDateString() === new Date().toDateString()

  return [
    {
      id: 'tasks',
      title: 'Tasks',
      value: 142,
      change: isToday ? 12 : 8,
      trend: 'up',
      icon: CheckSquare,
      subtitle: '98 completed • 5 overdue',
      color: 'from-green-500 to-emerald-500',
    },
    {
      id: 'leads',
      title: 'Leads',
      value: 89,
      change: isToday ? 15 : 6,
      trend: 'up',
      icon: Users,
      subtitle: '12 new today • $245K value',
      color: 'from-blue-500 to-cyan-500',
    },
    {
      id: 'revenue',
      title: 'Revenue',
      value: '$124.5K',
      change: isToday ? 18 : 12,
      trend: 'up',
      icon: DollarSign,
      subtitle: 'Today • $1.2M this month',
      color: 'from-amber-500 to-orange-500',
    },
    {
      id: 'active-users',
      title: 'Active Users',
      value: 47,
      change: -3,
      trend: 'down',
      icon: UserCheck,
      subtitle: 'Online now • 156 total',
      color: 'from-purple-500 to-pink-500',
    },
  ]
}

