'use client'

import * as React from 'react'
import { ChevronsUpDown, Check, LayoutDashboard, UserCheck, UserCog, TrendingUp, ShoppingCart, BookOpen, Settings2, Clock } from 'lucide-react'
import { useGroupScope } from '@/lib/state/use-group-scope'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

interface NavGroup {
  label: string
  items: any[]
}

// Icon mapping for each group
const groupIcons: Record<string, LucideIcon> = {
  'Core': LayoutDashboard,
  'Recruitment': UserCheck,
  'Employees': UserCog,
  'Attendance & Leave': Clock,
  'Sales': TrendingUp,
  'Operations': ShoppingCart,
  'Common Modules': BookOpen,
  'Settings & Admin': Settings2,
}

// Description mapping for each group
const groupDescriptions: Record<string, string> = {
  'Core': 'Dashboard, Tasks, Projects',
  'Recruitment': 'Candidates, Interviews, Job Listings',
  'Employees': 'Employee Management, Reports, Documents',
  'Attendance & Leave': 'Attendance Tracking, Leave Requests',
  'Sales': 'Leads, Opportunities, CRM',
  'Operations': 'Orders, Shipments, Payments',
  'Common Modules': 'Knowledge, Communication, Tools',
  'Settings & Admin': 'Configuration & Access Control',
}

export function GroupSwitcher({ groups }: { groups: NavGroup[] }) {
  const { selectedGroup, setSelectedGroup } = useGroupScope()
  const [open, setOpen] = React.useState(false)

  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && (e.key.toLowerCase() === 'g')) {
        e.preventDefault()
        setOpen((o) => !o)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  // Get current group info
  const currentGroup = groups.find((g) => g.label === selectedGroup) || groups[0]
  const currentIcon = groupIcons[selectedGroup] || LayoutDashboard
  const currentDescription = groupDescriptions[selectedGroup] || 'All Modules'

  // Always show "Company OS" as the main title
  const displayName = 'Company OS'
  const displaySubtitle = selectedGroup === 'all' ? 'All Modules' : currentDescription

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="lg"
          className={cn(
            'h-12 gap-2 whitespace-nowrap bg-gradient-to-b from-[#4A4A4A] to-[#363636] text-white font-medium shadow-none border-none hover:from-[#4A4A4A] hover:to-[#363636] hover:text-white data-[state=open]:bg-gradient-to-b data-[state=open]:from-[#4A4A4A] data-[state=open]:to-[#363636] data-[state=open]:text-white',
            'px-3'
          )}
        >
          <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-white/10 text-white">
            {selectedGroup === 'all' ? (
              <LayoutDashboard className="size-4" />
            ) : (
              React.createElement(currentIcon, { className: 'size-4' })
            )}
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-semibold text-white">{displayName}</span>
            <span className="truncate text-xs text-white/80">{displaySubtitle}</span>
          </div>
          <ChevronsUpDown className="ml-auto h-3.5 w-3.5 text-[#CCCCCC]" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-56" sideOffset={6}>
        <DropdownMenuLabel className="text-xs text-muted-foreground">Navigation Group</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="gap-2"
          onClick={() => {
            setSelectedGroup('all')
            setOpen(false)
          }}
        >
          <Check className={cn('h-4 w-4', selectedGroup === 'all' ? 'opacity-100' : 'opacity-0')} />
          <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
          <span className="truncate">All Modules</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {groups.map((group) => {
          const Icon = groupIcons[group.label] || LayoutDashboard
          return (
            <DropdownMenuItem
              key={group.label}
              className="gap-2"
              onClick={() => {
                setSelectedGroup(group.label)
                setOpen(false)
              }}
            >
              <Check className={cn('h-4 w-4', selectedGroup === group.label ? 'opacity-100' : 'opacity-0')} />
              <Icon className="h-4 w-4 text-muted-foreground" />
              <span className="truncate">{group.label}</span>
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

