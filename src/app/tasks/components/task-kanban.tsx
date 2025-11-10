'use client'

import React, { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  MoreHorizontal,
  Edit,
  Trash2,
  Plus,
  Flag,
  GripVertical,
  Calendar,
  Tag,
  User,
} from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
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
import { format, isPast, differenceInDays } from 'date-fns'
import { toast } from 'sonner'
import type { TaskFull } from '@/lib/types/tasks'
import { createClient } from '@/lib/supabase/client'
import { formatDueDateRelative } from '@/lib/utils/task-utils'

interface TaskKanbanProps {
  data: TaskFull[]
  statusOptions?: Array<{ label: string; value: string }>
  onEdit?: (task: TaskFull) => void
  onDelete?: (task: TaskFull) => void
  onView?: (task: TaskFull) => void
  onStatusChange?: (taskId: string, newStatus: string) => Promise<void>
  onAdd?: (status?: string) => void
  onPositionChange?: (taskId: string, newPosition: number, status: string) => Promise<void>
}

interface SortableTaskCardProps {
  task: TaskFull
  onEdit?: (task: TaskFull) => void
  onDelete?: (task: TaskFull) => void
  onView?: (task: TaskFull) => void
  onPositionChange?: (taskId: string, newPosition: number, status: string) => Promise<void>
}

interface KanbanColumn {
  id: string
  title: string
  tasks: TaskFull[]
  color: string
}

