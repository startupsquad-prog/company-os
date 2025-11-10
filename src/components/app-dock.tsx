'use client'

import * as React from 'react'
import Image from 'next/image'
import { useSidebar } from '@/components/ui/sidebar'
import { cn } from '@/lib/utils'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

const apps = [
  {
    name: 'Slack',
    url: 'https://slack.com',
    logo: '/brandfetch/slack-svgrepo-com (1).svg',
  },
  {
    name: 'WhatsApp',
    url: 'https://web.whatsapp.com',
    logo: '/brandfetch/whatsapp-icon-logo-svgrepo-com.svg',
  },
  {
    name: 'Gmail',
    url: 'https://mail.google.com',
    logo: '/brandfetch/gmail-svgrepo-com.svg',
  },
  {
    name: 'Google Sheets',
    url: 'https://docs.google.com/spreadsheets',
    logo: '/brandfetch/sheets-sheet-svgrepo-com.svg',
  },
]

export function AppDock() {
  const { state } = useSidebar()
  const isCollapsed = state === 'collapsed'

  return (
    <TooltipProvider>
      <div
        className={cn(
          'flex items-center gap-1.5 px-2 py-0.5',
          isCollapsed ? 'flex-col justify-start' : 'flex-row justify-start'
        )}
      >
        {apps.map((app) => (
          <Tooltip key={app.name}>
            <TooltipTrigger asChild>
              <a
                href={app.url}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  'relative flex items-center justify-center',
                  'w-9 h-9 rounded-md',
                  'bg-sidebar-accent/50 hover:bg-sidebar-accent',
                  'transition-all duration-300 ease-out',
                  'hover:-translate-y-0.5 hover:shadow-sm',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring',
                  'group cursor-pointer'
                )}
                aria-label={`Open ${app.name} in new tab`}
              >
                <div className="relative w-6 h-6 transition-transform duration-300 group-hover:scale-110">
                  <Image
                    src={app.logo}
                    alt={app.name}
                    fill
                    className="object-contain"
                    unoptimized
                  />
                </div>
              </a>
            </TooltipTrigger>
            {isCollapsed && (
              <TooltipContent side="right" sideOffset={8}>
                <p>{app.name}</p>
              </TooltipContent>
            )}
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  )
}
