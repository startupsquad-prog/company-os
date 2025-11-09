'use client'

import { Button } from '@/components/ui/button'
import { User } from 'lucide-react'
import { OverdueTasksBadge } from '@/components/overdue-tasks-badge'
import { ThemeToggleButton } from '@/components/theme-toggle'

export function Topbar() {
  return (
    <div className="flex flex-1 items-center justify-between">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-semibold text-foreground">Company OS</h1>
      </div>
      <div className="flex items-center gap-2">
        <OverdueTasksBadge />
        <ThemeToggleButton variant="circle" start="center" blur={true} />
        <Button variant="ghost" size="icon">
          <User className="h-5 w-5" />
        </Button>
      </div>
    </div>
  )
}
