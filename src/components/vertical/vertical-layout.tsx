'use client'

import { VerticalSidebar } from './vertical-sidebar'
import { VerticalTopbar } from './vertical-topbar'
import { AiChat } from '@/components/ai/ai-chat'
import { MobileBottomNav } from '@/components/pwa/mobile-bottom-nav'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { Sidebar, SidebarContent, SidebarHeader, SidebarRail } from '@/components/ui/sidebar'
import { OKSuiteModuleSelector } from '@/components/ok-suite-module-selector'
import { AppDock } from '@/components/app-dock'
import { useIsMobile } from '@/hooks/use-mobile'
import { cn } from '@/lib/utils'
import type { VerticalNavConfig } from '@/lib/navigation/vertical-nav-types'

interface VerticalLayoutProps {
  children: React.ReactNode
  config: VerticalNavConfig
}

export function VerticalLayout({ children, config }: VerticalLayoutProps) {
  const isMobile = useIsMobile()

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon" className="border-r">
        <SidebarHeader className="gap-1 p-1.5">
          <OKSuiteModuleSelector />
        </SidebarHeader>
        <AppDock />
        <SidebarContent>
          <VerticalSidebar config={config} />
        </SidebarContent>
        <SidebarRail />
      </Sidebar>
      <SidebarInset className="overflow-hidden">
        <VerticalTopbar config={config} />
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

