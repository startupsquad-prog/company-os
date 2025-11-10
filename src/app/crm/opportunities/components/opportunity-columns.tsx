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
import { format } from 'date-fns'
import type { OpportunityFull } from '@/lib/types/opportunities'

export const createOpportunityColumns = (handlers?: {
  onView?: (opportunity: OpportunityFull) => void
  onEdit?: (opportunity: OpportunityFull) => void
  onDelete?: (opportunity: OpportunityFull) => void
}): ColumnDef<OpportunityFull>[] => {
  const onView = handlers?.onView
  const onEdit = handlers?.onEdit
  const onDelete = handlers?.onDelete

  return [
    {
      accessorKey: 'lead',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Lead" />,
      cell: ({ row }) => {
        const lead = row.original.lead
        return lead?.contact ? (
          <div className="flex flex-col">
            <Button
              variant="link"
              className="h-auto p-0 font-medium text-left justify-start"
              onClick={() => onView?.(row.original)}
            >
              {lead.contact.name}
            </Button>
            {lead.company && (
              <span className="text-xs text-muted-foreground">{lead.company.name}</span>
            )}
          </div>
        ) : (
          <span className="text-muted-foreground">—</span>
        )
      },
    },
    {
      accessorKey: 'pipeline',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Pipeline" />,
      cell: ({ row }) => {
        const pipeline = row.original.pipeline
        return pipeline ? (
          <Badge variant="outline">{pipeline.name}</Badge>
        ) : (
          <span className="text-muted-foreground">—</span>
        )
      },
    },
    {
      accessorKey: 'stage',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Stage" />,
      cell: ({ row }) => {
        const stage = row.original.stage
        return stage ? (
          <Badge variant="default">{stage.name}</Badge>
        ) : (
          <span className="text-muted-foreground">—</span>
        )
      },
    },
    {
      accessorKey: 'lead.value',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Value" />,
      cell: ({ row }) => {
        const value = row.original.lead?.value
        return value ? (
          <span className="text-sm font-medium">
            {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)}
          </span>
        ) : (
          <span className="text-muted-foreground">—</span>
        )
      },
    },
    {
      accessorKey: 'lead.status',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Lead Status" />,
      cell: ({ row }) => {
        const status = row.original.lead?.status
        if (!status) return <span className="text-muted-foreground">—</span>
        return <Badge variant="outline">{status}</Badge>
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
        const opportunity = row.original

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
              <DropdownMenuItem onClick={() => onView?.(opportunity)}>
                <Eye className="mr-2 h-4 w-4" />
                View
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onEdit?.(opportunity)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDelete?.(opportunity)} className="text-destructive">
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

