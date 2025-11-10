'use client'

import { useState } from 'react'
import { Search, Trash2, Archive, Clock, MoreVertical } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

interface EmailListHeaderProps {
  folderName: string
  filterMode: 'all' | 'unread'
  onFilterChange: (mode: 'all' | 'unread') => void
  onSearchChange: (query: string) => void
  onDelete?: () => void
  onArchive?: () => void
  onSnooze?: () => void
}

export function EmailListHeader({
  folderName,
  filterMode,
  onFilterChange,
  onSearchChange,
  onDelete,
  onArchive,
  onSnooze,
}: EmailListHeaderProps) {
  const [searchQuery, setSearchQuery] = useState('')

  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    onSearchChange(value)
  }

  return (
    <div className="flex flex-col gap-3 px-4 py-4 border-b bg-background flex-shrink-0">
      {/* Header Row */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{folderName}</h2>
        <div className="flex items-center gap-1">
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            onClick={onDelete}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            onClick={onArchive}
          >
            <Archive className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            onClick={onSnooze}
          >
            <Clock className="h-4 w-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="ghost" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Mark as Read</DropdownMenuItem>
              <DropdownMenuItem>Mark as Unread</DropdownMenuItem>
              <DropdownMenuItem>Move to Folder</DropdownMenuItem>
              <DropdownMenuItem>Add Label</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Filter Buttons */}
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant={filterMode === 'all' ? 'default' : 'ghost'}
          onClick={() => onFilterChange('all')}
          className="h-8"
        >
          All
        </Button>
        <Button
          size="sm"
          variant={filterMode === 'unread' ? 'default' : 'ghost'}
          onClick={() => onFilterChange('unread')}
          className="h-8"
        >
          Unread
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Q Search"
          value={searchQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>
    </div>
  )
}

