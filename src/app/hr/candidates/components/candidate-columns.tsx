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
import { MoreHorizontal, Eye, Edit, Trash2, Calendar, Phone, FileText, Sparkles } from 'lucide-react'
import { format } from 'date-fns'
import type { CandidateFull, CandidateStatus, CandidateSource } from '@/lib/types/recruitment'
import { getDiceBearAvatar, getUserInitials } from '@/lib/utils/avatar'

const statusConfig: Record<
  CandidateStatus,
  { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }
> = {
  new: { label: 'New', variant: 'outline' },
  screening: { label: 'Screening', variant: 'default' },
  shortlisted: { label: 'Shortlisted', variant: 'default' },
  interviewing: { label: 'Interviewing', variant: 'secondary' },
  offered: { label: 'Offered', variant: 'secondary' },
  hired: { label: 'Hired', variant: 'default' },
  rejected: { label: 'Rejected', variant: 'destructive' },
  withdrawn: { label: 'Withdrawn', variant: 'destructive' },
}

const sourceConfig: Record<CandidateSource, { label: string }> = {
  website: { label: 'Website' },
  referral: { label: 'Referral' },
  linkedin: { label: 'LinkedIn' },
  indeed: { label: 'Indeed' },
  other: { label: 'Other' },
}

export const createCandidateColumns = (handlers?: {
  onView?: (candidate: CandidateFull) => void
  onEdit?: (candidate: CandidateFull) => void
  onDelete?: (candidate: CandidateFull) => void
  onQuickView?: (candidate: CandidateFull) => void
  onScheduleInterview?: (candidate: CandidateFull) => void
  onLogCall?: (candidate: CandidateFull) => void
}): ColumnDef<CandidateFull>[] => {
  const onView = handlers?.onView
  const onEdit = handlers?.onEdit
  const onDelete = handlers?.onDelete
  const onQuickView = handlers?.onQuickView
  const onScheduleInterview = handlers?.onScheduleInterview
  const onLogCall = handlers?.onLogCall

  return [
    {
      accessorKey: 'contact',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
      cell: ({ row }) => {
        const candidate = row.original
        const contact = candidate.contact
        const contactName = contact?.name || 'No Contact'
        const contactEmail = contact?.email || ''
        const avatarSeed = contactName !== 'No Contact' ? contactName : contactEmail || candidate.id
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
                onView?.(candidate)
              }}
            >
              {contactName}
            </Button>
          </div>
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
      accessorKey: 'status',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
      cell: ({ row }) => {
        const status = row.getValue('status') as CandidateStatus
        const config = statusConfig[status] || { label: status, variant: 'outline' as const }

        return <Badge variant={config.variant}>{config.label}</Badge>
      },
      filterFn: (row, id, value) => {
        const status = row.getValue(id) as CandidateStatus
        return value.includes(status)
      },
    },
    {
      accessorKey: 'source',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Source" />,
      cell: ({ row }) => {
        const source = row.getValue('source') as CandidateSource | null
        if (!source) return <span className="text-muted-foreground">—</span>
        const config = sourceConfig[source] || { label: source }
        return <Badge variant="outline">{config.label}</Badge>
      },
      filterFn: (row, id, value) => {
        const source = row.getValue(id) as CandidateSource | null
        return source ? value.includes(source) : false
      },
    },
    {
      accessorKey: 'recruiter',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Recruiter" />,
      cell: ({ row }) => {
        const recruiter = row.original.recruiter
        if (!recruiter) return <span className="text-muted-foreground">—</span>

        const name =
          `${recruiter.first_name || ''} ${recruiter.last_name || ''}`.trim() || recruiter.email || 'Unknown'
        const initials =
          `${recruiter.first_name?.[0] || ''}${recruiter.last_name?.[0] || ''}`.toUpperCase() || '?'

        return (
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarFallback className="text-xs">{initials}</AvatarFallback>
            </Avatar>
            <span className="text-sm">{name}</span>
          </div>
        )
      },
    },
    {
      accessorKey: 'created_at',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Applied Date" />,
      cell: ({ row }) => {
        const date = row.getValue('created_at') as string
        return (
          <span className="text-sm text-muted-foreground">
            {format(new Date(date), 'MMM d, yyyy')}
          </span>
        )
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const candidate = row.original

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
              {onQuickView && (
                <DropdownMenuItem onClick={() => onQuickView(candidate)}>
                  <FileText className="mr-2 h-4 w-4" />
                  Quick View
                </DropdownMenuItem>
              )}
              {onView && (
                <DropdownMenuItem onClick={() => onView(candidate)}>
                  <Eye className="mr-2 h-4 w-4" />
                  View Details
                </DropdownMenuItem>
              )}
              {onScheduleInterview && (
                <DropdownMenuItem onClick={() => onScheduleInterview(candidate)}>
                  <Calendar className="mr-2 h-4 w-4" />
                  Schedule Interview
                </DropdownMenuItem>
              )}
              {onLogCall && (
                <DropdownMenuItem onClick={() => onLogCall(candidate)}>
                  <Phone className="mr-2 h-4 w-4" />
                  Log Call
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  // TODO: Implement AI Analyze Resume
                  console.log('AI Analyze Resume for candidate:', candidate.id)
                }}
              >
                <Sparkles className="mr-2 h-4 w-4" />
                AI Analyze Resume
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {onEdit && (
                <DropdownMenuItem onClick={() => onEdit(candidate)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
              )}
              {onDelete && (
                <DropdownMenuItem onClick={() => onDelete(candidate)} className="text-destructive">
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

