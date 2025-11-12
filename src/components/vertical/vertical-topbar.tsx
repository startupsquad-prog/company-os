'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { NotificationsDropdown } from '@/components/notifications-dropdown'
import { SearchCommand, SearchButton } from '@/components/search-command'
import { SalesCounter } from '@/components/sales-counter'
import { TopbarAgents } from '@/components/topbar-agents'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ThemeToggleButton } from '@/components/theme-toggle'
import { UserButton } from '@clerk/nextjs'
import { RollingUpdatesBanner } from '@/components/rolling-updates-banner'
import { useIsMobile } from '@/hooks/use-mobile'
import { ClientOnly } from '@/components/client-only'
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from '@/components/ui/breadcrumb'
import type { VerticalNavConfig } from '@/lib/navigation/vertical-nav-types'
import { Settings } from 'lucide-react'

interface VerticalTopbarProps {
  config: VerticalNavConfig
}

export function VerticalTopbar({ config }: VerticalTopbarProps) {
  const [searchOpen, setSearchOpen] = useState(false)
  const isMobile = useIsMobile()
  const pathname = usePathname()

  // Keyboard shortcut handler for Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault()
        setSearchOpen(true)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Generate breadcrumbs from pathname
  const generateBreadcrumbs = () => {
    const breadcrumbs = []
    
    // Add app name as first breadcrumb
    breadcrumbs.push({
      label: config.topbarTitle,
      href: config.basePath,
    })

    // Get path segments after basePath
    const basePathSegments = config.basePath.split('/').filter(Boolean)
    const currentPathSegments = pathname.split('/').filter(Boolean)
    
    // Skip segments that match basePath
    const relativeSegments = currentPathSegments.slice(basePathSegments.length)
    
    // Build breadcrumb path incrementally
    let breadcrumbPath = config.basePath
    relativeSegments.forEach((segment, index) => {
      breadcrumbPath += `/${segment}`
      const isLast = index === relativeSegments.length - 1
      breadcrumbs.push({
        label: segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' '),
        href: isLast ? undefined : breadcrumbPath,
      })
    })

    return breadcrumbs
  }

  const breadcrumbs = generateBreadcrumbs()
  const planBadgeColors = {
    free: 'bg-blue-50 text-blue-700 border-blue-200',
    pro: 'bg-purple-50 text-purple-700 border-purple-200',
    enterprise: 'bg-amber-50 text-amber-700 border-amber-200',
  }

  return (
    <div className="sticky top-0 z-50 isolate">
      {/* Rolling Updates Banner */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="px-2 sm:px-4 py-1.5 sm:py-2">
          <RollingUpdatesBanner />
        </div>
      </div>

      {/* Main Topbar */}
      <header className="flex h-14 sm:h-16 shrink-0 items-center gap-1 sm:gap-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-2 sm:px-4 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
        {/* Left: Sidebar Trigger + Breadcrumbs */}
        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0 min-w-0">
          <SidebarTrigger />
          {!isMobile && breadcrumbs.length > 1 && (
            <Breadcrumb className="hidden md:flex">
              <BreadcrumbList>
                {breadcrumbs.map((crumb, index) => (
                  <div key={index} className="flex items-center gap-1.5">
                    {index > 0 && <BreadcrumbSeparator />}
                    <BreadcrumbItem>
                      {crumb.href ? (
                        <BreadcrumbLink href={crumb.href} className="text-xs sm:text-sm">
                          {crumb.label}
                        </BreadcrumbLink>
                      ) : (
                        <BreadcrumbPage className="text-xs sm:text-sm">{crumb.label}</BreadcrumbPage>
                      )}
                    </BreadcrumbItem>
                  </div>
                ))}
              </BreadcrumbList>
            </Breadcrumb>
          )}
        </div>

        {/* Center: Search Bar - Hidden on mobile, shown on tablet+ */}
        {!isMobile && (
          <div className="flex-1 flex justify-center">
            <div className="w-full max-w-md">
              <SearchButton onClick={() => setSearchOpen(true)} />
            </div>
          </div>
        )}

        {/* Search Command Dialog */}
        <SearchCommand open={searchOpen} onOpenChange={setSearchOpen} />

        {/* Right: Actions & Profile */}
        <div className="flex items-center gap-1 sm:gap-2 ml-auto">
          {/* Plan Badge - Show when configured */}
          {config.planBadge && (
            <Badge variant="outline" className={planBadgeColors[config.planBadge]}>
              {config.planBadge.charAt(0).toUpperCase() + config.planBadge.slice(1)}
            </Badge>
          )}

          {/* Sales Counter - Hidden on mobile */}
          {!isMobile && <SalesCounter />}

          {/* Topbar Agents - Hidden on mobile */}
          {!isMobile && <TopbarAgents />}

          {/* Notifications - Always visible */}
          <NotificationsDropdown />

          {/* Theme Toggle - Hidden on mobile */}
          {!isMobile && (
            <ThemeToggleButton
              variant="circle"
              start="center"
              blur={true}
              size="icon"
              className="h-8 w-8 sm:h-9 sm:w-9"
            />
          )}

          {/* Settings - Hidden on mobile */}
          {!isMobile && (
            <>
              <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-9 sm:w-9">
                <Settings className="h-4 w-4" />
                <span className="sr-only">Settings</span>
              </Button>
              <Separator orientation="vertical" className="h-5 sm:h-6" />
            </>
          )}

          {/* User Button - Always visible */}
          <ClientOnly>
            <UserButton afterSignOutUrl="/login" />
          </ClientOnly>

          {/* Mobile Search Button - Only on mobile */}
          {isMobile && (
            <>
              <Separator orientation="vertical" className="h-5 sm:h-6" />
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 sm:h-9 sm:w-9"
                onClick={() => setSearchOpen(true)}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.3-4.3" />
                </svg>
                <span className="sr-only">Search</span>
              </Button>
            </>
          )}
        </div>
      </header>
    </div>
  )
}

