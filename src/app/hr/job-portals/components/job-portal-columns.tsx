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
import type { JobPortalFull, JobPortalStatus, JobPortalType } from '@/lib/types/recruitment'

const statusConfig: Record<
  JobPortalStatus,
  { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }
> = {
  active: { label: 'Active', variant: 'default' },
  inactive: { label: 'Inactive', variant: 'outline' },
  expired: { label: 'Expired', variant: 'destructive' },
}

const typeConfig: Record<JobPortalType, { label: string }> = {
  job_board: { label: 'Job Board' },
  linkedin: { label: 'LinkedIn' },
  indeed: { label: 'Indeed' },
  naukri: { label: 'Naukri' },
  monster: { label: 'Monster' },
  glassdoor: { label: 'Glassdoor' },
  other: { label: 'Other' },
}

export const createJobPortalColumns = (handlers?: {
  onView?: (portal: JobPortalFull) => void
  onEdit?: (portal: JobPortalFull) => void
  onDelete?: (portal: JobPortalFull) => void
}): ColumnDef<JobPortalFull>[] => {
  const onView = handlers?.onView
  const onEdit = handlers?.onEdit
  const onDelete = handlers?.onDelete

  return [
    {
      accessorKey: 'name',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
      cell: ({ row }) => {
        const portal = row.original
        return (
          <div className="flex flex-col">
            <span className="font-medium">{portal.name}</span>
            {portal.portal_type && (
              <span className="text-xs text-muted-foreground">
                {typeConfig[portal.portal_type]?.label || portal.portal_type}
              </span>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: 'url',
      header: ({ column }) => <DataTableColumnHeader column={column} title="URL" />,
      cell: ({ row }) => {
        const url = row.original.url
        return url ? (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary hover:underline flex items-center gap-1"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="truncate max-w-[200px]">{url}</span>
            <ExternalLink className="h-3 w-3 flex-shrink-0" />
          </a>
        ) : (
          <span className="text-muted-foreground">—</span>
        )
      },
    },
    {
      accessorKey: 'status',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
      cell: ({ row }) => {
        const status = row.getValue('status') as JobPortalStatus
        const config = statusConfig[status] || { label: status, variant: 'outline' as const }

        return <Badge variant={config.variant}>{config.label}</Badge>
      },
      filterFn: (row, id, value) => {
        const status = row.getValue(id) as JobPortalStatus
        return value.includes(status)
      },
    },
    {
      accessorKey: 'portal_type',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Type" />,
      cell: ({ row }) => {
        const portalType = row.getValue('portal_type') as JobPortalType | null
        if (!portalType) return <span className="text-muted-foreground">—</span>
        const config = typeConfig[portalType] || { label: portalType }
        return <Badge variant="outline">{config.label}</Badge>
      },
      filterFn: (row, id, value) => {
        const portalType = row.getValue(id) as JobPortalType | null
        if (!portalType) return false
        return value.includes(portalType)
      },
    },
    {
      accessorKey: 'subscription',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Subscription" />,
      cell: ({ row }) => {
        const subscription = row.original.subscription
        return subscription ? (
          <div className="flex flex-col">
            <span className="text-sm font-medium">{subscription.name}</span>
            <span className="text-xs text-muted-foreground">{subscription.status}</span>
          </div>
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
        return <span className="text-sm">{format(new Date(date), 'MMM d, yyyy')}</span>
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const portal = row.original

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
                <DropdownMenuItem onClick={() => onView(portal)}>
                  <Eye className="mr-2 h-4 w-4" />
                  View Details
                </DropdownMenuItem>
              )}
              {onEdit && (
                <DropdownMenuItem onClick={() => onEdit(portal)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              {onDelete && (
                <DropdownMenuItem onClick={() => onDelete(portal)} className="text-destructive">
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

