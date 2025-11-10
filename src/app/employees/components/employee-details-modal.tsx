'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getDiceBearAvatar, getUserInitials } from '@/lib/utils'
import { Mail, Phone, Building, Calendar, User } from 'lucide-react'
import type { Employee } from './types'

interface EmployeeDetailsModalProps {
  employee: Employee | null
  open: boolean
  onClose: () => void
}

export function EmployeeDetailsModal({ employee, open, onClose }: EmployeeDetailsModalProps) {
  if (!employee) return null

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      active: { label: 'Active', variant: 'default' },
      onboarding: { label: 'Onboarding', variant: 'secondary' },
      resigned: { label: 'Resigned', variant: 'destructive' },
    }
    const statusInfo = statusMap[status] || { label: status, variant: 'outline' }
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Employee Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header Section */}
          <div className="flex items-start gap-6">
            <Avatar className="h-20 w-20">
              <AvatarImage src={getDiceBearAvatar(employee.email || employee.id || 'default')} />
              <AvatarFallback className="text-2xl font-semibold">
                {getUserInitials(employee.first_name, employee.last_name, employee.email)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h2 className="text-2xl font-bold">
                {employee.first_name} {employee.last_name}
              </h2>
              <p className="text-muted-foreground">{employee.email}</p>
              <div className="flex items-center gap-2 mt-2">
                {getStatusBadge(employee.status)}
                {employee.employee_id && (
                  <Badge variant="outline">ID: {employee.employee_id}</Badge>
                )}
              </div>
            </div>
          </div>

          {/* Information Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{employee.email}</span>
                </div>
                {employee.phone && (
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{employee.phone}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Employment Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {employee.department && (
                  <div className="flex items-center space-x-2">
                    <Building className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{employee.department.name}</span>
                  </div>
                )}
                {employee.hire_date && (
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      Hired: {new Date(employee.hire_date).toLocaleDateString()}
                    </span>
                  </div>
                )}
                {employee.termination_date && (
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      Terminated: {new Date(employee.termination_date).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