function SortableTaskCard({
  task,
  onEdit,
  onDelete,
  onView,
  onPositionChange,
}: SortableTaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const priorityConfig: Record<string, { label: string; className: string; color: string }> = {
    low: {
      label: 'Low',
      className: 'bg-gray-100 text-gray-800 border-gray-200',
      color: 'text-gray-500',
    },
    medium: {
      label: 'Medium',
      className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      color: 'text-yellow-500',
    },
    high: {
      label: 'High',
      className: 'bg-orange-100 text-orange-800 border-orange-200',
      color: 'text-orange-500',
    },
    urgent: {
      label: 'Urgent',
      className: 'bg-red-100 text-red-800 border-red-200',
      color: 'text-red-500',
    },
  }

  const priority = task.priority ? priorityConfig[task.priority] : null

  // Generate DiceBear Micah avatar URL
  const getDiceBearAvatar = (seed: string) => {
    return `https://api.dicebear.com/7.x/micah/svg?seed=${encodeURIComponent(seed)}`
  }
  const assignees = task.assignees || []
  const visibleAssignees = assignees.slice(0, 2)
  const remaining = assignees.length - visibleAssignees.length
  const dueDate = task.due_date ? new Date(task.due_date) : null
  const isOverdue = dueDate && isPast(dueDate) && task.status !== 'completed'
  const daysUntilDue = dueDate ? differenceInDays(dueDate, new Date()) : null
  const isDueSoon = daysUntilDue !== null && daysUntilDue <= 3 && daysUntilDue >= 0 && !isOverdue

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`bg-card shadow-sm hover:shadow-md transition-shadow ${
        isDragging ? 'opacity-50' : ''
      } ${isOverdue ? 'border-destructive border-2 bg-destructive/5' : ''}`}
      onClick={() => onView?.(task)}
    >
      <CardContent className="p-3">
        <div className="flex items-start gap-2">
          {/* Dragger Handle */}
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing mt-0.5 text-muted-foreground hover:text-foreground transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical className="h-4 w-4" />
          </div>

          {/* Compact Content */}
          <div className="flex-1 min-w-0 space-y-2">
            {/* Title */}
            <h4 className="font-medium text-sm leading-tight line-clamp-2">{task.title}</h4>

            {/* Compact Details Row - Icons with badges */}
            <div className="flex items-center gap-2 flex-wrap">
              {priority && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-1">
                        <Flag className={`h-3 w-3 ${priority.color}`} />
                        <span className="text-xs font-medium">{priority.label}</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>Priority</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}

              {task.department && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-1">
                        <Tag className="h-3 w-3 text-muted-foreground" />
                        <Badge
                          variant="secondary"
                          className="text-xs h-5 px-1.5 bg-blue-100 text-blue-800 hover:bg-blue-200"
                        >
                          {task.department.name}
                        </Badge>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>Department</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}

              {visibleAssignees.length > 0 && (
                <TooltipProvider>
                  <div className="flex items-center gap-1 -space-x-1">
                    {visibleAssignees.map((assignee) => {
                      const profile = assignee.profile
                      const name =
                        profile?.first_name && profile?.last_name
                          ? `${profile.first_name} ${profile.last_name}`
                          : profile?.email || 'Unknown'
                      const initials =
                        profile?.first_name && profile?.last_name
                          ? `${profile.first_name[0]}${profile.last_name[0]}`
                          : profile?.email?.[0]?.toUpperCase() || '?'

                      const seed = profile?.email || assignee.profile_id || 'unknown'
                      return (
                        <Tooltip key={assignee.id}>
                          <TooltipTrigger asChild>
                            <Avatar className="h-5 w-5 border border-background cursor-pointer">
                              <AvatarImage src={getDiceBearAvatar(seed)} alt={name} />
                              <AvatarFallback className="text-[10px]">{initials}</AvatarFallback>
                            </Avatar>
                          </TooltipTrigger>
                          <TooltipContent>{name}</TooltipContent>
                        </Tooltip>
                      )
                    })}
                    {remaining > 0 && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="h-5 w-5 rounded-full border border-background bg-muted flex items-center justify-center text-[10px] font-medium cursor-pointer hover:bg-muted/80 transition-colors">
                            +{remaining}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>
                            {remaining} more assignee{remaining > 1 ? 's' : ''}
                          </p>
                          {assignees.slice(visibleAssignees.length).map((assignee) => {
                            const profile = assignee.profile
                            const name =
                              profile?.first_name && profile?.last_name
                                ? `${profile.first_name} ${profile.last_name}`
                                : profile?.email || 'Unknown'
                            return (
                              <p key={assignee.id} className="text-xs text-muted-foreground">
                                {name}
                              </p>
                            )
                          })}
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                </TooltipProvider>
              )}

              {dueDate && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div
                        className={`flex flex-col gap-0.5 text-xs ${
                          isOverdue
                            ? 'text-destructive font-semibold'
                            : isDueSoon
                              ? 'text-orange-600 font-medium'
                              : 'text-muted-foreground'
                        }`}
                      >
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>{format(dueDate, 'MMM d')}</span>
                        </div>
                        {formatDueDateRelative(dueDate) && (
                          <span className="text-[10px] ml-4 opacity-75">
                            {formatDueDateRelative(dueDate)}
                          </span>
                        )}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Due: {format(dueDate, 'MMM dd, yyyy')}</p>
                      {formatDueDateRelative(dueDate) && (
                        <p className="text-xs text-muted-foreground">
                          {formatDueDateRelative(dueDate)}
                        </p>
                      )}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          </div>

          {/* More Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              {onView && (
                <DropdownMenuItem onClick={() => onView(task)}>View Details</DropdownMenuItem>
              )}
              {onEdit && (
                <DropdownMenuItem onClick={() => onEdit(task)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
              )}
              {onDelete && (
                <DropdownMenuItem onClick={() => onDelete(task)} className="text-destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  )
}

export function TaskKanban({
  data,
  statusOptions = [],
  onEdit,
  onDelete,
  onView,
  onStatusChange,
  onAdd,
  onPositionChange,
}: TaskKanbanProps) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const [overId, setOverId] = useState<string | null>(null)
  const [localData, setLocalData] = useState<TaskFull[]>(data)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  React.useEffect(() => {
    setLocalData(data)
  }, [data])

  // Generate columns dynamically from statusOptions or use defaults
  const columns: KanbanColumn[] = React.useMemo(() => {
    // Status color mapping
    const statusColorMap: Record<string, string> = {
      pending: 'bg-gray-50 border-gray-200',
      in_progress: 'bg-blue-50 border-blue-200',
      completed: 'bg-green-50 border-green-200',
      cancelled: 'bg-red-50 border-red-200',
    }
    const getTasksForStatus = (statusValue: string) => {
      return localData
        .filter((task) => {
          // Hide the dragged task from all columns - it will be shown in DragOverlay
          if (activeId && task.id === activeId) return false
          return !task.status ? statusValue === 'pending' : task.status === statusValue
        })
        .sort((a, b) => {
          const posA =
            ((a as any).position ?? (a as any).created_at)
              ? new Date((a as any).created_at).getTime()
              : 0
          const posB =
            ((b as any).position ?? (b as any).created_at)
              ? new Date((b as any).created_at).getTime()
              : 0
          return posA - posB
        })
    }

    if (statusOptions.length > 0) {
      return statusOptions.map((status) => ({
        id: status.value,
        title: status.label,
        tasks: getTasksForStatus(status.value),
        color: statusColorMap[status.value] || 'bg-gray-50 border-gray-200',
      }))
    }

    // Fallback to default columns if statusOptions not provided
    return [
      {
        id: 'pending',
        title: 'Pending',
        tasks: getTasksForStatus('pending'),
        color: 'bg-gray-50 border-gray-200',
      },
      {
        id: 'in_progress',
        title: 'In Progress',
        tasks: getTasksForStatus('in_progress'),
        color: 'bg-blue-50 border-blue-200',
      },
      {
        id: 'completed',
        title: 'Completed',
        tasks: getTasksForStatus('completed'),
        color: 'bg-green-50 border-green-200',
      },
      {
        id: 'cancelled',
        title: 'Cancelled',
        tasks: getTasksForStatus('cancelled'),
        color: 'bg-red-50 border-red-200',
      },
    ]
  }, [statusOptions, localData, activeId])

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)
    setOverId(null)

    if (!over) return

    const activeId = active.id as string
    const currentOverId = over.id as string
    setOverId(currentOverId)

    // Find the task being dragged
    const draggedTask = localData.find((task) => task.id === activeId)
    if (!draggedTask) return

    // Check if dropped on another task (same column reordering)
    const overTask = localData.find((task) => task.id === currentOverId)
    if (overTask && overTask.status === draggedTask.status) {
      // Reordering within same column
      const column = columns.find((col) => col.id === draggedTask.status)
      if (!column) return

      const oldIndex = column.tasks.findIndex((t) => t.id === activeId)
      const newIndex = column.tasks.findIndex((t) => t.id === currentOverId)

      if (oldIndex === newIndex) return

      // Update positions optimistically
      const updatedTasks = [...column.tasks]
      const [movedTask] = updatedTasks.splice(oldIndex, 1)
      updatedTasks.splice(newIndex, 0, movedTask)

      // Update local state
      setLocalData((prev) =>
        prev.map((task) => {
          const taskIndex = updatedTasks.findIndex((t) => t.id === task.id)
          if (taskIndex !== -1) {
            return { ...task, position: taskIndex } as TaskFull
          }
          return task
        })
      )

      // Persist to database
      if (onPositionChange) {
        try {
          await onPositionChange(activeId, newIndex, draggedTask.status || 'pending')
        } catch (error) {
          setLocalData(data)
          toast.error('Failed to update task position')
        }
      }
      return
    }

    // Find the target column (status)
    const targetColumn = columns.find((col) => col.id === currentOverId)
    if (!targetColumn) return

    if (targetColumn.id === draggedTask.status) {
      // Same column, might be reordering - handled above
      return
    }

    // Moving to different column
    const newPosition = targetColumn.tasks.length

    // Update local state optimistically
    setLocalData((prev) =>
      prev.map((task) =>
        task.id === activeId
          ? ({ ...task, status: targetColumn.id, position: newPosition } as TaskFull)
          : task
      )
    )

    // Call the status change handler
    if (onStatusChange) {
      try {
        await onStatusChange(activeId, targetColumn.id)
        toast.success(`Task moved to ${targetColumn.title}`)
      } catch (error) {
        // Revert on error
        setLocalData(data)
        toast.error('Failed to update task status')
      }
    }
  }

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="w-full h-full overflow-x-auto overflow-y-hidden overscroll-x-contain scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
        <div className="inline-flex gap-3 sm:gap-4 md:gap-6 pb-4 p-2 sm:p-3 md:p-4 min-h-[400px] sm:min-h-[500px]">
          {columns.map((column) => (
            <div key={column.id} className="flex-shrink-0 w-[260px] sm:w-[280px] md:w-80">
              <div
                className={`rounded-lg border-2 ${column.color} p-2 sm:p-3 md:p-4 h-full flex flex-col min-h-[400px] sm:min-h-[500px] max-h-[calc(100vh-200px)] sm:max-h-[calc(100vh-180px)]`}
              >
                <div className="flex items-center justify-between mb-4 flex-shrink-0">
                  <h3 className="font-semibold text-sm">{column.title}</h3>
                  <Badge variant="outline" className="text-xs">
                    {column.tasks.length}
                  </Badge>
                </div>

                <SortableContext
                  items={column.tasks.map((task) => task.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-3 overflow-y-auto flex-1 pr-2 min-h-0">
                    {column.tasks.map((task) => (
                      <SortableTaskCard
                        key={task.id}
                        task={task}
                        onEdit={onEdit}
                        onDelete={onDelete}
                        onView={onView}
                        onPositionChange={onPositionChange}
                      />
                    ))}

                    {/* Show placeholder when dragging over this column */}
                    {activeId && overId === column.id && (
                      <div className="h-20 border-2 border-dashed border-primary/50 rounded-lg bg-primary/5 flex items-center justify-center">
                        <p className="text-xs text-muted-foreground">Drop here</p>
                      </div>
                    )}

                    {column.tasks.length === 0 && !activeId && (
                      <div className="text-center py-8 text-muted-foreground">
                        <p className="text-sm">No tasks</p>
                      </div>
                    )}
                  </div>
                </SortableContext>

                {onAdd && (
                  <Button
                    variant="ghost"
                    className="w-full mt-3 text-muted-foreground hover:text-foreground border-dashed border border-border hover:border-primary/50"
                    onClick={() => onAdd(column.id)}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Task
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <DragOverlay>
        {activeId ? (
          <SortableTaskCard
            task={localData.find((task) => task.id === activeId)!}
            onEdit={onEdit}
            onDelete={onDelete}
            onView={onView}
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
