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
import { MoreHorizontal, Eye, Edit, Trash2, Sparkles } from 'lucide-react'
import { format } from 'date-fns'
import type { InterviewFull, InterviewType, InterviewStatus } from '@/lib/types/recruitment'

const typeConfig: Record<InterviewType, { label: string }> = {
  phone_screen: { label: 'Phone Screen' },
  technical: { label: 'Technical' },
  behavioral: { label: 'Behavioral' },
  panel: { label: 'Panel' },
  final: { label: 'Final' },
  other: { label: 'Other' },
}

const statusConfig: Record<InterviewStatus, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
  scheduled: { label: 'Scheduled', variant: 'outline' },
  in_progress: { label: 'In Progress', variant: 'default' },
  completed: { label: 'Completed', variant: 'default' },
  cancelled: { label: 'Cancelled', variant: 'destructive' },
  no_show: { label: 'No Show', variant: 'destructive' },
}

export const createInterviewColumns = (handlers?: {
  onView?: (interview: InterviewFull) => void
  onEdit?: (interview: InterviewFull) => void
  onDelete?: (interview: InterviewFull) => void
}): ColumnDef<InterviewFull>[] => {
  const onView = handlers?.onView
  const onEdit = handlers?.onEdit
  const onDelete = handlers?.onDelete

  return [
    {
      accessorKey: 'candidate',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Candidate" />,
      cell: ({ row }) => {
        const interview = row.original
        const candidate = interview.candidate
        const contact = candidate?.contact
        const name = contact?.name || 'Unknown'

        return (
          <Button
            variant="link"
            className="h-auto p-0 font-medium text-left justify-start"
            onClick={(e) => {
              e.stopPropagation()
              onView?.(interview)
            }}
          >
            {name}
          </Button>
        )
      },
    },
    {
      accessorKey: 'interview_type',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Type" />,
      cell: ({ row }) => {
        const type = row.getValue('interview_type') as InterviewType
        const config = typeConfig[type] || { label: type }
        return <Badge variant="outline">{config.label}</Badge>
      },
    },
    {
      accessorKey: 'status',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
      cell: ({ row }) => {
        const status = row.getValue('status') as InterviewStatus
        const config = statusConfig[status] || { label: status, variant: 'outline' as const }
        return <Badge variant={config.variant}>{config.label}</Badge>
      },
    },
    {
      accessorKey: 'scheduled_at',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Scheduled At" />,
      cell: ({ row }) => {
        const date = row.getValue('scheduled_at') as string | null
        return date ? (
          <span className="text-sm">
            {format(new Date(date), 'MMM d, yyyy HH:mm')}
          </span>
        ) : (
          <span className="text-muted-foreground">—</span>
        )
      },
    },
    {
      accessorKey: 'interviewers',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Interviewers" />,
      cell: ({ row }) => {
        const interviewers = row.original.interviewers || []
        if (interviewers.length === 0) return <span className="text-muted-foreground">—</span>
        return (
          <span className="text-sm">
            {interviewers.length} {interviewers.length === 1 ? 'interviewer' : 'interviewers'}
          </span>
        )
      },
    },
    {
      accessorKey: 'duration_minutes',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Duration" />,
      cell: ({ row }) => {
        const duration = row.getValue('duration_minutes') as number | null
        return duration ? (
          <span className="text-sm">{duration} min</span>
        ) : (
          <span className="text-muted-foreground">—</span>
        )
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const interview = row.original

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
              <DropdownMenuItem onClick={() => onView?.(interview)}>
                <Eye className="mr-2 h-4 w-4" />
                View
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit?.(interview)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  // TODO: Implement AI Generate Questions
                  console.log('AI Generate Questions for interview:', interview.id)
                }}
              >
                <Sparkles className="mr-2 h-4 w-4" />
                AI Generate Questions
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onDelete?.(interview)} className="text-destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]
}

