'use client'

import React, { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { getDiceBearAvatar, getUserInitials } from '@/lib/utils'
import { MoreHorizontal, Edit, Trash2, Eye, GripVertical } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Employee } from './types'

interface EmployeeKanbanViewProps {
  data: Employee[]
  statusOptions?: Array<{ label: string; value: string }>
  onEdit?: (employee: Employee) => void
  onDelete?: (employee: Employee) => void
  onView?: (employee: Employee) => void
  onStatusChange?: (employeeId: string, newStatus: string) => Promise<void>
}

function SortableEmployeeCard({
  employee,
  onView,
  onEdit,
  onDelete,
}: {
  employee: Employee
  onView: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: employee.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const getStatusBadge = (status: string) => {
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
  }

  return (
    <Card ref={setNodeRef} style={style} className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
                <GripVertical className="h-4 w-4 text-muted-foreground" />
              </div>
              <Avatar className="h-8 w-8">
                <AvatarImage src={getDiceBearAvatar(employee.email || employee.id || 'default')} />
                <AvatarFallback>
                  {getUserInitials(employee.first_name, employee.last_name, employee.email)}
                </AvatarFallback>
              </Avatar>
            </div>
            {getStatusBadge(employee.status)}
          </div>

          <div>
            <h4 className="font-semibold text-sm">
              {employee.first_name} {employee.last_name}
            </h4>
            <p className="text-xs text-muted-foreground">{employee.employee_id || 'No ID'}</p>
          </div>

          <div className="space-y-1">
            <p className="text-xs text-muted-foreground truncate">{employee.email}</p>
            {employee.department && (
              <p className="text-xs text-muted-foreground">{employee.department.name}</p>
            )}
          </div>

          <div className="flex items-center justify-between pt-2 border-t">
            <span className="text-xs text-muted-foreground">
              {employee.hire_date
                ? new Date(employee.hire_date).toLocaleDateString()
                : 'No hire date'}
            </span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  <MoreHorizontal className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onView}>
                  <Eye className="mr-2 h-3 w-3" />
                  View
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onEdit}>
                  <Edit className="mr-2 h-3 w-3" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onDelete} className="text-destructive">
                  <Trash2 className="mr-2 h-3 w-3" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function EmployeeKanbanView({
  data,
  statusOptions = [
    { label: 'Active', value: 'active' },
    { label: 'Onboarding', value: 'onboarding' },
    { label: 'Resigned', value: 'resigned' },
  ],
  onEdit,
  onDelete,
  onView,
  onStatusChange,
}: EmployeeKanbanViewProps) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const sensors = useSensors(useSensor(PointerSensor))

  // Group employees by status
  const groupedEmployees = statusOptions.reduce(
    (acc, status) => {
      acc[status.value] = data.filter((emp) => emp.status === status.value)
      return acc
    },
    {} as Record<string, Employee[]>
  )

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)

    if (!over || !onStatusChange) return

    const employeeId = active.id as string
    const newStatus = over.id as string

    if (newStatus === 'active' || newStatus === 'onboarding' || newStatus === 'resigned') {
      await onStatusChange(employeeId, newStatus)
    }
  }

  const getColumnColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500'
      case 'onboarding':
        return 'bg-yellow-500'
      case 'resigned':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  }

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 p-3 sm:p-4 md:p-6">
        {statusOptions.map((status) => {
          const employees = groupedEmployees[status.value] || []
          return (
            <div key={status.value} className="space-y-3 sm:space-y-4">
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${getColumnColor(status.value)}`}></div>
                <h3 className="font-semibold text-base sm:text-lg">
                  {status.label} ({employees.length})
                </h3>
              </div>

              <SortableContext items={employees.map((e) => e.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-3 min-h-[300px] sm:min-h-[400px]">
                  {employees.map((employee) => (
                    <SortableEmployeeCard
                      key={employee.id}
                      employee={employee}
                      onView={() => onView?.(employee)}
                      onEdit={() => onEdit?.(employee)}
                      onDelete={() => onDelete?.(employee)}
                    />
                  ))}
                </div>
              </SortableContext>
            </div>
          )
        })}
      </div>
      <DragOverlay>
        {activeId ? (
          <div className="opacity-50">
            {data.find((e) => e.id === activeId) && (
              <Card>
                <CardContent className="p-4">
                  <div className="text-sm font-medium">
                    {data.find((e) => e.id === activeId)?.first_name}{' '}
                    {data.find((e) => e.id === activeId)?.last_name}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
