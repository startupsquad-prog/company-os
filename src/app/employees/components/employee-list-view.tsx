'use client'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { getDiceBearAvatar, getUserInitials } from '@/lib/utils'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Edit2, Trash2, Eye, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import type { Employee } from './types'

interface EmployeeListViewProps {
  employees: Employee[]
  sortColumn: string | null
  sortDirection: 'asc' | 'desc'
  onSort: (column: string) => void
  onViewEmployee: (employee: Employee) => void
  onEditEmployee: (employee: Employee) => void
  onDeleteEmployee: (employee: Employee) => void
}

export function EmployeeListView({
  employees,
  sortColumn,
  sortDirection,
  onSort,
  onViewEmployee,
  onEditEmployee,
  onDeleteEmployee,
}: EmployeeListViewProps) {
  const getSortIcon = (column: string) => {
    if (sortColumn !== column) {
      return <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />
    }
    return sortDirection === 'asc' ? (
      <ArrowUp className="ml-2 h-4 w-4" />
    ) : (
      <ArrowDown className="ml-2 h-4 w-4" />
    )
  }

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      active: { label: 'Active', variant: 'default' },
      onboarding: { label: 'Onboarding', variant: 'secondary' },
      resigned: { label: 'Resigned', variant: 'destructive' },
    }
    const statusInfo = statusMap[status] || { label: status, variant: 'outline' }
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
  }

  if (employees.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-muted-foreground">No employees found</p>
        </div>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead
              className="cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => onSort('name')}
            >
              <div className="flex items-center">
                Name
                {getSortIcon('name')}
              </div>
            </TableHead>
            <TableHead>Employee ID</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Department</TableHead>
            <TableHead
              className="cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => onSort('status')}
            >
              <div className="flex items-center">
                Status
                {getSortIcon('status')}
              </div>
            </TableHead>
            <TableHead
              className="cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => onSort('hire_date')}
            >
              <div className="flex items-center">
                Hire Date
                {getSortIcon('hire_date')}
              </div>
            </TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {employees.map((employee) => (
            <TableRow key={employee.id} className="hover:bg-muted/50 transition-colors">
              <TableCell className="font-medium">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={getDiceBearAvatar(employee.email || employee.id || 'default')} />
                    <AvatarFallback>
                      {getUserInitials(employee.first_name, employee.last_name, employee.email)}
                    </AvatarFallback>
                  </Avatar>
                  <span>
                    {employee.first_name} {employee.last_name}
                  </span>
                </div>
              </TableCell>
              <TableCell>{employee.employee_id || 'N/A'}</TableCell>
              <TableCell>{employee.email}</TableCell>
              <TableCell>{employee.phone || 'N/A'}</TableCell>
              <TableCell>{employee.department?.name || 'N/A'}</TableCell>
              <TableCell>{getStatusBadge(employee.status)}</TableCell>
              <TableCell>
                {employee.hire_date
                  ? new Date(employee.hire_date).toLocaleDateString()
                  : 'N/A'}
              </TableCell>
              <TableCell className="text-right">
                <TooltipProvider>
                  <div className="flex items-center justify-end space-x-1">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onViewEmployee(employee)}
                          className="h-8 w-8 p-0"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>View details</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEditEmployee(employee)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Edit</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDeleteEmployee(employee)}
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Delete</TooltipContent>
                    </Tooltip>
                  </div>
                </TooltipProvider>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

