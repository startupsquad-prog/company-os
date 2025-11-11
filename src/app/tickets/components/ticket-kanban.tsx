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
  User,
  Ticket,
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
import type { TicketFull } from '@/lib/types/tickets'

interface TicketKanbanProps {
  data: TicketFull[]
  statusOptions?: Array<{ label: string; value: string }>
  onEdit?: (ticket: TicketFull) => void
  onDelete?: (ticket: TicketFull) => void
  onView?: (ticket: TicketFull) => void
  onStatusChange?: (ticketId: string, newStatus: string) => Promise<void>
  onAdd?: (status?: string) => void
}

interface SortableTicketCardProps {
  ticket: TicketFull
  onEdit?: (ticket: TicketFull) => void
  onDelete?: (ticket: TicketFull) => void
  onView?: (ticket: TicketFull) => void
}

interface KanbanColumn {
  id: string
  title: string
  tickets: TicketFull[]
  color: string
}

function SortableTicketCard({
  ticket,
  onEdit,
  onDelete,
  onView,
}: SortableTicketCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: ticket.id,
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
    critical: {
      label: 'Critical',
      className: 'bg-red-100 text-red-800 border-red-200',
      color: 'text-red-500',
    },
  }

  const priority = ticket.priority ? priorityConfig[ticket.priority] : null

  // Generate DiceBear Micah avatar URL
  const getDiceBearAvatar = (seed: string) => {
    return `https://api.dicebear.com/7.x/micah/svg?seed=${encodeURIComponent(seed)}`
  }

  const assignee = ticket.assignee
  const assigneeName = assignee
    ? [assignee.first_name, assignee.last_name].filter(Boolean).join(' ') || 'Unknown'
    : null
  const assigneeEmail = assignee?.first_name ? `${assignee.first_name}${assignee.last_name || ''}` : ticket.ticket_number
  const assigneeInitials = assignee
    ? [assignee.first_name?.[0], assignee.last_name?.[0]].filter(Boolean).join('').toUpperCase() || '?'
    : ticket.ticket_number.slice(0, 2).toUpperCase()

  const dueDate = ticket.due_date ? new Date(ticket.due_date) : null
  const isOverdue = dueDate && isPast(dueDate) && ticket.status !== 'resolved' && ticket.status !== 'closed'
  const daysUntilDue = dueDate ? differenceInDays(dueDate, new Date()) : null
  const isDueSoon = daysUntilDue !== null && daysUntilDue <= 3 && daysUntilDue >= 0 && !isOverdue

  const clientName = ticket.client?.name || ticket.client_name || 'Unassigned'

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`bg-card shadow-sm hover:shadow-md transition-shadow cursor-pointer ${
        isDragging ? 'opacity-50' : ''
      } ${isOverdue ? 'border-destructive border-2 bg-destructive/5' : ''}`}
      onClick={() => onView?.(ticket)}
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
            {/* Ticket Number */}
            <div className="flex items-center gap-2">
              <Ticket className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs font-mono text-muted-foreground">{ticket.ticket_number}</span>
            </div>

            {/* Title */}
            <h4 className="font-medium text-sm leading-tight line-clamp-2">{ticket.title}</h4>

            {/* Client Name */}
            {clientName && clientName !== 'Unassigned' && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <User className="h-3 w-3" />
                <span className="truncate">{clientName}</span>
              </div>
            )}

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

              {ticket.category && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge variant="secondary" className="text-xs h-5 px-1.5">
                        {ticket.category}
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>Category</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}

              {assignee && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Avatar className="h-5 w-5 border border-background cursor-pointer">
                        <AvatarImage src={getDiceBearAvatar(assigneeEmail)} alt={assigneeName || 'Assignee'} />
                        <AvatarFallback className="text-[10px]">{assigneeInitials}</AvatarFallback>
                      </Avatar>
                    </TooltipTrigger>
                    <TooltipContent>{assigneeName}</TooltipContent>
                  </Tooltip>
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
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Due: {format(dueDate, 'MMM dd, yyyy')}</p>
                      {isOverdue && <p className="text-xs text-destructive">Overdue</p>}
                      {isDueSoon && <p className="text-xs text-orange-600">Due soon</p>}
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
                <DropdownMenuItem onClick={() => onView(ticket)}>View Details</DropdownMenuItem>
              )}
              {onEdit && (
                <DropdownMenuItem onClick={() => onEdit(ticket)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
              )}
              {onDelete && (
                <DropdownMenuItem onClick={() => onDelete(ticket)} className="text-destructive">
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

export function TicketKanban({
  data,
  statusOptions = [],
  onEdit,
  onDelete,
  onView,
  onStatusChange,
  onAdd,
}: TicketKanbanProps) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const [overId, setOverId] = useState<string | null>(null)
  const [localData, setLocalData] = useState<TicketFull[]>(data)

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
      new: 'bg-blue-50 border-blue-200',
      open: 'bg-yellow-50 border-yellow-200',
      in_progress: 'bg-purple-50 border-purple-200',
      waiting: 'bg-orange-50 border-orange-200',
      resolved: 'bg-green-50 border-green-200',
      closed: 'bg-gray-50 border-gray-200',
      cancelled: 'bg-red-50 border-red-200',
    }

    const getTicketsForStatus = (statusValue: string) => {
      return localData
        .filter((ticket) => {
          // Hide the dragged ticket from all columns - it will be shown in DragOverlay
          if (activeId && ticket.id === activeId) return false
          return !ticket.status ? statusValue === 'new' : ticket.status === statusValue
        })
        .sort((a, b) => {
          // Sort by created_at descending (newest first)
          const dateA = new Date(a.created_at).getTime()
          const dateB = new Date(b.created_at).getTime()
          return dateB - dateA
        })
    }

    if (statusOptions.length > 0) {
      return statusOptions.map((status) => ({
        id: status.value,
        title: status.label,
        tickets: getTicketsForStatus(status.value),
        color: statusColorMap[status.value] || 'bg-gray-50 border-gray-200',
      }))
    }

    // Fallback to default columns if statusOptions not provided
    return [
      {
        id: 'new',
        title: 'New',
        tickets: getTicketsForStatus('new'),
        color: 'bg-blue-50 border-blue-200',
      },
      {
        id: 'open',
        title: 'Open',
        tickets: getTicketsForStatus('open'),
        color: 'bg-yellow-50 border-yellow-200',
      },
      {
        id: 'in_progress',
        title: 'In Progress',
        tickets: getTicketsForStatus('in_progress'),
        color: 'bg-purple-50 border-purple-200',
      },
      {
        id: 'waiting',
        title: 'Waiting',
        tickets: getTicketsForStatus('waiting'),
        color: 'bg-orange-50 border-orange-200',
      },
      {
        id: 'resolved',
        title: 'Resolved',
        tickets: getTicketsForStatus('resolved'),
        color: 'bg-green-50 border-green-200',
      },
      {
        id: 'closed',
        title: 'Closed',
        tickets: getTicketsForStatus('closed'),
        color: 'bg-gray-50 border-gray-200',
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

    // Find the ticket being dragged
    const draggedTicket = localData.find((ticket) => ticket.id === activeId)
    if (!draggedTicket) return

    // Find the target column (status)
    const targetColumn = columns.find((col) => col.id === currentOverId)
    if (!targetColumn) return

    if (targetColumn.id === draggedTicket.status) {
      // Same column, no change needed
      return
    }

    // Moving to different column
    // Update local state optimistically
    setLocalData((prev) =>
      prev.map((ticket) =>
        ticket.id === activeId
          ? ({ ...ticket, status: targetColumn.id as any } as TicketFull)
          : ticket
      )
    )

    // Call the status change handler
    if (onStatusChange) {
      try {
        await onStatusChange(activeId, targetColumn.id)
        toast.success(`Ticket moved to ${targetColumn.title}`)
      } catch (error) {
        // Revert on error
        setLocalData(data)
        toast.error('Failed to update ticket status')
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
                    {column.tickets.length}
                  </Badge>
                </div>

                <SortableContext
                  items={column.tickets.map((ticket) => ticket.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-3 overflow-y-auto flex-1 pr-2 min-h-0">
                    {column.tickets.map((ticket) => (
                      <SortableTicketCard
                        key={ticket.id}
                        ticket={ticket}
                        onEdit={onEdit}
                        onDelete={onDelete}
                        onView={onView}
                      />
                    ))}

                    {/* Show placeholder when dragging over this column */}
                    {activeId && overId === column.id && (
                      <div className="h-20 border-2 border-dashed border-primary/50 rounded-lg bg-primary/5 flex items-center justify-center">
                        <p className="text-xs text-muted-foreground">Drop here</p>
                      </div>
                    )}

                    {column.tickets.length === 0 && !activeId && (
                      <div className="text-center py-8 text-muted-foreground">
                        <p className="text-sm">No tickets</p>
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
                    Add Ticket
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <DragOverlay>
        {activeId ? (
          <SortableTicketCard
            ticket={localData.find((ticket) => ticket.id === activeId)!}
            onEdit={onEdit}
            onDelete={onDelete}
            onView={onView}
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}

