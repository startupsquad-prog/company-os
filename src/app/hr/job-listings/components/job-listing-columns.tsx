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
import { MoreHorizontal, Eye, Edit, Trash2, ExternalLink } from 'lucide-react'
import { format } from 'date-fns'
import type { JobListingFull, JobListingStatus } from '@/lib/types/recruitment'

const statusConfig: Record<
  JobListingStatus,
  { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }
> = {
  draft: { label: 'Draft', variant: 'outline' },
  active: { label: 'Active', variant: 'default' },
  paused: { label: 'Paused', variant: 'secondary' },
  closed: { label: 'Closed', variant: 'destructive' },
  expired: { label: 'Expired', variant: 'destructive' },
}

export const createJobListingColumns = (handlers?: {
  onView?: (listing: JobListingFull) => void
  onEdit?: (listing: JobListingFull) => void
  onDelete?: (listing: JobListingFull) => void
}): ColumnDef<JobListingFull>[] => {
  const onView = handlers?.onView
  const onEdit = handlers?.onEdit
  const onDelete = handlers?.onDelete

  return [
    {
      accessorKey: 'job_role',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Job Role" />,
      cell: ({ row }) => {
        const role = row.original.job_role
        return role ? (
          <div className="flex flex-col">
            <span className="font-medium">{role.title}</span>
            {role.department && (
              <span className="text-xs text-muted-foreground">{role.department}</span>
            )}
          </div>
        ) : (
          <span className="text-muted-foreground">—</span>
        )
      },
    },
    {
      accessorKey: 'job_portal',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Portal" />,
      cell: ({ row }) => {
        const portal = row.original.job_portal
        return portal ? (
          <span className="text-sm">{portal.name}</span>
        ) : (
          <span className="text-muted-foreground">—</span>
        )
      },
    },
    {
      accessorKey: 'status',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
      cell: ({ row }) => {
        const status = row.getValue('status') as JobListingStatus
        const config = statusConfig[status] || { label: status, variant: 'outline' as const }

        return <Badge variant={config.variant}>{config.label}</Badge>
      },
      filterFn: (row, id, value) => {
        const status = row.getValue(id) as JobListingStatus
        return value.includes(status)
      },
    },
    {
      accessorKey: 'posted_at',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Posted" />,
      cell: ({ row }) => {
        const date = row.original.posted_at
        return date ? (
          <span className="text-sm">{format(new Date(date), 'MMM d, yyyy')}</span>
        ) : (
          <span className="text-muted-foreground">—</span>
        )
      },
    },
    {
      accessorKey: 'applications_count',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Applications" />,
      cell: ({ row }) => {
        const count = row.original.applications_count || 0
        return <span className="text-sm">{count}</span>
      },
    },
    {
      accessorKey: 'views_count',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Views" />,
      cell: ({ row }) => {
        const count = row.original.views_count || 0
        return <span className="text-sm">{count}</span>
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const listing = row.original

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
                <DropdownMenuItem onClick={() => onView(listing)}>
                  <Eye className="mr-2 h-4 w-4" />
                  View Details
                </DropdownMenuItem>
              )}
              {listing.listing_url && (
                <DropdownMenuItem
                  onClick={() => window.open(listing.listing_url || '', '_blank')}
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Open Listing
                </DropdownMenuItem>
              )}
              {onEdit && (
                <DropdownMenuItem onClick={() => onEdit(listing)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              {onDelete && (
                <DropdownMenuItem onClick={() => onDelete(listing)} className="text-destructive">
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

