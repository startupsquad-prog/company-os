'use client'

import { ChevronRight, type LucideIcon } from 'lucide-react'
import { TransitionLink } from '@/components/common/TransitionLink'

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@/components/ui/sidebar'

interface NavItem {
  title: string
  url: string
  icon?: LucideIcon
  isActive?: boolean
  comingSoon?: boolean
  items?: {
    title: string
    url: string
    comingSoon?: boolean
  }[]
}

interface NavGroup {
  label: string
  items: NavItem[]
}

export function NavMain({
  groups,
}: {
  groups: NavGroup[]
}) {
  return (
    <>
      {groups.map((group) => (
        <SidebarGroup key={group.label}>
          <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
          <SidebarMenu>
            {group.items.map((item) => {
              // If only one item and it's the same as parent, show as single link (no dropdown)
              const hasMultipleItems = item.items && item.items.length > 1
              const singleItemSameAsParent = item.items && item.items.length === 1 && item.items[0].url === item.url

              if (!hasMultipleItems && (singleItemSameAsParent || !item.items)) {
                // Single item - no dropdown
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild tooltip={item.title}>
                      <TransitionLink href={item.url} className="relative flex items-center gap-1.5">
                        {item.icon && <item.icon />}
                        <span className="flex-1">{item.title}</span>
                        {item.comingSoon && (
                          <span className="text-[9px] leading-none bg-yellow-50 text-yellow-600 border border-yellow-200 rounded px-1 py-0.5 font-medium align-super">
                            Soon
                          </span>
                        )}
                      </TransitionLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              }

              // Multiple items - show as collapsible
              return (
                <Collapsible
                  key={item.title}
                  asChild
                  defaultOpen={item.isActive}
                  className="group/collapsible"
                >
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton tooltip={item.title}>
                        {item.icon && <item.icon />}
                        <span>{item.title}</span>
                        <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {item.items?.map((subItem) => (
                          <SidebarMenuSubItem key={subItem.title}>
                            <SidebarMenuSubButton asChild>
                              <TransitionLink href={subItem.url} className="relative flex items-center justify-between w-full">
                                <span>{subItem.title}</span>
                                {subItem.comingSoon && (
                                  <span className="text-[9px] leading-none bg-yellow-50 text-yellow-600 border border-yellow-200 rounded px-1 py-0.5 font-medium ml-auto">
                                    Soon
                                  </span>
                                )}
                              </TransitionLink>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              )
            })}
          </SidebarMenu>
        </SidebarGroup>
      ))}
    </>
  )
}
