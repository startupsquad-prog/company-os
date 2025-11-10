'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { LayoutDashboard, Users, FileText, ShoppingCart, Settings, Menu, X } from 'lucide-react'

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/' },
  { icon: Users, label: 'CRM', href: '/crm' },
  { icon: FileText, label: 'ATS', href: '/ats' },
  { icon: ShoppingCart, label: 'Operations', href: '/ops' },
  { icon: Settings, label: 'Settings', href: '/settings' },
]

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false)

  return (
    <aside
      className={cn(
        'flex flex-col border-r bg-card transition-all duration-300',
        isCollapsed ? 'w-16' : 'w-64'
      )}
    >
      <div className="flex h-16 items-center justify-between border-b px-4">
        {!isCollapsed && <h2 className="text-lg font-semibold">Company OS</h2>}
        <Button variant="ghost" size="icon" onClick={() => setIsCollapsed(!isCollapsed)}>
          {isCollapsed ? <Menu className="h-5 w-5" /> : <X className="h-5 w-5" />}
        </Button>
      </div>
      <nav className="flex-1 space-y-1 p-4">
        {menuItems.map((item) => {
          const Icon = item.icon
          return (
            <Button
              key={item.href}
              variant="ghost"
              className={cn('w-full justify-start', isCollapsed && 'justify-center px-0')}
            >
              <Icon className="h-5 w-5" />
              {!isCollapsed && <span className="ml-2">{item.label}</span>}
            </Button>
          )
        })}
      </nav>
    </aside>
  )
}
