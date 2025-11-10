'use client'

import { Row } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreHorizontal, Eye, Edit, Trash2, UserPlus } from 'lucide-react'
import type { TaskFull } from '@/lib/types/tasks'

interface TaskRowActionsProps {
  row: Row<TaskFull>
  onView?: (task: TaskFull) => void
  onEdit?: (task: TaskFull) => void
  onDelete?: (task: TaskFull) => void
  onAssign?: (task: TaskFull) => void
}

export function TaskRowActions({ row, onView, onEdit, onDelete, onAssign }: TaskRowActionsProps) {
  const task = row.original

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        {onView && (
          <DropdownMenuItem onClick={() => onView(task)}>
            <Eye className="mr-2 h-4 w-4" />
            View Details
          </DropdownMenuItem>
        )}
        {onEdit && (
          <DropdownMenuItem onClick={() => onEdit(task)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit Task
          </DropdownMenuItem>
        )}
        {onAssign && (
          <DropdownMenuItem onClick={() => onAssign(task)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Assign Users
          </DropdownMenuItem>
        )}
        {onDelete && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onDelete(task)} className="text-destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Task
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
