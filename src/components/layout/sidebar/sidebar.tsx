'use client'

import * as React from 'react'
import { TransitionLink } from '@/components/common/TransitionLink'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  CheckSquare,
  BookOpen,
  Users,
  FileText,
  ShoppingCart,
  Package,
  Shield,
  Menu,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/layout/sidebar/sidebar-menu'

const navigation = [
  {
    title: 'Main',
    items: [
      {
        title: 'Dashboard',
        url: '/dashboard',
        icon: LayoutDashboard,
      },
      {
        title: 'Tasks',
        url: '/tasks',
        icon: CheckSquare,
      },
      {
        title: 'Knowledge',
        url: '/knowledge',
        icon: BookOpen,
      },
    ],
  },
  {
    title: 'Modules',
    items: [
      {
        title: 'CRM',
        url: '/crm',
        icon: Users,
      },
      {
        title: 'ATS',
        url: '/ats',
        icon: FileText,
      },
      {
        title: 'Operations',
        url: '/ops',
        icon: ShoppingCart,
      },
      {
        title: 'Import Ops',
        url: '/import-ops',
        icon: Package,
      },
    ],
  },
  {
    title: 'System',
    items: [
      {
        title: 'Admin Access',
        url: '/admin',
        icon: Shield,
      },
      {
        title: 'Login Preview',
        url: '/auth/login',
        icon: Shield,
      },
    ],
  },
]

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  isCollapsed?: boolean
  onCollapse?: () => void
}

export function Sidebar({ className, isCollapsed = false, onCollapse, ...props }: SidebarProps) {
  const pathname = usePathname()

  return (
    <div
      className={cn(
        'flex h-full flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300',
        isCollapsed ? 'w-16' : 'w-64',
        className
      )}
      {...props}
    >
      {/* Header */}
      <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
        {!isCollapsed && (
          <h2 className="text-lg font-semibold text-sidebar-foreground">Company OS</h2>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={onCollapse}
          className="hover:bg-sidebar-accent transition-colors duration-200"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4">
          {navigation.map((group) => (
            <SidebarGroup key={group.title}>
              {!isCollapsed && (
                <SidebarGroupLabel className="text-xs font-semibold text-sidebar-foreground/60 uppercase tracking-wider">
                  {group.title}
                </SidebarGroupLabel>
              )}
              <SidebarMenu>
                {group.items.map((item) => {
                  const Icon = item.icon
                  const isActive = pathname === item.url

                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        className={cn(
                          'w-full justify-start transition-all duration-200 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground animate-fade-in',
                          isActive && 'bg-sidebar-accent text-sidebar-accent-foreground',
                          isCollapsed && 'justify-center px-0'
                        )}
                      >
                        <TransitionLink href={item.url}>
                          <Icon className="h-5 w-5" />
                          {!isCollapsed && <span className="ml-2">{item.title}</span>}
                        </TransitionLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroup>
          ))}
        </div>
      </nav>
    </div>
  )
}
