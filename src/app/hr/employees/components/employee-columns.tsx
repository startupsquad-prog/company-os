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

interface Employee {
  id: string
  profile_id: string
  employee_id: string
  department_id: string | null
  team_id: string | null
  position: string | null
  hire_date: string | null
  status: string
  created_at: string
  profile?: {
    id: string
    first_name: string | null
    last_name: string | null
    email: string | null
  }
}

export const createEmployeeColumns = (handlers?: {
  onView?: (employee: Employee) => void
  onEdit?: (employee: Employee) => void
  onDelete?: (employee: Employee) => void
}): ColumnDef<Employee>[] => {
  return [
    {
      accessorKey: 'profile',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
      cell: ({ row }) => {
        const profile = row.original.profile
        return profile
          ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.email || '—'
          : '—'
      },
    },
    {
      accessorKey: 'employee_id',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Employee ID" />,
      cell: ({ row }) => row.original.employee_id || '—',
    },
    {
      accessorKey: 'position',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Position" />,
      cell: ({ row }) => row.original.position || '—',
    },
    {
      accessorKey: 'status',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
      cell: ({ row }) => {
        const status = row.getValue('status') as string
        return <Badge variant={status === 'active' ? 'default' : 'outline'}>{status}</Badge>
      },
    },
    {
      accessorKey: 'hire_date',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Hire Date" />,
      cell: ({ row }) => {
        const date = row.getValue('hire_date') as string
        return date ? format(new Date(date), 'MMM d, yyyy') : '—'
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const employee = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              {handlers?.onView && (
                <DropdownMenuItem onClick={() => handlers.onView!(employee)}>
                  <Eye className="mr-2 h-4 w-4" />
                  View Details
                </DropdownMenuItem>
              )}
              {handlers?.onEdit && (
                <DropdownMenuItem onClick={() => handlers.onEdit!(employee)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              {handlers?.onDelete && (
                <DropdownMenuItem onClick={() => handlers.onDelete!(employee)} className="text-destructive">
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


