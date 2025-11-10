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
import type { SubscriptionFull, SubscriptionStatus, BillingCycle } from '@/lib/types/subscriptions'

const statusConfig: Record<
  SubscriptionStatus,
  { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }
> = {
  active: { label: 'Active', variant: 'default' },
  expired: { label: 'Expired', variant: 'destructive' },
  cancelled: { label: 'Cancelled', variant: 'destructive' },
  pending: { label: 'Pending', variant: 'outline' },
  trial: { label: 'Trial', variant: 'secondary' },
}

export const createSubscriptionColumns = (handlers?: {
  onView?: (subscription: SubscriptionFull) => void
  onEdit?: (subscription: SubscriptionFull) => void
  onDelete?: (subscription: SubscriptionFull) => void
}): ColumnDef<SubscriptionFull>[] => {
  const onView = handlers?.onView
  const onEdit = handlers?.onEdit
  const onDelete = handlers?.onDelete

  return [
    {
      accessorKey: 'subscription_name',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
      cell: ({ row }) => {
        const subscription = row.original
        return (
          <Button
            variant="link"
            className="h-auto p-0 font-medium text-left justify-start"
            onClick={() => onView?.(subscription)}
          >
            {subscription.subscription_name}
          </Button>
        )
      },
    },
    {
      accessorKey: 'vendor',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Vendor" />,
      cell: ({ row }) => {
        const vendor = row.original.vendor
        const vendorName = row.original.vendor_name
        return vendor ? (
          <span className="text-sm">{vendor.name}</span>
        ) : vendorName ? (
          <span className="text-sm">{vendorName}</span>
        ) : (
          <span className="text-muted-foreground">—</span>
        )
      },
    },
    {
      accessorKey: 'plan_tier',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Plan" />,
      cell: ({ row }) => {
        const plan = row.getValue('plan_tier') as string | null
        return plan ? (
          <Badge variant="outline">{plan}</Badge>
        ) : (
          <span className="text-muted-foreground">—</span>
        )
      },
    },
    {
      accessorKey: 'cost_per_period',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Cost" />,
      cell: ({ row }) => {
        const cost = row.getValue('cost_per_period') as number | null
        const currency = row.original.currency || 'USD'
        const cycle = row.original.billing_cycle
        if (!cost) return <span className="text-muted-foreground">—</span>
        return (
          <div className="flex flex-col">
            <span className="text-sm font-medium">
              {new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(cost)}
            </span>
            {cycle && <span className="text-xs text-muted-foreground">/{cycle}</span>}
          </div>
        )
      },
    },
    {
      accessorKey: 'billing_cycle',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Billing" />,
      cell: ({ row }) => {
        const cycle = row.getValue('billing_cycle') as BillingCycle | null
        return cycle ? (
          <Badge variant="outline">{cycle}</Badge>
        ) : (
          <span className="text-muted-foreground">—</span>
        )
      },
    },
    {
      accessorKey: 'status',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
      cell: ({ row }) => {
        const status = row.getValue('status') as SubscriptionStatus | null
        if (!status) return <span className="text-muted-foreground">—</span>
        const config = statusConfig[status] || { label: status, variant: 'outline' as const }
        return <Badge variant={config.variant}>{config.label}</Badge>
      },
    },
    {
      accessorKey: 'expiry_date',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Expires" />,
      cell: ({ row }) => {
        const date = row.getValue('expiry_date') as string | null
        if (!date) return <span className="text-muted-foreground">—</span>
        const isExpired = isPast(new Date(date))
        return (
          <span className={`text-sm ${isExpired ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>
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
        const subscription = row.original

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
              <DropdownMenuItem onClick={() => onView?.(subscription)}>
                <Eye className="mr-2 h-4 w-4" />
                View
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onEdit?.(subscription)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDelete?.(subscription)} className="text-destructive">
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

