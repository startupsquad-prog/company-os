'use client'

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface DashboardTabsProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

export function DashboardTabs({ activeTab, onTabChange }: DashboardTabsProps) {
  return (
    <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
      <TabsList className="h-9 w-fit">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="sales">Sales</TabsTrigger>
        <TabsTrigger value="operations">Operations</TabsTrigger>
        <TabsTrigger value="hr">HR</TabsTrigger>
        <TabsTrigger value="clients">Clients</TabsTrigger>
      </TabsList>
    </Tabs>
  )
}

