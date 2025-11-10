'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { useIsMobile } from '@/hooks/use-mobile'
import {
  LayoutDashboard,
  CheckSquare,
  MessageSquare,
  Calendar,
  User,
} from 'lucide-react'

interface NavItem {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: number
}

const navItems: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Tasks',
    href: '/tasks',
    icon: CheckSquare,
  },
  {
    title: 'Messages',
    href: '/messages',
    icon: MessageSquare,
  },
  {
    title: 'Calendar',
    href: '/calendar',
    icon: Calendar,
  },
  {
    title: 'Profile',
    href: '/users',
    icon: User,
  },
]

export function MobileBottomNav() {
  const pathname = usePathname()
  const isMobile = useIsMobile()

  // Don't render on desktop or on auth pages
  if (!isMobile || pathname?.startsWith('/login') || pathname?.startsWith('/sign-in')) {
    return null
  }

  return (
    <nav
      className={cn(
        'fixed bottom-0 left-0 right-0 z-50',
        'bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80',
        'border-t border-border',
        'safe-area-inset-bottom', // For devices with home indicator
        'shadow-lg'
      )}
      style={{
        paddingBottom: 'env(safe-area-inset-bottom, 0)',
      }}
    >
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center',
                'min-w-[44px] min-h-[44px]', // Minimum touch target
                'px-3 py-2 rounded-lg',
                'transition-colors duration-200',
                'text-muted-foreground',
                isActive
                  ? 'text-primary bg-primary/10'
                  : 'hover:text-foreground hover:bg-accent/50 active:bg-accent'
              )}
            >
              <div className="relative">
                <Icon className={cn('h-5 w-5', isActive && 'text-primary')} />
                {item.badge && item.badge > 0 && (
                  <span
                    className={cn(
                      'absolute -top-1 -right-1',
                      'flex items-center justify-center',
                      'h-4 w-4 rounded-full',
                      'text-[10px] font-semibold',
                      'bg-primary text-primary-foreground'
                    )}
                  >
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                )}
              </div>
              <span
                className={cn(
                  'text-[10px] mt-0.5 font-medium',
                  isActive ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                {item.title}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

