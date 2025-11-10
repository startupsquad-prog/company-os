'use client'

import { ColumnDef } from '@tanstack/react-table'
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
import type { CompanyFull } from '@/lib/types/companies'

export const createCompanyColumns = (handlers?: {
  onView?: (company: CompanyFull) => void
  onEdit?: (company: CompanyFull) => void
  onDelete?: (company: CompanyFull) => void
}): ColumnDef<CompanyFull>[] => {
  const onView = handlers?.onView
  const onEdit = handlers?.onEdit
  const onDelete = handlers?.onDelete

  return [
    {
      accessorKey: 'name',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
      cell: ({ row }) => {
        const company = row.original
        return (
          <div className="flex flex-col">
            <Button
              variant="link"
              className="h-auto p-0 font-medium text-left justify-start"
              onClick={() => onView?.(company)}
            >
              {company.name}
            </Button>
            {company.legal_name && company.legal_name !== company.name && (
              <span className="text-xs text-muted-foreground">{company.legal_name}</span>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: 'industry',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Industry" />,
      cell: ({ row }) => {
        const industry = row.getValue('industry') as string | null
        return industry ? (
          <span className="text-sm">{industry}</span>
        ) : (
          <span className="text-muted-foreground">—</span>
        )
      },
    },
    {
      accessorKey: 'website',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Website" />,
      cell: ({ row }) => {
        const website = row.getValue('website') as string | null
        if (!website) return <span className="text-muted-foreground">—</span>
        const url = website.startsWith('http') ? website : `https://${website}`
        return (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline flex items-center gap-1"
          >
            {website}
            <ExternalLink className="h-3 w-3" />
          </a>
        )
      },
    },
    {
      accessorKey: 'tax_id',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Tax ID" />,
      cell: ({ row }) => {
        const taxId = row.getValue('tax_id') as string | null
        return taxId ? (
          <span className="text-sm font-mono">{taxId}</span>
        ) : (
          <span className="text-muted-foreground">—</span>
        )
      },
    },
    {
      accessorKey: 'contacts',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Contacts" />,
      cell: ({ row }) => {
        const contacts = row.original.contacts || []
        if (contacts.length === 0) return <span className="text-muted-foreground">—</span>
        return (
          <div className="flex flex-col gap-1">
            {contacts.slice(0, 2).map((contact) => (
              <span key={contact.id} className="text-sm">
                {contact.name}
              </span>
            ))}
            {contacts.length > 2 && (
              <span className="text-xs text-muted-foreground">+{contacts.length - 2} more</span>
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
        const company = row.original

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
              <DropdownMenuItem onClick={() => onView?.(company)}>
                <Eye className="mr-2 h-4 w-4" />
                View
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onEdit?.(company)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDelete?.(company)} className="text-destructive">
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

