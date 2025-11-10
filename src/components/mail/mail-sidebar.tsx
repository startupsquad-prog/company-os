'use client'

import {
  Inbox,
  FileText,
  Send,
  Ban,
  Trash2,
  Archive,
  ChevronDown,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { MailFolder, MailCategory } from './types'
import { useUser } from '@clerk/nextjs'

interface MailSidebarProps {
  folders: MailFolder[]
  categories: MailCategory[]
  selectedFolderId?: string
  selectedCategoryId?: string
  onSelectFolder: (folderId: string) => void
  onSelectCategory: (categoryId: string) => void
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Inbox,
  FileText,
  Send,
  Ban,
  Trash2,
  Archive,
}

export function MailSidebar({
  folders,
  categories,
  selectedFolderId,
  selectedCategoryId,
  onSelectFolder,
  onSelectCategory,
}: MailSidebarProps) {
  const { user } = useUser()
  const userName = user?.fullName || user?.firstName || 'User'
  const userEmail = user?.emailAddresses?.[0]?.emailAddress || 'user@example.com'

  return (
    <div className="flex flex-col h-full w-full overflow-hidden">
      {/* User Section - Compact, Sticky to Top */}
      <div className="px-2 py-1.5 flex-shrink-0">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center justify-between w-full hover:bg-accent rounded-md px-2 py-1.5 transition-colors">
              <div className="flex items-center gap-2 min-w-0">
                <div className="flex-shrink-0">
                  <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-xs font-semibold text-primary">
                      {userName
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .toUpperCase()
                        .slice(0, 2)}
                    </span>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium truncate">{userName}</div>
                  <div className="text-[10px] text-muted-foreground truncate">
                    {userEmail}
                  </div>
                </div>
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuItem>View Profile</DropdownMenuItem>
            <DropdownMenuItem>Settings</DropdownMenuItem>
            <DropdownMenuItem>Sign Out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Separator />

      {/* Folders and Categories Section - Scrollable */}
      <ScrollArea className="flex-1 min-h-0">
        <div className="py-1">
          {/* Folders */}
          {folders.map((folder) => {
            const Icon = iconMap[folder.icon] || Inbox
            const isActive = folder.id === selectedFolderId

            return (
              <button
                key={folder.id}
                onClick={() => onSelectFolder(folder.id)}
                className={cn(
                  'w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors hover:bg-accent',
                  isActive && 'bg-muted font-medium'
                )}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">{folder.name}</span>
                </div>
                {folder.unreadCount !== undefined && folder.unreadCount > 0 && (
                  <Badge
                    variant="secondary"
                    className="ml-2 flex-shrink-0 text-xs h-5 min-w-[20px] px-1.5"
                  >
                    {folder.unreadCount}
                  </Badge>
                )}
              </button>
            )
          })}

          <Separator className="my-2" />

          {/* Categories */}
          {categories.map((category) => {
            const isActive = category.id === selectedCategoryId

            return (
              <button
                key={category.id}
                onClick={() => onSelectCategory(category.id)}
                className={cn(
                  'w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors hover:bg-accent',
                  isActive && 'bg-muted font-medium'
                )}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div
                    className={cn(
                      'h-2 w-2 rounded-full flex-shrink-0',
                      category.color
                    )}
                  />
                  <span className="truncate">{category.name}</span>
                </div>
                <Badge
                  variant="secondary"
                  className="ml-2 flex-shrink-0 text-xs h-5 min-w-[20px] px-1.5"
                >
                  {category.count}
                </Badge>
              </button>
            )
          })}
        </div>
      </ScrollArea>
    </div>
  )
}

