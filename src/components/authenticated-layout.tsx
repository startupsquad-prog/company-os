'use client'

import { AppSidebar } from '@/components/app-sidebar'
import { DashboardTopbar } from '@/components/dashboard-topbar'
import { AiChat } from '@/components/ai/ai-chat'
import { MobileBottomNav } from '@/components/pwa/mobile-bottom-nav'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { useIsMobile } from '@/hooks/use-mobile'
import { cn } from '@/lib/utils'

interface AuthenticatedLayoutProps {
  children: React.ReactNode
}

export function AuthenticatedLayout({ children }: AuthenticatedLayoutProps) {
  const isMobile = useIsMobile()

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="overflow-hidden">
        <DashboardTopbar />
        <div
          className={cn(
            'flex flex-1 flex-col gap-2 p-2 sm:p-3 md:p-4 lg:p-5 min-w-0 overflow-x-hidden overflow-y-auto',
            isMobile && 'mobile-content-padding' // Add padding for bottom nav on mobile
          )}
        >
          {children}
        </div>
      </SidebarInset>
      <AiChat />
      <MobileBottomNav />
    </SidebarProvider>
  )
}
