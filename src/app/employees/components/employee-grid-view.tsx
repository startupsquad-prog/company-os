'use client'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { getDiceBearAvatar, getUserInitials } from '@/lib/utils'
import { Edit2, Trash2, Eye, Mail, Phone, Building } from 'lucide-react'
import type { Employee } from './types'

interface EmployeeGridViewProps {
  employees: Employee[]
  onViewEmployee: (employee: Employee) => void
  onEditEmployee: (employee: Employee) => void
  onDeleteEmployee: (employee: Employee) => void
}

export function EmployeeGridView({
  employees,
  onViewEmployee,
  onEditEmployee,
  onDeleteEmployee,
}: EmployeeGridViewProps) {
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-6">
      {employees.map((employee) => (
        <Card key={employee.id} className="hover:shadow-lg transition-all duration-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={getDiceBearAvatar(employee.email || employee.id || 'default')} />
                  <AvatarFallback>
                    {getUserInitials(employee.first_name, employee.last_name, employee.email)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-lg">
                    {employee.first_name} {employee.last_name}
                  </h3>
                  <p className="text-sm text-muted-foreground">{employee.employee_id || 'No ID'}</p>
                </div>
              </div>
              {getStatusBadge(employee.status)}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="truncate">{employee.email}</span>
              </div>
              {employee.phone && (
                <div className="flex items-center space-x-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{employee.phone}</span>
                </div>
              )}
              {employee.department && (
                <div className="flex items-center space-x-2 text-sm">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  <span>{employee.department.name}</span>
                </div>
              )}
            </div>

            <div className="pt-3 border-t">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {employee.hire_date
                    ? new Date(employee.hire_date).toLocaleDateString()
                    : 'No hire date'}
                </span>
                <div className="flex items-center space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onViewEmployee(employee)}
                    className="h-8 w-8 p-0"
                    title="View Employee"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEditEmployee(employee)}
                    className="h-8 w-8 p-0"
                    title="Edit Employee"
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDeleteEmployee(employee)}
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    title="Delete Employee"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

