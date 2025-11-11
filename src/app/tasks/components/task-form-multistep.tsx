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
  Flag,
  Save,
  X,
  Clock,
  Plus as PlusIcon,
  Trash2,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
} from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import type { TaskFormData } from '@/lib/types/tasks'
import { createClient } from '@/lib/supabase/client'

interface TaskFormMultiStepProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: TaskFormData & { subtasks?: Array<{ title: string; description?: string }>; deliverables?: Array<{ name: string; description?: string }> }) => Promise<void>
  statusOptions: { label: string; value: string }[]
  priorityOptions: { label: string; value: string }[]
  departmentOptions: { label: string; value: string }[]
  defaultStatus?: string
}

interface Subtask {
  title: string
  description: string
}

interface Deliverable {
  name: string
  description: string
}

export function TaskFormMultiStep({
  open,
  onOpenChange,
  onSubmit,
  statusOptions,
  priorityOptions,
  departmentOptions,
  defaultStatus,
}: TaskFormMultiStepProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Step 1: Basic Info
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')

  // Step 2: Assignment & Details
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([])
  const [status, setStatus] = useState<string>(defaultStatus || '')
  const [priority, setPriority] = useState<string>('')
  const [departmentId, setDepartmentId] = useState<string>('')
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined)
  const [estimatedDuration, setEstimatedDuration] = useState<string>('')
  const [availableProfiles, setAvailableProfiles] = useState<
    Array<{ id: string; first_name: string | null; last_name: string | null; email: string }>
  >([])

  // Step 3: Subtasks
  const [subtasks, setSubtasks] = useState<Subtask[]>([])
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('')
  const [newSubtaskDescription, setNewSubtaskDescription] = useState('')

  // Step 4: Deliverables
  const [deliverables, setDeliverables] = useState<Deliverable[]>([])
  const [newDeliverableName, setNewDeliverableName] = useState('')
  const [newDeliverableDescription, setNewDeliverableDescription] = useState('')

  const totalSteps = 4

  // Fetch profiles on mount
  useEffect(() => {
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

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setCurrentStep(1)
      setTitle('')
      setDescription('')
      setSelectedAssignees([])
      setStatus(defaultStatus || '')
      setPriority('')
      setDepartmentId('')
      setDueDate(undefined)
      setEstimatedDuration('')
      setSubtasks([])
      setNewSubtaskTitle('')
      setNewSubtaskDescription('')
      setDeliverables([])
      setNewDeliverableName('')
      setNewDeliverableDescription('')
    }
  }, [open, defaultStatus])

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return title.trim().length > 0
      case 2:
        return true // All fields optional
      case 3:
        return true // Subtasks optional
      case 4:
        return true // Deliverables optional
      default:
        return false
    }
  }

  const handleNext = () => {
    if (validateStep(currentStep) && currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = async () => {
    if (!validateStep(1)) return

    setIsSubmitting(true)
    try {
      const formData: TaskFormData & { subtasks?: Subtask[]; deliverables?: Deliverable[] } = {
        title: title.trim(),
        description: description.trim() || undefined,
        status: status || undefined,
        priority: priority || undefined,
        department_id: departmentId || undefined,
        due_date: dueDate,
        estimated_duration: estimatedDuration ? parseInt(estimatedDuration, 10) : undefined,
        assignees: selectedAssignees.map((profileId) => ({
          profile_id: profileId,
          role: 'collaborator' as const,
        })),
        subtasks: subtasks.length > 0 ? subtasks : undefined,
        deliverables: deliverables.length > 0 ? deliverables : undefined,
      }
      await onSubmit(formData)
      onOpenChange(false)
    } catch (error) {
      console.error('Error submitting task:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const addSubtask = () => {
    if (newSubtaskTitle.trim()) {
      setSubtasks([
        ...subtasks,
        {
          title: newSubtaskTitle.trim(),
          description: newSubtaskDescription.trim(),
        },
      ])
      setNewSubtaskTitle('')
      setNewSubtaskDescription('')
    }
  }

  const removeSubtask = (index: number) => {
    setSubtasks(subtasks.filter((_, i) => i !== index))
  }

  const addDeliverable = () => {
    if (newDeliverableName.trim()) {
      setDeliverables([
        ...deliverables,
        {
          name: newDeliverableName.trim(),
          description: newDeliverableDescription.trim(),
        },
      ])
      setNewDeliverableName('')
      setNewDeliverableDescription('')
    }
  }

  const removeDeliverable = (index: number) => {
    setDeliverables(deliverables.filter((_, i) => i !== index))
  }

  const toggleAssignee = (profileId: string) => {
    setSelectedAssignees((prev) =>
      prev.includes(profileId) ? prev.filter((id) => id !== profileId) : [...prev, profileId]
    )
  }

  const getDiceBearAvatar = (seed: string) => {
    return `https://api.dicebear.com/7.x/micah/svg?seed=${encodeURIComponent(seed)}`
  }

  const getName = (profile: typeof availableProfiles[0]) => {
    if (profile?.first_name && profile?.last_name) {
      return `${profile.first_name} ${profile.last_name}`
    }
    return profile?.email || 'Unknown'
  }

  const getInitials = (profile: typeof availableProfiles[0]) => {
    if (profile?.first_name && profile?.last_name) {
      return `${profile.first_name[0]}${profile.last_name[0]}`
    }
    return profile?.email?.[0]?.toUpperCase() || '?'
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="p-6 border-b">
          <DialogTitle className="text-lg font-semibold">Create Task</DialogTitle>
          <DialogDescription>
            Step {currentStep} of {totalSteps}
          </DialogDescription>
          {/* Progress Indicator */}
          <div className="flex items-center gap-2 mt-4">
            {[1, 2, 3, 4].map((step) => (
              <div
                key={step}
                className={cn(
                  'flex-1 h-2 rounded-full transition-colors',
                  step < currentStep
                    ? 'bg-primary'
                    : step === currentStep
                      ? 'bg-primary/50'
                      : 'bg-muted'
                )}
              />
            ))}
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6">
          {/* Step 1: Basic Info */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Task Name *</Label>
                <Input
                  id="title"
                  placeholder="Enter task name..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="w-full text-base"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Enter task description..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={6}
                  className="resize-none"
                />
              </div>
            </div>
          )}

          {/* Step 2: Assignment & Details */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <Label>Assignees</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      <User className="mr-2 h-4 w-4" />
                      {selectedAssignees.length > 0
                        ? `${selectedAssignees.length} selected`
                        : 'Select assignees...'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 p-0" align="start">
                    <div className="max-h-60 overflow-y-auto p-2">
                      {availableProfiles.map((profile) => {
                        const isSelected = selectedAssignees.includes(profile.id)
                        return (
                          <div
                            key={profile.id}
                            onClick={() => toggleAssignee(profile.id)}
                            className={cn(
                              'flex items-center gap-3 p-2 rounded-md cursor-pointer hover:bg-accent',
                              isSelected && 'bg-accent'
                            )}
                          >
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={getDiceBearAvatar(profile.email || profile.id)} />
                              <AvatarFallback>{getInitials(profile)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{getName(profile)}</p>
                              <p className="text-xs text-muted-foreground truncate">
                                {profile.email}
                              </p>
                            </div>
                            {isSelected && <CheckCircle2 className="h-4 w-4 text-primary" />}
                          </div>
                        )
                      })}
                    </div>
                  </PopoverContent>
                </Popover>
                {selectedAssignees.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedAssignees.map((profileId) => {
                      const profile = availableProfiles.find((p) => p.id === profileId)
                      if (!profile) return null
                      return (
                        <Badge key={profileId} variant="secondary" className="gap-1">
                          {getName(profile)}
                          <X
                            className="h-3 w-3 cursor-pointer"
                            onClick={() => toggleAssignee(profileId)}
                          />
                        </Badge>
                      )
                    })}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={status} onValueChange={setStatus}>
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

                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select value={priority} onValueChange={setPriority}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      {priorityOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Department</Label>
                <Select value={departmentId} onValueChange={setDepartmentId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departmentOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Due Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start">
                        <Calendar className="mr-2 h-4 w-4" />
                        {dueDate ? format(dueDate, 'PPP') : 'Select date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <DatePicker date={dueDate} onDateChange={setDueDate} />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label>Estimated Duration (minutes)</Label>
                  <Input
                    type="number"
                    placeholder="e.g., 120"
                    value={estimatedDuration}
                    onChange={(e) => setEstimatedDuration(e.target.value)}
                    min="0"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Subtasks */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="space-y-4">
                {subtasks.map((subtask, index) => (
                  <div key={index} className="flex items-start gap-3 p-4 border rounded-lg">
                    <div className="flex-1 space-y-2">
                      <div className="font-medium">{subtask.title}</div>
                      {subtask.description && (
                        <div className="text-sm text-muted-foreground">{subtask.description}</div>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeSubtask(index)}
                      className="h-8 w-8"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              <div className="space-y-3 p-4 border rounded-lg bg-muted/50">
                <div className="space-y-2">
                  <Label>Subtask Title *</Label>
                  <Input
                    placeholder="Enter subtask title..."
                    value={newSubtaskTitle}
                    onChange={(e) => setNewSubtaskTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        addSubtask()
                      }
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description (optional)</Label>
                  <Textarea
                    placeholder="Enter subtask description..."
                    value={newSubtaskDescription}
                    onChange={(e) => setNewSubtaskDescription(e.target.value)}
                    rows={2}
                    className="resize-none"
                  />
                </div>
                <Button type="button" onClick={addSubtask} disabled={!newSubtaskTitle.trim()}>
                  <PlusIcon className="mr-2 h-4 w-4" />
                  Add Subtask
                </Button>
              </div>
            </div>
          )}

          {/* Step 4: Deliverables */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="space-y-4">
                {deliverables.map((deliverable, index) => (
                  <div key={index} className="flex items-start gap-3 p-4 border rounded-lg">
                    <div className="flex-1 space-y-2">
                      <div className="font-medium">{deliverable.name}</div>
                      {deliverable.description && (
                        <div className="text-sm text-muted-foreground">{deliverable.description}</div>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeDeliverable(index)}
                      className="h-8 w-8"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              <div className="space-y-3 p-4 border rounded-lg bg-muted/50">
                <div className="space-y-2">
                  <Label>Deliverable Name *</Label>
                  <Input
                    placeholder="Enter deliverable name..."
                    value={newDeliverableName}
                    onChange={(e) => setNewDeliverableName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        addDeliverable()
                      }
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description (optional)</Label>
                  <Textarea
                    placeholder="Enter deliverable description..."
                    value={newDeliverableDescription}
                    onChange={(e) => setNewDeliverableDescription(e.target.value)}
                    rows={2}
                    className="resize-none"
                  />
                </div>
                <Button type="button" onClick={addDeliverable} disabled={!newDeliverableName.trim()}>
                  <PlusIcon className="mr-2 h-4 w-4" />
                  Add Deliverable
                </Button>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="p-6 border-t">
          <div className="flex items-center justify-between w-full">
            <Button
              type="button"
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 1}
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Previous
            </Button>
            <div className="flex gap-2">
              {currentStep < totalSteps ? (
                <Button type="button" onClick={handleNext} disabled={!validateStep(currentStep)}>
                  Next
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button type="button" onClick={handleSubmit} disabled={isSubmitting || !validateStep(1)}>
                  <Save className="mr-2 h-4 w-4" />
                  {isSubmitting ? 'Creating...' : 'Create Task'}
                </Button>
              )}
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

