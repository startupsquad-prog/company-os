"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header"
import { TaskRowActions } from "./task-row-actions"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { format, isPast } from "date-fns"
import type { TaskFull } from "@/lib/types/tasks"
import { calculateUrgencyTag, getUrgencyTagConfig, formatDueDateRelative, formatCreatedRelative } from "@/lib/utils/task-utils"

export const createTaskColumns = (
  onView?: (task: TaskFull) => void,
  onEdit?: (task: TaskFull) => void,
  onDelete?: (task: TaskFull) => void,
  onAssign?: (task: TaskFull) => void
): ColumnDef<TaskFull>[] => [
  {
    id: "select",
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
    accessorKey: "title",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Title" />
    ),
    cell: ({ row }) => {
      const task = row.original
      return (
        <Button
          variant="link"
          className="h-auto p-0 font-medium text-left justify-start"
          onClick={() => onView?.(task)}
        >
          {task.title}
        </Button>
      )
    },
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => {
      const status = row.getValue("status") as string | null
      if (!status) return null
      
      const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
        pending: { label: "Pending", variant: "outline" },
        in_progress: { label: "In Progress", variant: "default" },
        completed: { label: "Completed", variant: "secondary" },
        cancelled: { label: "Cancelled", variant: "destructive" },
      }
      
      const config = statusConfig[status] || { label: status, variant: "outline" as const }
      
      return (
        <Badge variant={config.variant}>
          {config.label}
        </Badge>
      )
    },
    filterFn: (row, id, value) => {
      const status = row.getValue(id) as string | null
      return value.includes(status || '')
    },
  },
  {
    accessorKey: "priority",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Priority" />
    ),
    cell: ({ row }) => {
      const priority = row.getValue("priority") as string | null
      if (!priority) return null
      
      const priorityConfig: Record<string, { label: string; className: string }> = {
        low: { label: "Low", className: "bg-gray-100 text-gray-800 border-gray-200" },
        medium: { label: "Medium", className: "bg-yellow-100 text-yellow-800 border-yellow-200" },
        high: { label: "High", className: "bg-orange-100 text-orange-800 border-orange-200" },
        urgent: { label: "Urgent", className: "bg-red-100 text-red-800 border-red-200" },
      }
      
      const config = priorityConfig[priority] || { label: priority, className: "" }
      
      return (
        <Badge variant="outline" className={config.className}>
          {config.label}
        </Badge>
      )
    },
    filterFn: (row, id, value) => {
      const priority = row.getValue(id) as string | null
      return value.includes(priority || '')
    },
  },
  {
    id: "urgency_tag",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Urgency" />
    ),
    accessorFn: (row) => {
      const tag = row.urgency_tag || calculateUrgencyTag(row)
      return tag || ''
    },
    cell: ({ row }) => {
      const task = row.original
      const tag = task.urgency_tag || calculateUrgencyTag(task)
      const config = getUrgencyTagConfig(tag)
      
      if (!config) return null
      
      return (
        <Badge variant="outline" className={config.className}>
          {config.label}
        </Badge>
      )
    },
    filterFn: (row, id, value) => {
      const task = row.original
      const tag = task.urgency_tag || calculateUrgencyTag(task)
      return value.includes(tag || '')
    },
  },
  {
    id: "assignees",
    header: "Assignees",
    cell: ({ row }) => {
      const assignees = row.original.assignees || []
      const visibleAssignees = assignees.slice(0, 3)
      const remaining = assignees.length - visibleAssignees.length
      
      if (assignees.length === 0) {
        return <span className="text-sm text-muted-foreground">Unassigned</span>
      }
      
      const getDiceBearAvatar = (seed: string) => {
        return `https://api.dicebear.com/7.x/micah/svg?seed=${encodeURIComponent(seed)}`
      }
      
      return (
        <TooltipProvider>
          <div className="flex items-center -space-x-2">
            {visibleAssignees.map((assignee) => {
              const profile = assignee.profile
              const name = profile?.first_name && profile?.last_name
                ? `${profile.first_name} ${profile.last_name}`
                : profile?.email || 'Unknown'
              const initials = profile?.first_name && profile?.last_name
                ? `${profile.first_name[0]}${profile.last_name[0]}`
                : profile?.email?.[0]?.toUpperCase() || '?'
              
              const seed = profile?.email || assignee.profile_id || 'unknown'
              return (
                <Tooltip key={assignee.id}>
                  <TooltipTrigger asChild>
                    <Avatar className="h-8 w-8 border-2 border-background cursor-pointer hover:ring-2 hover:ring-primary transition-all">
                      <AvatarImage src={getDiceBearAvatar(seed)} alt={name} />
                      <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                    </Avatar>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{name}</p>
                    {profile?.email && <p className="text-xs text-muted-foreground">{profile.email}</p>}
                  </TooltipContent>
                </Tooltip>
              )
            })}
            {remaining > 0 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="h-8 w-8 rounded-full border-2 border-background bg-muted flex items-center justify-center text-xs font-medium cursor-pointer hover:bg-muted/80 transition-colors">
                    +{remaining}
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{remaining} more assignee{remaining > 1 ? 's' : ''}</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </TooltipProvider>
      )
    },
  },
  {
    id: "department",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Department" />
    ),
    accessorFn: (row) => row.department?.name || "",
    cell: ({ row }) => {
      const department = row.original.department
      return department ? (
        <Badge variant="secondary" className="bg-blue-100 text-blue-800 hover:bg-blue-200">
          {department.name}
        </Badge>
      ) : (
        <span className="text-sm text-muted-foreground">—</span>
      )
    },
    filterFn: (row, id, value) => {
      const departmentId = row.original.department_id
      return value.includes(departmentId || '')
    },
  },
  {
    accessorKey: "due_date",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Due Date" />
    ),
    cell: ({ row }) => {
      const dueDate = row.getValue("due_date") as string | null
      if (!dueDate) return <span className="text-sm text-muted-foreground">—</span>
      
      const date = new Date(dueDate)
      const isOverdue = isPast(date) && row.original.status !== 'completed'
      const relative = formatDueDateRelative(dueDate)
      
      return (
        <div className="flex flex-col gap-0.5">
          <span className={`text-sm ${isOverdue ? 'text-destructive font-medium' : ''}`}>
            {format(date, "MMM dd, yyyy")}
          </span>
          {relative && (
            <span className={`text-xs ${isOverdue ? 'text-destructive' : 'text-muted-foreground'}`}>
              {relative}
            </span>
          )}
        </div>
      )
    },
  },
  {
    id: "created_by_profile",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Created" />
    ),
    accessorFn: (row) => {
      const creator = row.created_by_profile
      if (!creator) return ""
      return creator.first_name && creator.last_name
        ? `${creator.first_name} ${creator.last_name}`
        : creator.email || 'Unknown'
    },
    cell: ({ row }) => {
      const creator = row.original.created_by_profile
      const createdAt = row.original.created_at
      const relative = createdAt ? formatCreatedRelative(createdAt) : null
      
      if (!creator) {
        return (
          <div className="flex flex-col gap-0.5">
            <span className="text-sm text-muted-foreground">—</span>
            {relative && (
              <span className="text-xs text-muted-foreground">{relative}</span>
            )}
          </div>
        )
      }
      
      const name = creator.first_name && creator.last_name
        ? `${creator.first_name} ${creator.last_name}`
        : creator.email || 'Unknown'
      const initials = creator.first_name && creator.last_name
        ? `${creator.first_name[0]}${creator.last_name[0]}`
        : creator.email?.[0]?.toUpperCase() || '?'
      
      return (
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={creator.avatar_url || undefined} alt={name} />
              <AvatarFallback className="text-xs">{initials}</AvatarFallback>
            </Avatar>
            <span className="text-sm">{name}</span>
          </div>
          {relative && (
            <span className="text-xs text-muted-foreground ml-8">{relative}</span>
          )}
        </div>
      )
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => (
      <TaskRowActions
        row={row}
        onView={onView}
        onEdit={onEdit}
        onDelete={onDelete}
        onAssign={onAssign}
      />
    ),
    enableHiding: false,
  },
]

