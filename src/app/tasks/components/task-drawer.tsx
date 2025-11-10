'use client'

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { getDiceBearAvatar } from '@/lib/utils'
import { format } from 'date-fns'
import type { TaskFull } from '@/lib/types/tasks'

interface TaskDrawerProps {
  task: TaskFull | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onEdit?: (task: TaskFull) => void
  onDelete?: (task: TaskFull) => void
}

export function TaskDrawer({ task, open, onOpenChange, onEdit, onDelete }: TaskDrawerProps) {
  if (!task) return null

  const statusConfig: Record<
    string,
    { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }
  > = {
    pending: { label: 'Pending', variant: 'outline' },
    in_progress: { label: 'In Progress', variant: 'default' },
    completed: { label: 'Completed', variant: 'secondary' },
    cancelled: { label: 'Cancelled', variant: 'destructive' },
  }

  const priorityConfig: Record<string, { label: string; className: string }> = {
    low: { label: 'Low', className: 'bg-gray-100 text-gray-800 border-gray-200' },
    medium: { label: 'Medium', className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
    high: { label: 'High', className: 'bg-orange-100 text-orange-800 border-orange-200' },
    urgent: { label: 'Urgent', className: 'bg-red-100 text-red-800 border-red-200' },
  }

  const status = task.status ? statusConfig[task.status] : null
  const priority = task.priority ? priorityConfig[task.priority] : null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <SheetTitle className="text-2xl mb-2">{task.title}</SheetTitle>
              <div className="flex items-center gap-2 mb-4">
                {status && <Badge variant={status.variant}>{status.label}</Badge>}
                {priority && (
                  <Badge variant="outline" className={priority.className}>
                    {priority.label}
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {onEdit && (
                <Button variant="outline" size="sm" onClick={() => onEdit(task)}>
                  Edit
                </Button>
              )}
              {onDelete && (
                <Button variant="destructive" size="sm" onClick={() => onDelete(task)}>
                  Delete
                </Button>
              )}
            </div>
          </div>
        </SheetHeader>

        <SheetDescription className="sr-only">Task details and information</SheetDescription>

        <div className="mt-6 space-y-6">
          {task.description && (
            <div>
              <h3 className="text-sm font-semibold mb-2">Description</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {task.description}
              </p>
            </div>
          )}

          <Separator />

          <div className="grid grid-cols-2 gap-4">
            {task.department && (
              <div>
                <h3 className="text-sm font-semibold mb-1">Department</h3>
                <p className="text-sm text-muted-foreground">{task.department.name}</p>
              </div>
            )}
            {task.vertical_key && (
              <div>
                <h3 className="text-sm font-semibold mb-1">Vertical</h3>
                <p className="text-sm text-muted-foreground">{task.vertical_key}</p>
              </div>
            )}
            {task.due_date && (
              <div>
                <h3 className="text-sm font-semibold mb-1">Due Date</h3>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(task.due_date), 'MMM dd, yyyy')}
                </p>
              </div>
            )}
            <div>
              <h3 className="text-sm font-semibold mb-1">Created</h3>
              <p className="text-sm text-muted-foreground">
                {format(new Date(task.created_at), 'MMM dd, yyyy')}
              </p>
            </div>
          </div>

          {task.assignees && task.assignees.length > 0 && (
            <>
              <Separator />
              <div>
                <h3 className="text-sm font-semibold mb-3">Assignees</h3>
                <div className="space-y-2">
                  {task.assignees.map((assignee) => {
                    const profile = assignee.profile
                    const name =
                      profile?.first_name && profile?.last_name
                        ? `${profile.first_name} ${profile.last_name}`
                        : profile?.email || 'Unknown'
                    const initials =
                      profile?.first_name && profile?.last_name
                        ? `${profile.first_name[0]}${profile.last_name[0]}`
                        : profile?.email?.[0]?.toUpperCase() || '?'

                    return (
                      <div key={assignee.id} className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={getDiceBearAvatar(profile?.email || assignee.profile_id || 'default')} alt={name} />
                          <AvatarFallback>{initials}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{name}</p>
                          <p className="text-xs text-muted-foreground capitalize">
                            {assignee.role}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </>
          )}

          {task.created_by_profile && (
            <>
              <Separator />
              <div>
                <h3 className="text-sm font-semibold mb-1">Created By</h3>
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={getDiceBearAvatar(task.created_by_profile.email || task.created_by_profile.id || 'default')} />
                    <AvatarFallback>
                      {task.created_by_profile.first_name?.[0]}
                      {task.created_by_profile.last_name?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <p className="text-sm">
                    {task.created_by_profile.first_name && task.created_by_profile.last_name
                      ? `${task.created_by_profile.first_name} ${task.created_by_profile.last_name}`
                      : task.created_by_profile.email || 'Unknown'}
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
