"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Edit, Trash2, Eye, MoreHorizontal } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { format, isPast } from "date-fns"
import type { TaskFull } from "@/lib/types/tasks"
import { calculateUrgencyTag, getUrgencyTagConfig, formatDueDateRelative, formatCreatedRelative } from "@/lib/utils/task-utils"

interface TaskListProps {
  data: TaskFull[]
  onEdit?: (task: TaskFull) => void
  onDelete?: (task: TaskFull) => void
  onView?: (task: TaskFull) => void
}

export function TaskList({ data, onEdit, onDelete, onView }: TaskListProps) {
  const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
    pending: { label: "Pending", variant: "outline" },
    in_progress: { label: "In Progress", variant: "default" },
    completed: { label: "Completed", variant: "secondary" },
    cancelled: { label: "Cancelled", variant: "destructive" },
  }

  const priorityConfig: Record<string, { label: string; className: string }> = {
    low: { label: "Low", className: "bg-gray-100 text-gray-800 border-gray-200" },
    medium: { label: "Medium", className: "bg-yellow-100 text-yellow-800 border-yellow-200" },
    high: { label: "High", className: "bg-orange-100 text-orange-800 border-orange-200" },
    urgent: { label: "Urgent", className: "bg-red-100 text-red-800 border-red-200" },
  }

  return (
    <div className="space-y-3 overflow-y-auto flex-1 p-4 min-h-0">
      {data.map((task) => {
        const status = task.status ? statusConfig[task.status] : null
        const priority = task.priority ? priorityConfig[task.priority] : null
        const assignees = task.assignees || []
        const visibleAssignees = assignees.slice(0, 3)
        const remaining = assignees.length - visibleAssignees.length
        const dueDate = task.due_date ? new Date(task.due_date) : null
        const isOverdue = dueDate && isPast(dueDate) && task.status !== 'completed'
        const createdDate = new Date(task.created_at)
        
        // Calculate urgency tag
        const urgencyTag = task.urgency_tag || calculateUrgencyTag(task)
        const urgencyConfig = getUrgencyTagConfig(urgencyTag)
        
        return (
          <Card 
            key={task.id} 
            className={`hover:shadow-md transition-shadow ${
              isOverdue ? 'border-destructive border-2 bg-destructive/5' : ''
            }`}
          >
            <CardContent className="p-3 md:p-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                <div className="flex-1 min-w-0 w-full sm:w-auto">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <h3 className="font-semibold text-sm sm:text-base truncate">
                      {task.title}
                    </h3>
                    {urgencyConfig && (
                      <Badge variant="outline" className={`text-xs ${urgencyConfig.className}`}>
                        {urgencyConfig.label}
                      </Badge>
                    )}
                    {status && (
                      <Badge variant={status.variant} className="text-xs">
                        {status.label}
                      </Badge>
                    )}
                    {priority && (
                      <Badge variant="outline" className={`text-xs ${priority.className}`}>
                        {priority.label}
                      </Badge>
                    )}
                  </div>
                  
                  {task.description && (
                    <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 mb-3">
                      {task.description}
                    </p>
                  )}
                  
                  <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                    {assignees.length > 0 && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs">Assignees:</span>
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
                              const getDiceBearAvatar = (seed: string) => {
                                return `https://api.dicebear.com/7.x/micah/svg?seed=${encodeURIComponent(seed)}`
                              }
                              return (
                                <Tooltip key={assignee.id}>
                                  <TooltipTrigger asChild>
                                    <Avatar className="h-6 w-6 border-2 border-background cursor-pointer">
                                      <AvatarImage src={getDiceBearAvatar(seed)} alt={name} />
                                      <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                                    </Avatar>
                                  </TooltipTrigger>
                                  <TooltipContent>{name}</TooltipContent>
                                </Tooltip>
                              )
                            })}
                            {remaining > 0 && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="h-6 w-6 rounded-full border-2 border-background bg-muted flex items-center justify-center text-xs font-medium cursor-pointer hover:bg-muted/80 transition-colors">
                                    +{remaining}
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{remaining} more assignee{remaining > 1 ? 's' : ''}</p>
                                  {assignees.slice(visibleAssignees.length).map((assignee) => {
                                    const profile = assignee.profile
                                    const name = profile?.first_name && profile?.last_name
                                      ? `${profile.first_name} ${profile.last_name}`
                                      : profile?.email || 'Unknown'
                                    return <p key={assignee.id} className="text-xs text-muted-foreground">{name}</p>
                                  })}
                                </TooltipContent>
                              </Tooltip>
                            )}
                          </div>
                        </TooltipProvider>
                      </div>
                    )}
                    
                    {dueDate && (
                      <div className={`flex flex-col gap-0.5 text-xs ${isOverdue ? 'text-destructive font-medium' : ''}`}>
                        <span>Due: {format(dueDate, "MMM dd, yyyy")}</span>
                        {formatDueDateRelative(dueDate) && (
                          <span className="text-[10px] opacity-75">
                            {formatDueDateRelative(dueDate)}
                          </span>
                        )}
                      </div>
                    )}
                    
                    <div className="flex flex-col gap-0.5 text-xs">
                      <span>Created: {format(createdDate, "MMM dd, yyyy")}</span>
                      <span className="text-[10px] opacity-75">
                        {formatCreatedRelative(createdDate)}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 flex-shrink-0">
                  {onView && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onView(task)}
                      className="h-8 w-8 p-0"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  )}
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      {onEdit && (
                        <DropdownMenuItem onClick={() => onEdit(task)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                      )}
                      {onDelete && (
                        <DropdownMenuItem 
                          onClick={() => onDelete(task)}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
      
      {data.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-sm">No tasks found</p>
        </div>
      )}
    </div>
  )
}

