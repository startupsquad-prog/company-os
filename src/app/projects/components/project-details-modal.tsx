'use client'

import { useState, useEffect, useCallback } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import {
  Calendar,
  User,
  Tag,
  Edit,
  Trash2,
  CheckCircle2,
  Clock,
  FolderKanban,
} from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import type { ProjectFull } from '@/lib/types/projects'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Progress } from '@/components/ui/progress'
import type { TaskWithRelations } from '@/lib/types/supabase'

interface ProjectDetailsModalProps {
  project: ProjectFull | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onEdit?: (project: ProjectFull) => void
  onDelete?: (project: ProjectFull) => void
}

// Generate DiceBear Micah avatar URL
const getDiceBearAvatar = (seed: string) => {
  return `https://api.dicebear.com/7.x/micah/svg?seed=${encodeURIComponent(seed)}`
}

const getName = (profile: any) => {
  if (profile?.first_name && profile?.last_name) {
    return `${profile.first_name} ${profile.last_name}`
  }
  return profile?.email || 'Unknown'
}

const getInitials = (profile: any) => {
  if (profile?.first_name && profile?.last_name) {
    return `${profile.first_name[0]}${profile.last_name[0]}`
  }
  return profile?.email?.[0]?.toUpperCase() || '?'
}

// Category labels
const categoryLabels: Record<string, string> = {
  prototyping: 'Prototyping',
  ui_ux_design: 'UI/UX Design',
  development: 'Development',
  marketing: 'Marketing',
  research: 'Research',
}

// Status config
const statusConfig: Record<
  string,
  { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }
> = {
  planning: { label: 'Planning', variant: 'secondary' },
  in_progress: { label: 'In Progress', variant: 'default' },
  on_hold: { label: 'On Hold', variant: 'outline' },
  completed: { label: 'Completed', variant: 'default' },
  cancelled: { label: 'Cancelled', variant: 'destructive' },
}

