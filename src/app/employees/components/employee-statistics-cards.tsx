'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, UserCheck, Clock, UserX } from 'lucide-react'
import type { EmployeeStats } from './types'

interface EmployeeStatisticsCardsProps {
  stats: EmployeeStats
}

export function EmployeeStatisticsCards({ stats }: EmployeeStatisticsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
      <Card className="bg-gradient-to-t from-primary/5 to-card shadow-xs">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 pt-3 px-3">
          <CardTitle className="text-xs font-medium">Total Employees</CardTitle>
          <Users className="h-3.5 w-3.5 text-muted-foreground" />
        </CardHeader>
        <CardContent className="px-3 pb-3 pt-0">
          <div className="text-xl font-bold">{stats.total}</div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-t from-primary/5 to-card shadow-xs">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 pt-3 px-3">
          <CardTitle className="text-xs font-medium">Active</CardTitle>
          <UserCheck className="h-3.5 w-3.5 text-muted-foreground" />
        </CardHeader>
        <CardContent className="px-3 pb-3 pt-0">
          <div className="text-xl font-bold">{stats.active}</div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-t from-primary/5 to-card shadow-xs">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 pt-3 px-3">
          <CardTitle className="text-xs font-medium">Onboarding</CardTitle>
          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
        </CardHeader>
        <CardContent className="px-3 pb-3 pt-0">
          <div className="text-xl font-bold">{stats.onboarding}</div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-t from-primary/5 to-card shadow-xs">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 pt-3 px-3">
          <CardTitle className="text-xs font-medium">Resigned</CardTitle>
          <UserX className="h-3.5 w-3.5 text-muted-foreground" />
        </CardHeader>
        <CardContent className="px-3 pb-3 pt-0">
          <div className="text-xl font-bold">{stats.resigned}</div>
        </CardContent>
      </Card>
    </div>
  )
}

