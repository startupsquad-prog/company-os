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
import { MoreHorizontal, Eye, Edit, Trash2, Phone } from 'lucide-react'
import { format } from 'date-fns'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { getDiceBearAvatar, getUserInitials } from '@/lib/utils/avatar'
import type { CallFull, CallType, CallStatus } from '@/lib/types/calls'

const callTypeConfig: Record<CallType, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
  inbound: { label: 'Inbound', variant: 'default' },
  outbound: { label: 'Outbound', variant: 'secondary' },
  missed: { label: 'Missed', variant: 'destructive' },
}

const statusConfig: Record<CallStatus, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
  completed: { label: 'Completed', variant: 'default' },
  no_answer: { label: 'No Answer', variant: 'secondary' },
  busy: { label: 'Busy', variant: 'outline' },
  failed: { label: 'Failed', variant: 'destructive' },
  cancelled: { label: 'Cancelled', variant: 'destructive' },
}

export const createCallColumns = (handlers?: {
  onView?: (call: CallFull) => void
  onEdit?: (call: CallFull) => void
  onDelete?: (call: CallFull) => void
}): ColumnDef<CallFull>[] => {
  const onView = handlers?.onView
  const onEdit = handlers?.onEdit
  const onDelete = handlers?.onDelete

  return [
    {
      accessorKey: 'contact',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Contact/Lead" />,
      cell: ({ row }) => {
        const call = row.original
        const contact = call.contact
        const lead = call.lead
        const leadContact = lead?.contact
        
        if (contact) {
          const avatarSeed = contact.name || contact.email || contact.id
          const avatarUrl = getDiceBearAvatar(avatarSeed)
          const initials = contact.name ? contact.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) : '?'
          
          return (
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={avatarUrl} alt={contact.name} />
                <AvatarFallback className="text-xs">{initials}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <Button
                  variant="link"
                  className="h-auto p-0 font-medium text-left justify-start text-sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    onView?.(call)
                  }}
                >
                  {contact.name}
                </Button>
                {contact.phone && (
                  <span className="text-xs text-muted-foreground">{contact.phone}</span>
                )}
              </div>
            </div>
          )
        } else if (leadContact) {
          const avatarSeed = leadContact.name || leadContact.email || lead?.id || ''
          const avatarUrl = getDiceBearAvatar(avatarSeed)
          const initials = leadContact.name ? leadContact.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) : '?'
          
          return (
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={avatarUrl} alt={leadContact.name} />
                <AvatarFallback className="text-xs">{initials}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <Button
                  variant="link"
                  className="h-auto p-0 font-medium text-left justify-start text-sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    onView?.(call)
                  }}
                >
                  {leadContact.name}
                </Button>
                <span className="text-xs text-muted-foreground">
                  {leadContact.phone || 'Lead'}
                </span>
              </div>
            </div>
          )
        } else {
          return <span className="text-muted-foreground">—</span>
        }
      },
    },
    {
      accessorKey: 'caller',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Caller" />,
      cell: ({ row }) => {
        const caller = row.original.caller
        if (!caller) return <span className="text-muted-foreground">—</span>
        
        const callerName = [caller.first_name, caller.last_name].filter(Boolean).join(' ') || caller.email || 'Unknown'
        const avatarSeed = callerName !== 'Unknown' ? callerName : caller.email || caller.id
        const avatarUrl = caller.avatar_url || getDiceBearAvatar(avatarSeed)
        const initials = getUserInitials(caller.first_name, caller.last_name, caller.email)
        
        return (
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={avatarUrl} alt={callerName} />
              <AvatarFallback className="text-xs">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <Button
                variant="link"
                className="h-auto p-0 font-medium text-left justify-start text-sm"
                onClick={() => onView?.(row.original)}
              >
                {callerName}
              </Button>
              {caller.phone && (
                <span className="text-xs text-muted-foreground">{caller.phone}</span>
              )}
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: 'call_type',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Type" />,
      cell: ({ row }) => {
        const type = row.getValue('call_type') as CallType
        const config = callTypeConfig[type] || { label: type, variant: 'outline' as const }
        return <Badge variant={config.variant}>{config.label}</Badge>
      },
    },
    {
      accessorKey: 'phone_number',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Phone" />,
      cell: ({ row }) => {
        const phone = row.getValue('phone_number') as string | null
        return phone ? (
          <a href={`tel:${phone}`} className="text-blue-600 hover:underline flex items-center gap-1">
            <Phone className="h-3 w-3" />
            {phone}
          </a>
        ) : (
          <span className="text-muted-foreground">—</span>
        )
      },
    },
    {
      accessorKey: 'duration_seconds',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Duration" />,
      cell: ({ row }) => {
        const duration = row.getValue('duration_seconds') as number | null
        if (!duration) return <span className="text-muted-foreground">—</span>
        const minutes = Math.floor(duration / 60)
        const seconds = duration % 60
        return <span className="text-sm">{minutes}:{seconds.toString().padStart(2, '0')}</span>
      },
    },
    {
      accessorKey: 'status',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
      cell: ({ row }) => {
        const status = row.getValue('status') as CallStatus | null
        if (!status) return <span className="text-muted-foreground">—</span>
        const config = statusConfig[status] || { label: status, variant: 'outline' as const }
        return <Badge variant={config.variant}>{config.label}</Badge>
      },
    },
    {
      accessorKey: 'started_at',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Started" />,
      cell: ({ row }) => {
        const date = row.getValue('started_at') as string | null
        return date ? (
          <span className="text-sm text-muted-foreground">{format(new Date(date), 'MMM d, yyyy HH:mm')}</span>
        ) : (
          <span className="text-muted-foreground">—</span>
        )
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
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => onView?.(call)}>
                <Eye className="mr-2 h-4 w-4" />
                View
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onEdit?.(call)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDelete?.(call)} className="text-destructive">
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