export function ProjectDetailsModal({
  project,
  open,
  onOpenChange,
  onEdit,
  onDelete,
}: ProjectDetailsModalProps) {
  const [tasks, setTasks] = useState<TaskWithRelations[]>([])
  const [loading, setLoading] = useState(false)

  const fetchTasks = useCallback(async () => {
    if (!project) return

    try {
      setLoading(true)
      const response = await fetch(`/api/unified/projects/${project.id}/tasks`)
      if (!response.ok) {
        throw new Error('Failed to fetch tasks')
      }

      const result = await response.json()
      setTasks(result.data || [])
    } catch (error) {
      console.error('Error fetching tasks:', error)
      toast.error('Failed to load tasks')
    } finally {
      setLoading(false)
    }
  }, [project])

  useEffect(() => {
    if (open && project) {
      fetchTasks()
    }
  }, [open, project, fetchTasks])

  if (!project) {
    return null
  }

  const progress = project.progress || 0
  const category = project.category || ''
  const categoryLabel = categoryLabels[category] || category
  const status = project.status ? statusConfig[project.status] : null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="!max-w-[95vw] sm:!max-w-[95vw] lg:!max-w-[95vw] w-full h-[95vh] max-h-[95vh] p-0 gap-0 overflow-hidden flex flex-col"
        style={{ maxWidth: '95vw' }}
      >
        <DialogTitle className="sr-only">Project Details</DialogTitle>
        <DialogDescription className="sr-only">Project details and information</DialogDescription>

        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-3 border-b">
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">
              Created {format(new Date(project.created_at), 'MMM d, yyyy')}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {onEdit && (
              <Button variant="ghost" size="sm" onClick={() => onEdit(project)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            )}
            {onDelete && (
              <Button variant="ghost" size="sm" onClick={() => onDelete(project)}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Title Section */}
          <div className="space-y-4 mb-6">
            <h1 className="text-3xl font-bold">{project.name}</h1>

            {/* Quick Details */}
            <div className="flex flex-wrap items-center gap-4">
              <TooltipProvider>
                {/* Status */}
                {status && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </TooltipTrigger>
                    <TooltipContent>Status</TooltipContent>
                  </Tooltip>
                )}

                {/* Category */}
                {category && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge variant="outline">{categoryLabel}</Badge>
                    </TooltipTrigger>
                    <TooltipContent>Category</TooltipContent>
                  </Tooltip>
                )}

                {/* Start Date */}
                {project.start_date && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>Start: {format(new Date(project.start_date), 'MMM d, yyyy')}</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>Start Date</TooltipContent>
                  </Tooltip>
                )}

                {/* Due Date */}
                {project.due_date && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>Due: {format(new Date(project.due_date), 'MMM d, yyyy')}</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>Due Date</TooltipContent>
                  </Tooltip>
                )}

                {/* Department */}
                {project.department && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-2">
                        <Tag className="h-4 w-4 text-muted-foreground" />
                        <Badge variant="secondary">{project.department.name}</Badge>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>Department</TooltipContent>
                  </Tooltip>
                )}
              </TooltipProvider>
            </div>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="overview" className="w-full">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="tasks">
                Tasks ({tasks.length})
              </TabsTrigger>
              <TabsTrigger value="members">
                Members ({project.members?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6 mt-6">
              {/* Description */}
              <div>
                <h3 className="text-sm font-semibold mb-2">Description</h3>
                <p className="text-sm text-muted-foreground">
                  {project.description || 'No description provided'}
                </p>
              </div>

              <Separator />

              {/* Progress */}
              <div>
                <h3 className="text-sm font-semibold mb-2">Progress</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      {project.completed_tasks || 0} of {project.total_tasks || 0} tasks completed
                    </span>
                    <span className="text-sm font-medium">{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              </div>

              <Separator />

              {/* Team Members Preview */}
              {project.members && project.members.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold mb-2">Team Members</h3>
                  <div className="flex -space-x-2">
                    {project.members.slice(0, 8).map((member) => {
                      const profile = member.profile
                      const name = getName(profile)
                      const seed = profile?.email || member.profile_id
                      return (
                        <Tooltip key={member.id}>
                          <TooltipTrigger asChild>
                            <Avatar className="h-8 w-8 border-2 border-background cursor-pointer">
                              <AvatarImage src={getDiceBearAvatar(seed)} alt={name} />
                              <AvatarFallback className="text-xs">
                                {getInitials(profile)}
                              </AvatarFallback>
                            </Avatar>
                          </TooltipTrigger>
                          <TooltipContent>
                            {name} ({member.role})
                          </TooltipContent>
                        </Tooltip>
                      )
                    })}
                    {project.members.length > 8 && (
                      <Avatar className="h-8 w-8 border-2 border-background">
                        <AvatarFallback className="text-xs">
                          +{project.members.length - 8}
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="tasks" className="space-y-4 mt-6">
              {loading ? (
                <div className="text-center py-8 text-sm text-muted-foreground">Loading tasks...</div>
              ) : tasks.length === 0 ? (
                <div className="text-center py-8 text-sm text-muted-foreground">No tasks in this project</div>
              ) : (
                <div className="space-y-2">
                  {tasks.map((task) => {
                    const taskStatus = task.status ? statusConfig[task.status] : null
                    return (
                      <div
                        key={task.id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <FolderKanban className="h-4 w-4 text-muted-foreground" />
                          <div className="flex-1">
                            <p className="text-sm font-medium">{task.title}</p>
                            {task.description && (
                              <p className="text-xs text-muted-foreground line-clamp-1">
                                {task.description}
                              </p>
                            )}
                          </div>
                        </div>
                        {taskStatus && (
                          <Badge variant={taskStatus.variant} className="ml-2">
                            {taskStatus.label}
                          </Badge>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </TabsContent>

            <TabsContent value="members" className="space-y-4 mt-6">
              {project.members && project.members.length > 0 ? (
                <div className="space-y-2">
                  {project.members.map((member) => {
                    const profile = member.profile
                    const name = getName(profile)
                    const seed = profile?.email || member.profile_id
                    return (
                      <div
                        key={member.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={getDiceBearAvatar(seed)} alt={name} />
                            <AvatarFallback>{getInitials(profile)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">{name}</p>
                            <p className="text-xs text-muted-foreground">{profile?.email}</p>
                          </div>
                        </div>
                        <Badge variant="outline">{member.role}</Badge>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  No members assigned to this project
                </div>
              )}
            </TabsContent>

            <TabsContent value="activity" className="space-y-4 mt-6">
              {project.status_history && project.status_history.length > 0 ? (
                <div className="space-y-3">
                  {project.status_history.map((history) => {
                    const changedBy = history.changed_by_profile
                    const changedByName = changedBy ? getName(changedBy) : 'System'
                    return (
                      <div key={history.id} className="flex items-start gap-3 p-3 border rounded-lg">
                        <CheckCircle2 className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm">
                            Status changed from{' '}
                            <span className="font-medium">
                              {history.from_status || 'N/A'}
                            </span>{' '}
                            to <span className="font-medium">{history.to_status}</span>
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            by {changedByName} • {format(new Date(history.changed_at), 'MMM d, yyyy h:mm a')}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  No activity recorded
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  )
}

