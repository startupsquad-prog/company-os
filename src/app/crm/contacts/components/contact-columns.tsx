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
import type { ContactFull } from '@/lib/types/contacts'

export const createContactColumns = (handlers?: {
  onView?: (contact: ContactFull) => void
  onEdit?: (contact: ContactFull) => void
  onDelete?: (contact: ContactFull) => void
}): ColumnDef<ContactFull>[] => {
  const onView = handlers?.onView
  const onEdit = handlers?.onEdit
  const onDelete = handlers?.onDelete

  return [
    {
      accessorKey: 'name',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
      cell: ({ row }) => {
        const contact = row.original
        return (
          <Button
            variant="link"
            className="h-auto p-0 font-medium text-left justify-start"
            onClick={() => onView?.(contact)}
          >
            {contact.name}
          </Button>
        )
      },
    },
    {
      accessorKey: 'email',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Email" />,
      cell: ({ row }) => {
        const email = row.getValue('email') as string | null
        return email ? (
          <a href={`mailto:${email}`} className="text-blue-600 hover:underline">
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
        const phone = row.getValue('phone') as string | null
        return phone ? (
          <a href={`tel:${phone}`} className="text-blue-600 hover:underline">
            {phone}
          </a>
        ) : (
          <span className="text-muted-foreground">—</span>
        )
      },
    },
    {
      accessorKey: 'contact_type',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Type" />,
      cell: ({ row }) => {
        const type = row.getValue('contact_type') as string | null
        if (!type) return <span className="text-muted-foreground">—</span>

        const typeConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
          person: { label: 'Person', variant: 'default' },
          organization: { label: 'Organization', variant: 'secondary' },
        }

        const config = typeConfig[type] || { label: type, variant: 'outline' as const }
        return <Badge variant={config.variant}>{config.label}</Badge>
      },
      filterFn: (row, id, value) => {
        const type = row.getValue(id) as string | null
        return value.includes(type || '')
      },
    },
    {
      accessorKey: 'companies',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Companies" />,
      cell: ({ row }) => {
        const companies = row.original.companies || []
        if (companies.length === 0) return <span className="text-muted-foreground">—</span>
        return (
          <div className="flex flex-col gap-1">
            {companies.slice(0, 2).map((company) => (
              <span key={company.id} className="text-sm">
                {company.name}
              </span>
            ))}
            {companies.length > 2 && (
              <span className="text-xs text-muted-foreground">+{companies.length - 2} more</span>
            )}
          </div>
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
        const contact = row.original

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
              <DropdownMenuItem onClick={() => onView?.(contact)}>
                <Eye className="mr-2 h-4 w-4" />
                View
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onEdit?.(contact)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDelete?.(contact)} className="text-destructive">
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

