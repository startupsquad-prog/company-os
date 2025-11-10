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
import { MoreHorizontal, Eye, Edit, Trash2 } from 'lucide-react'
import { format, isPast } from 'date-fns'
import type { TicketFull, TicketStatus, TicketPriority } from '@/lib/types/tickets'

const statusConfig: Record<
  TicketStatus,
  { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }
> = {
  new: { label: 'New', variant: 'outline' },
  open: { label: 'Open', variant: 'default' },
  in_progress: { label: 'In Progress', variant: 'default' },
  waiting: { label: 'Waiting', variant: 'secondary' },
  resolved: { label: 'Resolved', variant: 'secondary' },
  closed: { label: 'Closed', variant: 'secondary' },
  cancelled: { label: 'Cancelled', variant: 'destructive' },
}

const priorityConfig: Record<TicketPriority, { label: string; className: string }> = {
  low: { label: 'Low', className: 'bg-gray-100 text-gray-800 border-gray-200' },
  medium: { label: 'Medium', className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  high: { label: 'High', className: 'bg-orange-100 text-orange-800 border-orange-200' },
  critical: { label: 'Critical', className: 'bg-red-100 text-red-800 border-red-200' },
}

export const createTicketColumns = (handlers?: {
  onView?: (ticket: TicketFull) => void
  onEdit?: (ticket: TicketFull) => void
  onDelete?: (ticket: TicketFull) => void
}): ColumnDef<TicketFull>[] => {
  const onView = handlers?.onView
  const onEdit = handlers?.onEdit
  const onDelete = handlers?.onDelete

  return [
    {
      accessorKey: 'ticket_number',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Ticket #" />,
      cell: ({ row }) => {
        const ticket = row.original
        return (
          <Button
            variant="link"
            className="h-auto p-0 font-medium text-left justify-start font-mono"
            onClick={() => onView?.(ticket)}
          >
            {ticket.ticket_number}
          </Button>
        )
      },
    },
    {
      accessorKey: 'title',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Title" />,
      cell: ({ row }) => {
        const ticket = row.original
        return (
          <Button
            variant="link"
            className="h-auto p-0 font-medium text-left justify-start"
            onClick={() => onView?.(ticket)}
          >
            {ticket.title}
          </Button>
        )
      },
    },
    {
      accessorKey: 'client',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Client" />,
      cell: ({ row }) => {
        const client = row.original.client
        const clientName = row.original.client_name
        return client ? (
          <div className="flex flex-col">
            <span className="font-medium">{client.name}</span>
            {client.email && <span className="text-xs text-muted-foreground">{client.email}</span>}
          </div>
        ) : clientName ? (
          <span className="text-sm">{clientName}</span>
        ) : (
          <span className="text-muted-foreground">—</span>
        )
      },
    },
    {
      accessorKey: 'status',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
      cell: ({ row }) => {
        const status = row.getValue('status') as TicketStatus | null
        if (!status) return <span className="text-muted-foreground">—</span>
        const config = statusConfig[status] || { label: status, variant: 'outline' as const }
        return <Badge variant={config.variant}>{config.label}</Badge>
      },
      filterFn: (row, id, value) => {
        const status = row.getValue(id) as TicketStatus | null
        return value.includes(status || '')
      },
    },
    {
      accessorKey: 'priority',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Priority" />,
      cell: ({ row }) => {
        const priority = row.getValue('priority') as TicketPriority | null
        if (!priority) return <span className="text-muted-foreground">—</span>
        const config = priorityConfig[priority] || { label: priority, className: '' }
        return <Badge className={config.className}>{config.label}</Badge>
      },
      filterFn: (row, id, value) => {
        const priority = row.getValue(id) as TicketPriority | null
        return value.includes(priority || '')
      },
    },
    {
      accessorKey: 'assignee',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Assignee" />,
      cell: ({ row }) => {
        const assignee = row.original.assignee
        return assignee ? (
          <span className="text-sm">
            {[assignee.first_name, assignee.last_name].filter(Boolean).join(' ') || 'Unknown'}
          </span>
        ) : (
          <span className="text-muted-foreground">Unassigned</span>
        )
      },
    },
    {
      accessorKey: 'due_date',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Due Date" />,
      cell: ({ row }) => {
        const date = row.getValue('due_date') as string | null
        if (!date) return <span className="text-muted-foreground">—</span>
        const isOverdue = isPast(new Date(date))
        return (
          <span className={`text-sm ${isOverdue ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>
            {format(new Date(date), 'MMM d, yyyy')}
          </span>
        )
      },
    },
    {
      accessorKey: 'created_at',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Created" />,
      cell: ({ row }) => {
        const date = row.getValue('created_at') as string
        return <span className="text-sm text-muted-foreground">{format(new Date(date), 'MMM d, yyyy')}</span>
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const ticket = row.original

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
              <DropdownMenuItem onClick={() => onView?.(ticket)}>
                <Eye className="mr-2 h-4 w-4" />
                View
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onEdit?.(ticket)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDelete?.(ticket)} className="text-destructive">
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

