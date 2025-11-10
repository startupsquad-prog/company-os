'use client'

import { Settings, UserPlus } from 'lucide-react'
import { useState, useEffect } from 'react'
import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { NotificationsDropdown } from '@/components/notifications-dropdown'
import { SearchCommand, SearchButton } from '@/components/search-command'
import { SalesCounter } from '@/components/sales-counter'
import { TopbarAgents } from '@/components/topbar-agents'
import { Button } from '@/components/ui/button'
import { ThemeToggleButton } from '@/components/theme-toggle'
import { InviteUserDialog } from '@/components/invite-user-dialog'
import { UserButton } from '@clerk/nextjs'
import { useUserRole } from '@/lib/hooks/useUserRole'
import { useRole } from '@/lib/roles/use-role'
import { RollingUpdatesBanner } from '@/components/rolling-updates-banner'
import { useIsMobile } from '@/hooks/use-mobile'

export function DashboardTopbar() {
  const [searchOpen, setSearchOpen] = useState(false)
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false)
  const { role: userRole } = useUserRole()
  const { activeRole } = useRole()
  const isMobile = useIsMobile()

  // Check if user can invite (admin or superadmin)
  const effectiveRole = userRole ?? (activeRole?.role_name as 'employee' | 'manager' | 'admin' | 'superadmin' | null)
  const canInvite = effectiveRole === 'admin' || effectiveRole === 'superadmin'

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
        {/* Left: Sidebar Trigger */}
        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          <SidebarTrigger />
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
        <UserButton afterSignOutUrl="/login" />
          
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

      {/* Invite User Dialog */}
      <InviteUserDialog
        open={inviteDialogOpen}
        onOpenChange={setInviteDialogOpen}
        onSuccess={() => {
          // Optionally refresh user list or show success message
        }}
      />
      </header>
    </div>
  )
}
