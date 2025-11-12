'use client'

import { ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreHorizontal, Edit, Trash2, Sparkles } from 'lucide-react'
import { format } from 'date-fns'
import type { RecruitmentCallFull } from '@/lib/types/recruitment'

export const createRecruitmentCallColumns = (handlers?: {
  onEdit?: (call: RecruitmentCallFull) => void
  onDelete?: (call: RecruitmentCallFull) => void
}): ColumnDef<RecruitmentCallFull>[] => {
  return [
    {
      accessorKey: 'candidate',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Candidate" />,
      cell: ({ row }) => {
        const candidate = row.original.candidate
        return candidate?.contact?.name || '—'
      },
    },
    {
      accessorKey: 'call_type',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Type" />,
      cell: ({ row }) => {
        const type = row.getValue('call_type') as string
        return <Badge variant="outline">{type}</Badge>
      },
    },
    {
      accessorKey: 'call_date',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Date" />,
      cell: ({ row }) => {
        const date = row.getValue('call_date') as string
        return date ? format(new Date(date), 'MMM d, yyyy HH:mm') : '—'
      },
    },
    {
      accessorKey: 'duration_minutes',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Duration" />,
      cell: ({ row }) => {
        const duration = row.getValue('duration_minutes') as number
        return duration ? `${duration} min` : '—'
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const call = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => {
                  // TODO: Implement AI Transcribe & Summarize
                  console.log('AI Transcribe & Summarize for call:', call.id)
                }}
              >
                <Sparkles className="mr-2 h-4 w-4" />
                AI Transcribe & Summarize
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {handlers?.onEdit && (
                <DropdownMenuItem onClick={() => handlers.onEdit!(call)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              {handlers?.onDelete && (
                <DropdownMenuItem onClick={() => handlers.onDelete!(call)} className="text-destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]
}


