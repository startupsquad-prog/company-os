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
import type { QuotationFull, QuotationStatus } from '@/lib/types/quotations'

const statusConfig: Record<
  QuotationStatus,
  { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }
> = {
  draft: { label: 'Draft', variant: 'outline' },
  sent: { label: 'Sent', variant: 'default' },
  viewed: { label: 'Viewed', variant: 'default' },
  accepted: { label: 'Accepted', variant: 'default' },
  rejected: { label: 'Rejected', variant: 'destructive' },
  expired: { label: 'Expired', variant: 'secondary' },
  cancelled: { label: 'Cancelled', variant: 'destructive' },
}

export const createQuotationColumns = (handlers?: {
  onView?: (quotation: QuotationFull) => void
  onEdit?: (quotation: QuotationFull) => void
  onDelete?: (quotation: QuotationFull) => void
}): ColumnDef<QuotationFull>[] => {
  const onView = handlers?.onView
  const onEdit = handlers?.onEdit
  const onDelete = handlers?.onDelete

  return [
    {
      accessorKey: 'quote_number',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Quote #" />,
      cell: ({ row }) => {
        const quotation = row.original
        return (
          <Button
            variant="link"
            className="h-auto p-0 font-medium text-left justify-start font-mono"
            onClick={() => onView?.(quotation)}
          >
            {quotation.quote_number}
          </Button>
        )
      },
    },
    {
      accessorKey: 'lead',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Lead" />,
      cell: ({ row }) => {
        const lead = row.original.lead
        return lead?.contact ? (
          <div className="flex flex-col">
            <span className="font-medium">{lead.contact.name}</span>
            {lead.contact.email && (
              <span className="text-xs text-muted-foreground">{lead.contact.email}</span>
            )}
          </div>
        ) : (
          <span className="text-muted-foreground">—</span>
        )
      },
    },
    {
      accessorKey: 'total_amount',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Amount" />,
      cell: ({ row }) => {
        const amount = row.getValue('total_amount') as number
        const currency = row.original.currency || 'USD'
        return (
          <span className="text-sm font-medium">
            {new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount)}
          </span>
        )
      },
    },
    {
      accessorKey: 'status',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
      cell: ({ row }) => {
        const status = row.getValue('status') as QuotationStatus | null
        if (!status) return <span className="text-muted-foreground">—</span>
        const config = statusConfig[status] || { label: status, variant: 'outline' as const }
        return <Badge variant={config.variant}>{config.label}</Badge>
      },
      filterFn: (row, id, value) => {
        const status = row.getValue(id) as QuotationStatus | null
        return value.includes(status || '')
      },
    },
    {
      accessorKey: 'valid_until',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Valid Until" />,
      cell: ({ row }) => {
        const date = row.getValue('valid_until') as string | null
        return date ? (
          <span className="text-sm text-muted-foreground">{format(new Date(date), 'MMM d, yyyy')}</span>
        ) : (
          <span className="text-muted-foreground">—</span>
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
        const quotation = row.original

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
              <DropdownMenuItem onClick={() => onView?.(quotation)}>
                <Eye className="mr-2 h-4 w-4" />
                View
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onEdit?.(quotation)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDelete?.(quotation)} className="text-destructive">
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

