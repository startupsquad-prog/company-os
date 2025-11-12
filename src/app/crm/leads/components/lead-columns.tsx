'use client'

import { ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreHorizontal, Eye, Edit, Trash2, ArrowUpDown } from 'lucide-react'
import { format } from 'date-fns'
import type { LeadFull, LeadStatus } from '@/lib/types/leads'
import { getDiceBearAvatar, getUserInitials } from '@/lib/utils/avatar'

const statusConfig: Record<
  LeadStatus,
  { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }
> = {
  new: { label: 'New', variant: 'outline' },
  contacted: { label: 'Contacted', variant: 'default' },
  qualified: { label: 'Qualified', variant: 'default' },
  proposal: { label: 'Proposal', variant: 'secondary' },
  negotiation: { label: 'Negotiation', variant: 'secondary' },
  won: { label: 'Won', variant: 'default' },
  lost: { label: 'Lost', variant: 'destructive' },
}

export const createLeadColumns = (handlers?: {
  onView?: (lead: LeadFull) => void
  onEdit?: (lead: LeadFull) => void
  onDelete?: (lead: LeadFull) => void
  onStatusChange?: (leadId: string, newStatus: string) => void
}): ColumnDef<LeadFull>[] => {
  const onView = handlers?.onView
  const onEdit = handlers?.onEdit
  const onDelete = handlers?.onDelete
  const onStatusChange = handlers?.onStatusChange

  return [
  {
    accessorKey: 'contact',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Contact" />,
    cell: ({ row }) => {
      const lead = row.original
      const contact = lead.contact
      const contactName = contact?.name || 'No Contact'
      const contactEmail = contact?.email || ''
      const avatarSeed = contactName !== 'No Contact' ? contactName : contactEmail || lead.id
      const avatarUrl = getDiceBearAvatar(avatarSeed)
      const initials = contactName !== 'No Contact' 
        ? getUserInitials(contactName.split(' ')[0], contactName.split(' ').slice(1).join(' '), contactEmail)
        : '?'

      return (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8 flex-shrink-0">
            <AvatarImage src={avatarUrl} alt={contactName} />
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          </Avatar>
          <Button
            variant="link"
            className="h-auto p-0 font-medium text-left justify-start"
            onClick={(e) => {
              e.stopPropagation()
              onView?.(lead)
            }}
          >
            {contactName}
          </Button>
        </div>
      )
    },
  },
  {
    accessorKey: 'phone',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Phone" />,
    cell: ({ row }) => {
      const phone = row.original.contact?.phone
      return phone ? (
        <span className="text-sm">{phone}</span>
      ) : (
        <span className="text-muted-foreground">—</span>
      )
    },
  },
  {
    accessorKey: 'email',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Email" />,
    cell: ({ row }) => {
      const email = row.original.contact?.email
      return email ? (
        <a
          href={`mailto:${email}`}
          className="text-sm text-primary hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          {email}
        </a>
      ) : (
        <span className="text-muted-foreground">—</span>
      )
    },
  },
  {
    accessorKey: 'company',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Company" />,
    cell: ({ row }) => {
      const company = row.original.company
      return company ? (
        <div className="flex flex-col">
          <span className="font-medium">{company.name}</span>
          {company.industry && (
            <span className="text-xs text-muted-foreground">{company.industry}</span>
          )}
        </div>
      ) : (
        <span className="text-muted-foreground">—</span>
      )
    },
  },
  {
    accessorKey: 'status',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
    cell: ({ row }) => {
      const status = row.getValue('status') as LeadStatus
      const config = statusConfig[status] || { label: status, variant: 'outline' as const }

      return <Badge variant={config.variant}>{config.label}</Badge>
    },
    filterFn: (row, id, value) => {
      const status = row.getValue(id) as LeadStatus
      return value.includes(status)
    },
  },
  {
    accessorKey: 'owner',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Owner" />,
    cell: ({ row }) => {
      const owner = row.original.owner
      if (!owner) return <span className="text-muted-foreground">—</span>

      const name =
        `${owner.first_name || ''} ${owner.last_name || ''}`.trim() || owner.email || 'Unknown'
      const initials =
        `${owner.first_name?.[0] || ''}${owner.last_name?.[0] || ''}`.toUpperCase() || '?'

      return (
        <div className="flex items-center gap-2">
          <Avatar className="h-6 w-6">
            <AvatarImage src={owner.avatar_url || undefined} />
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          </Avatar>
          <span className="text-sm">{name}</span>
        </div>
      )
    },
  },
  {
    accessorKey: 'source',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Source" />,
    cell: ({ row }) => {
      const source = row.getValue('source') as string | null
      return source ? (
        <Badge variant="outline">{source}</Badge>
      ) : (
        <span className="text-muted-foreground">—</span>
      )
    },
  },
  {
    accessorKey: 'value',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Value" />,
    cell: ({ row }) => {
      const value = row.getValue('value') as number | null
      return value ? (
        <span className="font-medium">
          ${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      ) : (
        <span className="text-muted-foreground">—</span>
      )
    },
  },
  {
    accessorKey: 'last_interaction_at',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Last Activity" />,
    cell: ({ row }) => {
      const date = row.getValue('last_interaction_at') as string | null
      return date ? (
        <span className="text-sm text-muted-foreground">
          {format(new Date(date), 'MMM d, yyyy')}
        </span>
      ) : (
        <span className="text-muted-foreground">—</span>
      )
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const lead = row.original

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
            <DropdownMenuItem onClick={() => onView?.(lead)}>
              <Eye className="mr-2 h-4 w-4" />
              View
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit?.(lead)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Change Status</DropdownMenuLabel>
            {Object.entries(statusConfig).map(([status, config]) => (
              <DropdownMenuItem
                key={status}
                onClick={() => onStatusChange?.(lead.id, status)}
                disabled={lead.status === status}
              >
                {config.label}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onDelete?.(lead)} className="text-destructive">
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
