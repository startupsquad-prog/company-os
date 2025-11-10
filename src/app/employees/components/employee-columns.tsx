'use client'

import { ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header'
import { getDiceBearAvatar, getUserInitials } from '@/lib/utils'
import { EmployeeRowActions } from './employee-row-actions'
import type { Employee } from './types'

export const createEmployeeColumns = (
  onView?: (employee: Employee) => void,
  onEdit?: (employee: Employee) => void,
  onDelete?: (employee: Employee) => void
): ColumnDef<Employee>[] => [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    id: 'name',
    accessorFn: (row) => `${row.first_name} ${row.last_name}`,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
    cell: ({ row }) => {
      const employee = row.original
      const avatarSeed = employee.email || employee.id || 'default'
      const initials = getUserInitials(employee.first_name, employee.last_name, employee.email)
      return (
        <div className="flex items-center space-x-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={getDiceBearAvatar(avatarSeed)} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <Button
            variant="link"
            className="h-auto p-0 font-medium text-left justify-start"
            onClick={() => onView?.(employee)}
          >
            {employee.first_name} {employee.last_name}
          </Button>
        </div>
      )
    },
  },
  {
    accessorKey: 'employee_id',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Employee ID" />,
    cell: ({ row }) => {
      const id = row.getValue('employee_id') as string | null
      return <span className="text-sm text-muted-foreground">{id || 'N/A'}</span>
    },
  },
  {
    accessorKey: 'email',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Email" />,
    cell: ({ row }) => {
      const email = row.getValue('email') as string
      return <span className="text-sm">{email}</span>
    },
  },
  {
    accessorKey: 'phone',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Phone" />,
    cell: ({ row }) => {
      const phone = row.getValue('phone') as string | null
      return <span className="text-sm text-muted-foreground">{phone || 'N/A'}</span>
    },
  },
  {
    id: 'department',
    accessorFn: (row) => row.department?.name || '',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Department" />,
    cell: ({ row }) => {
      const department = row.original.department
      return <span className="text-sm text-muted-foreground">{department?.name || 'N/A'}</span>
    },
    filterFn: (row, id, value) => {
      const department = row.original.department
      return value.includes(department?.id || '')
    },
  },
  {
    accessorKey: 'status',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
    cell: ({ row }) => {
      const status = row.getValue('status') as string
      const statusConfig: Record<
        string,
        { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }
      > = {
        active: { label: 'Active', variant: 'default' },
        onboarding: { label: 'Onboarding', variant: 'secondary' },
        resigned: { label: 'Resigned', variant: 'destructive' },
      }
      const config = statusConfig[status] || { label: status, variant: 'outline' as const }
      return <Badge variant={config.variant}>{config.label}</Badge>
    },
    filterFn: (row, id, value) => {
      const status = row.getValue(id) as string
      return value.includes(status)
    },
  },
  {
    accessorKey: 'hire_date',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Hire Date" />,
    cell: ({ row }) => {
      const date = row.getValue('hire_date') as string | null
      if (!date) return <span className="text-sm text-muted-foreground">N/A</span>
      return (
        <span className="text-sm">
          {new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })}
        </span>
      )
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const employee = row.original
      return (
        <EmployeeRowActions
          employee={employee}
          onView={() => onView?.(employee)}
          onEdit={() => onEdit?.(employee)}
          onDelete={() => onDelete?.(employee)}
        />
      )
    },
    enableSorting: false,
    enableHiding: false,
  },
]

