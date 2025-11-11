'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { DatePicker } from '@/components/ui/date-picker'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  User,
  Calendar,
  Tag,
  Save,
  X,
  Plus as PlusIcon,
} from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import type { ProjectFormData, ProjectFull } from '@/lib/types/projects'
import { createClient } from '@/lib/supabase/client'

interface ProjectFormProps {
  project?: ProjectFull | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: ProjectFormData) => Promise<void>
  statusOptions: { label: string; value: string }[]
  categoryOptions: { label: string; value: string }[]
  departmentOptions: { label: string; value: string }[]
}

// Generate DiceBear Micah avatar URL
const getDiceBearAvatar = (seed: string) => {
  return `https://api.dicebear.com/7.x/micah/svg?seed=${encodeURIComponent(seed)}`
}

export function ProjectForm({
  project,
  open,
  onOpenChange,
  onSubmit,
  statusOptions,
  categoryOptions,
  departmentOptions,
}: ProjectFormProps) {
  const [formData, setFormData] = useState<ProjectFormData>({
    name: '',
    description: '',
    category: undefined,
    status: undefined,
    start_date: undefined,
    due_date: undefined,
    department_id: undefined,
    vertical_key: '',
    members: [],
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [memberOpen, setMemberOpen] = useState(false)
  const [startDateOpen, setStartDateOpen] = useState(false)
  const [dueDateOpen, setDueDateOpen] = useState(false)
  const [availableProfiles, setAvailableProfiles] = useState<
    Array<{ id: string; first_name: string | null; last_name: string | null; email: string }>
  >([])
  const [selectedMembers, setSelectedMembers] = useState<
    Array<{ profile_id: string; role: 'owner' | 'collaborator' | 'watcher' }>
  >([])

  useEffect(() => {
    // Fetch available profiles for members
    const fetchProfiles = async () => {
      try {
        const supabase = createClient()
        const { data: profiles } = await (supabase as any)
          .schema('core')
          .from('profiles')
          .select('id, first_name, last_name, email')
          .is('deleted_at', null)
          .order('first_name')

        if (profiles) {
          setAvailableProfiles(profiles)
        }
      } catch (error) {
        console.error('Error fetching profiles:', error)
      }
    }

    if (open) {
      fetchProfiles()
    }
  }, [open])

  useEffect(() => {
    if (project) {
      setFormData({
        name: project.name,
        description: project.description || '',
        category: project.category || undefined,
        status: project.status || undefined,
        start_date: project.start_date ? new Date(project.start_date) : undefined,
        due_date: project.due_date ? new Date(project.due_date) : undefined,
        department_id: project.department_id || undefined,
        vertical_key: project.vertical_key || '',
        members: [],
      })
      setSelectedMembers(
        project.members?.map((m) => ({
          profile_id: m.profile_id,
          role: m.role as 'owner' | 'collaborator' | 'watcher',
        })) || []
      )
    } else {
      setFormData({
        name: '',
        description: '',
        category: undefined,
        status: undefined,
        start_date: undefined,
        due_date: undefined,
        department_id: undefined,
        vertical_key: '',
        members: [],
      })
      setSelectedMembers([])
    }
  }, [project, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await onSubmit({
        ...formData,
        members: selectedMembers,
      })
      onOpenChange(false)
    } catch (error) {
      console.error('Error submitting project:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const toggleMember = (profileId: string, role: 'owner' | 'collaborator' | 'watcher' = 'collaborator') => {
    setSelectedMembers((prev) => {
      const existing = prev.find((m) => m.profile_id === profileId)
      if (existing) {
        return prev.filter((m) => m.profile_id !== profileId)
      }
      return [...prev, { profile_id: profileId, role }]
    })
  }

  const updateMemberRole = (profileId: string, role: 'owner' | 'collaborator' | 'watcher') => {
    setSelectedMembers((prev) =>
      prev.map((m) => (m.profile_id === profileId ? { ...m, role } : m))
    )
  }

  const isMemberSelected = (profileId: string) => {
    return selectedMembers.some((m) => m.profile_id === profileId)
  }

  const getMemberRole = (profileId: string) => {
    return selectedMembers.find((m) => m.profile_id === profileId)?.role || 'collaborator'
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col p-0">
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <DialogTitle className="text-lg font-semibold">
              {project ? 'Edit Project' : 'Create Project'}
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Button type="submit" size="sm" disabled={isSubmitting} className="gap-2">
                <Save className="h-4 w-4" />
                {isSubmitting ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>

          {/* Content - Scrollable */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-6">
              {/* Project Name Input - Full Width */}
              <div className="space-y-2">
                <Label>Project Name</Label>
                <Input
                  placeholder="Enter project name..."
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full text-base"
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  placeholder="Enter project description..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  className="w-full"
                />
              </div>

              {/* Two Column Layout */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Category */}
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select
                    value={formData.category || ''}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categoryOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Status */}
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={formData.status || ''}
                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Start Date */}
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Popover open={startDateOpen} onOpenChange={setStartDateOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        {formData.start_date ? (
                          format(formData.start_date, 'MMM dd, yyyy')
                        ) : (
                          <span>Select date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <DatePicker
                        date={formData.start_date}
                        onDateChange={(date) => {
                          setFormData({ ...formData, start_date: date })
                          setStartDateOpen(false)
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Due Date */}
                <div className="space-y-2">
                  <Label>Due Date</Label>
                  <Popover open={dueDateOpen} onOpenChange={setDueDateOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        {formData.due_date ? (
                          format(formData.due_date, 'MMM dd, yyyy')
                        ) : (
                          <span>Select date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <DatePicker
                        date={formData.due_date}
                        onDateChange={(date) => {
                          setFormData({ ...formData, due_date: date })
                          setDueDateOpen(false)
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Department */}
                <div className="space-y-2">
                  <Label>Department</Label>
                  <Select
                    value={formData.department_id || 'none'}
                    onValueChange={(value) =>
                      setFormData({ ...formData, department_id: value === 'none' ? undefined : value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {departmentOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Members */}
                <div className="space-y-2">
                  <Label>Team Members</Label>
                  <Popover open={memberOpen} onOpenChange={setMemberOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <User className="mr-2 h-4 w-4" />
                        {selectedMembers.length > 0 ? (
                          <div className="flex items-center gap-2 flex-1">
                            <div className="flex -space-x-2">
                              {selectedMembers.slice(0, 3).map((member) => {
                                const profile = availableProfiles.find((p) => p.id === member.profile_id)
                                const name = profile
                                  ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() ||
                                    profile.email
                                  : 'Unknown'
                                const seed = profile?.email || member.profile_id
                                return (
                                  <Avatar
                                    key={member.profile_id}
                                    className="h-6 w-6 border-2 border-background"
                                  >
                                    <AvatarImage src={getDiceBearAvatar(seed)} alt={name} />
                                    <AvatarFallback className="text-xs">
                                      {profile?.first_name?.[0] ||
                                        profile?.email?.[0]?.toUpperCase() ||
                                        '?'}
                                    </AvatarFallback>
                                  </Avatar>
                                )
                              })}
                            </div>
                            {selectedMembers.length > 3 && (
                              <span className="text-sm text-muted-foreground">
                                +{selectedMembers.length - 3}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span>Select members</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64 p-2" align="start">
                      <div className="space-y-1 max-h-[300px] overflow-y-auto">
                        {availableProfiles.map((profile) => {
                          const name =
                            `${profile.first_name || ''} ${profile.last_name || ''}`.trim() ||
                            profile.email
                          const seed = profile.email || profile.id
                          const isSelected = isMemberSelected(profile.id)
                          const role = getMemberRole(profile.id)
                          return (
                            <div key={profile.id} className="space-y-1">
                              <Button
                                type="button"
                                variant="ghost"
                                className="w-full justify-start"
                                onClick={() => toggleMember(profile.id)}
                              >
                                <Avatar className="h-6 w-6 mr-2">
                                  <AvatarImage src={getDiceBearAvatar(seed)} alt={name} />
                                  <AvatarFallback className="text-xs">
                                    {profile.first_name?.[0] ||
                                      profile.email?.[0]?.toUpperCase() ||
                                      '?'}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="flex-1 text-left">{name}</span>
                                {isSelected && <X className="h-4 w-4" />}
                              </Button>
                              {isSelected && (
                                <div className="flex gap-1 ml-8">
                                  {(['owner', 'collaborator', 'watcher'] as const).map((r) => (
                                    <Button
                                      key={r}
                                      type="button"
                                      variant={role === r ? 'default' : 'outline'}
                                      size="sm"
                                      className="h-6 text-xs px-2"
                                      onClick={() => updateMemberRole(profile.id, r)}
                                    >
                                      {r}
                                    </Button>
                                  ))}
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

