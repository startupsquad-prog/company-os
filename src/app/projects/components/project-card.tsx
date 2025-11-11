'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { format, differenceInWeeks, differenceInDays } from 'date-fns'
import type { ProjectFull } from '@/lib/types/projects'
import { cn } from '@/lib/utils'

interface ProjectCardProps {
  project: ProjectFull
  onClick?: () => void
}

// Generate DiceBear Micah avatar URL
const getDiceBearAvatar = (seed: string) => {
  return `https://api.dicebear.com/7.x/micah/svg?seed=${encodeURIComponent(seed)}`
}

// Category color mapping
const categoryColors: Record<string, string> = {
  prototyping: 'bg-orange-500',
  ui_ux_design: 'bg-blue-500',
  development: 'bg-purple-500',
  marketing: 'bg-green-500',
  research: 'bg-pink-500',
}

// Progress bar colors
const progressColors: Record<string, string> = {
  prototyping: 'bg-orange-500',
  ui_ux_design: 'bg-blue-500',
  development: 'bg-purple-500',
  marketing: 'bg-green-500',
  research: 'bg-pink-500',
}

// Category labels
const categoryLabels: Record<string, string> = {
  prototyping: 'Prototyping',
  ui_ux_design: 'UI/UX Design',
  development: 'Development',
  marketing: 'Marketing',
  research: 'Research',
}

export function ProjectCard({ project, onClick }: ProjectCardProps) {
  const progress = project.progress || 0
  const category = project.category || 'development'
  const categoryColor = categoryColors[category] || 'bg-gray-500'
  const progressColor = progressColors[category] || 'bg-gray-500'
  const categoryLabel = categoryLabels[category] || category

  // Calculate time left
  let timeLeft: string | null = null
  let timeLeftColor = 'bg-gray-500'
  if (project.due_date) {
    const dueDate = new Date(project.due_date)
    const now = new Date()
    const daysLeft = differenceInDays(dueDate, now)
    const weeksLeft = differenceInWeeks(dueDate, now)

    if (daysLeft < 0) {
      timeLeft = 'Overdue'
      timeLeftColor = 'bg-red-500'
    } else if (weeksLeft === 0) {
      timeLeft = `${daysLeft} day${daysLeft !== 1 ? 's' : ''} left`
      timeLeftColor = categoryColor
    } else {
      timeLeft = `${weeksLeft} week${weeksLeft !== 1 ? 's' : ''} left`
      timeLeftColor = categoryColor
    }
  }

  // Format date
  const displayDate = project.start_date
    ? format(new Date(project.start_date), 'MMM dd, yyyy')
    : project.created_at
      ? format(new Date(project.created_at), 'MMM dd, yyyy')
      : ''

  // Get team members (limit to 4 for display)
  const members = project.members?.slice(0, 4) || []
  const remainingMembers = (project.members?.length || 0) - members.length

  return (
    <Card
      className={cn(
        'cursor-pointer transition-all hover:shadow-md hover:border-primary/50',
        'flex flex-col h-full'
      )}
      onClick={onClick}
    >
      <CardContent className="p-6 flex flex-col flex-1">
        {/* Header */}
        <div className="mb-4">
          <h3 className="text-lg font-semibold mb-2 line-clamp-2">{project.name}</h3>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline" className={cn('text-xs', categoryColor.replace('bg-', 'text-'))}>
              {categoryLabel}
            </Badge>
            {displayDate && (
              <span className="text-xs text-muted-foreground">{displayDate}</span>
            )}
          </div>
        </div>

        {/* Progress */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Progress</span>
            <span className="text-sm text-muted-foreground">{progress}%</span>
          </div>
          <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary">
            <div
              className={cn('h-full transition-all', progressColor)}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="mt-auto flex items-center justify-between">
          {/* Team Members */}
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              {members.map((member) => {
                const profile = member.profile
                const name = profile
                  ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.email
                  : 'Unknown'
                const seed = profile?.email || member.profile_id
                const initials = profile
                  ? `${profile.first_name?.[0] || ''}${profile.last_name?.[0] || ''}`.trim() ||
                    profile.email?.[0]?.toUpperCase() ||
                    '?'
                  : '?'

                return (
                  <Avatar
                    key={member.id}
                    className="h-8 w-8 border-2 border-background"
                    title={name}
                  >
                    <AvatarImage src={getDiceBearAvatar(seed)} alt={name} />
                    <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                  </Avatar>
                )
              })}
            </div>
            {remainingMembers > 0 && (
              <span className="text-xs text-muted-foreground">+{remainingMembers}</span>
            )}
          </div>

          {/* Time Left */}
          {timeLeft && (
            <Badge className={cn('text-xs', timeLeftColor)}>{timeLeft}</Badge>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

