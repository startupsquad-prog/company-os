'use client'

import { AppSidebar } from '@/components/app-sidebar'
import { DashboardTopbar } from '@/components/dashboard-topbar'
import { AiChat } from '@/components/ai/ai-chat'
import { AgentChatManager } from '@/components/ai/agent-chat-manager'
import {
  SidebarInset,
  SidebarProvider,
} from '@/components/ui/sidebar'

interface AuthenticatedLayoutProps {
  children: React.ReactNode
}

export function AuthenticatedLayout({ children }: AuthenticatedLayoutProps) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="overflow-hidden">
        <DashboardTopbar />
        <div className="flex flex-1 flex-col gap-4 p-4 md:p-6 lg:p-8 min-w-0 overflow-x-hidden overflow-y-auto">
          {children}
        </div>
      </SidebarInset>
      <AiChat />
      <AgentChatManager />
    </SidebarProvider>
  )
}

