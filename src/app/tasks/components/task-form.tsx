"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { DatePicker } from "@/components/ui/date-picker"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { User, Calendar, Flag, Tag, Save, X, Clock, Link2, Plus as PlusIcon, Trash2 } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import type { TaskFormData, TaskFull } from "@/lib/types/tasks"
import { createClient } from "@/lib/supabase/client"

interface TaskFormProps {
  task?: TaskFull | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: TaskFormData) => Promise<void>
  statusOptions: { label: string; value: string }[]
  priorityOptions: { label: string; value: string }[]
  departmentOptions: { label: string; value: string }[]
  defaultStatus?: string
}

export function TaskForm({
  task,
  open,
  onOpenChange,
  onSubmit,
  statusOptions,
  priorityOptions,
  departmentOptions,
  defaultStatus,
}: TaskFormProps) {
  const [formData, setFormData] = useState<TaskFormData>({
    title: "",
    description: "",
    priority: undefined,
    status: undefined,
    department_id: undefined,
    vertical_key: "",
    due_date: undefined,
    estimated_duration: undefined,
    important_links: [],
  })
  const [links, setLinks] = useState<Array<{ url: string; label: string }>>([])
  const [newLinkUrl, setNewLinkUrl] = useState("")
  const [newLinkLabel, setNewLinkLabel] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [assigneeOpen, setAssigneeOpen] = useState(false)
  const [priorityOpen, setPriorityOpen] = useState(false)
  const [dateOpen, setDateOpen] = useState(false)
  const [durationOpen, setDurationOpen] = useState(false)
  const [tagOpen, setTagOpen] = useState(false)
  const [linksOpen, setLinksOpen] = useState(false)
  const [availableProfiles, setAvailableProfiles] = useState<Array<{ id: string; first_name: string | null; last_name: string | null; email: string }>>([])
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([])

  // Priority icon colors
  const priorityIcons: Record<string, { icon: typeof Flag; color: string }> = {
    low: { icon: Flag, color: "text-gray-500" },
    medium: { icon: Flag, color: "text-yellow-500" },
    high: { icon: Flag, color: "text-orange-500" },
    urgent: { icon: Flag, color: "text-red-500" },
  }

  // Generate DiceBear Micah avatar URL
  const getDiceBearAvatar = (seed: string) => {
    return `https://api.dicebear.com/7.x/micah/svg?seed=${encodeURIComponent(seed)}`
  }

  useEffect(() => {
    // Fetch available profiles for assignees
    const fetchProfiles = async () => {
      try {
        const supabase = createClient()
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, first_name, last_name, email")
          .is("deleted_at", null)
          .order("first_name")
        
        if (profiles) {
          setAvailableProfiles(profiles)
        }
      } catch (error) {
        console.error("Error fetching profiles:", error)
      }
    }
    
    if (open) {
      fetchProfiles()
    }
  }, [open])

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title,
        description: task.description || "",
        priority: task.priority || undefined,
        status: task.status || undefined,
        department_id: task.department_id || undefined,
        vertical_key: task.vertical_key || "",
        due_date: task.due_date ? new Date(task.due_date) : undefined,
        estimated_duration: (task as any).estimated_duration || undefined,
        important_links: (task as any).important_links || [],
      })
      setSelectedAssignees(task.assignees?.map(a => a.profile_id) || [])
      setLinks(Array.isArray((task as any).important_links) ? (task as any).important_links : [])
    } else {
      setFormData({
        title: "",
        description: "",
        priority: undefined,
        status: defaultStatus || undefined,
        department_id: undefined,
        vertical_key: "",
        due_date: undefined,
        estimated_duration: undefined,
        important_links: [],
      })
      setSelectedAssignees([])
      setLinks([])
    }
  }, [task, open, defaultStatus])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await onSubmit({
        ...formData,
        estimated_duration: formData.estimated_duration,
        important_links: links,
        assignees: selectedAssignees.map(profileId => ({
          profile_id: profileId,
          role: 'collaborator' as const
        }))
      })
      onOpenChange(false)
    } catch (error) {
      console.error("Error submitting task:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const addLink = () => {
    if (newLinkUrl.trim()) {
      const newLink = {
        url: newLinkUrl.trim(),
        label: newLinkLabel.trim() || newLinkUrl.trim()
      }
      setLinks([...links, newLink])
      setNewLinkUrl("")
      setNewLinkLabel("")
    }
  }

  const removeLink = (index: number) => {
    setLinks(links.filter((_, i) => i !== index))
  }

  const toggleAssignee = (profileId: string) => {
    setSelectedAssignees(prev => 
      prev.includes(profileId) 
        ? prev.filter(id => id !== profileId)
        : [...prev, profileId]
    )
  }

  const selectedPriorityOption = priorityOptions.find(opt => opt.value === formData.priority)
  const PriorityIcon = formData.priority ? priorityIcons[formData.priority]?.icon || Flag : Flag
  const priorityColor = formData.priority ? priorityIcons[formData.priority]?.color || "text-gray-500" : "text-gray-500"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col p-0">
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <DialogTitle className="text-lg font-semibold">
              {task ? "Edit Task" : "Create Task"}
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Button 
                type="submit" 
                size="sm" 
                disabled={isSubmitting}
                className="gap-2"
              >
                <Save className="h-4 w-4" />
                {isSubmitting ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>

          {/* Content - Scrollable */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-6">
              {/* Task Name Input - Full Width */}
              <div className="space-y-2">
                <Label>Task Name</Label>
                <Input
                  placeholder="Enter task name..."
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  className="w-full text-base"
                />
              </div>

              {/* Two Column Layout */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Assignee */}
                <div className="space-y-2">
                  <Label>Assignees</Label>
                  <Popover open={assigneeOpen} onOpenChange={setAssigneeOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <User className="mr-2 h-4 w-4" />
                        {selectedAssignees.length > 0 ? (
                          <div className="flex items-center gap-2 flex-1">
                            <div className="flex -space-x-2">
                              {selectedAssignees.slice(0, 3).map((profileId) => {
                                const profile = availableProfiles.find(p => p.id === profileId)
                                const name = profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.email : 'Unknown'
                                const seed = profile?.email || profileId
                                return (
                                  <Avatar key={profileId} className="h-6 w-6 border-2 border-background">
                                    <AvatarImage src={getDiceBearAvatar(seed)} alt={name} />
                                    <AvatarFallback className="text-xs">
                                      {profile?.first_name?.[0] || profile?.email?.[0]?.toUpperCase() || '?'}
                                    </AvatarFallback>
                                  </Avatar>
                                )
                              })}
                            </div>
                            {selectedAssignees.length > 3 && (
                              <span className="text-sm text-muted-foreground">+{selectedAssignees.length - 3}</span>
                            )}
                          </div>
                        ) : (
                          <span>Select assignees</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                <PopoverContent className="w-64 p-2" align="start">
                  <div className="space-y-1 max-h-[300px] overflow-y-auto">
                    {availableProfiles.map((profile) => {
                      const name = `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.email
                      const seed = profile.email || profile.id
                      const isSelected = selectedAssignees.includes(profile.id)
                      return (
                        <Button
                          key={profile.id}
                          type="button"
                          variant="ghost"
                          className="w-full justify-start"
                          onClick={() => toggleAssignee(profile.id)}
                        >
                          <Avatar className="h-6 w-6 mr-2">
                            <AvatarImage src={getDiceBearAvatar(seed)} alt={name} />
                            <AvatarFallback className="text-xs">
                              {profile.first_name?.[0] || profile.email?.[0]?.toUpperCase() || '?'}
                            </AvatarFallback>
                          </Avatar>
                          <span className="flex-1 text-left">{name}</span>
                          {isSelected && <X className="h-4 w-4" />}
                        </Button>
                      )
                    })}
                  </div>
                </PopoverContent>
              </Popover>
                </div>

                {/* Due Date */}
                <div className="space-y-2">
                  <Label>Due Date</Label>
                  <Popover open={dateOpen} onOpenChange={setDateOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        {formData.due_date ? (
                          format(formData.due_date, "MMM dd, yyyy")
                        ) : (
                          <span>Select date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <DatePicker
                    value={formData.due_date}
                    onChange={(date) => {
                      setFormData({ ...formData, due_date: date })
                      setDateOpen(false)
                    }}
                  />
                </PopoverContent>
              </Popover>
                </div>

                {/* Priority */}
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Popover open={priorityOpen} onOpenChange={setPriorityOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <PriorityIcon className={cn("mr-2 h-4 w-4", priorityColor)} />
                        {selectedPriorityOption ? selectedPriorityOption.label : <span>Select priority</span>}
                      </Button>
                    </PopoverTrigger>
                <PopoverContent className="w-48 p-2" align="start">
                  <div className="space-y-1">
                    {priorityOptions.map((option) => {
                      const Icon = priorityIcons[option.value]?.icon || Flag
                      const color = priorityIcons[option.value]?.color || "text-gray-500"
                      const isSelected = formData.priority === option.value
                      return (
                        <Button
                          key={option.value}
                          type="button"
                          variant="ghost"
                          className={cn("w-full justify-start", isSelected && "bg-accent")}
                          onClick={() => {
                            setFormData({ ...formData, priority: option.value })
                            setPriorityOpen(false)
                          }}
                        >
                          <Icon className={cn("mr-2 h-4 w-4", color)} />
                          <span>{option.label}</span>
                        </Button>
                      )
                    })}
                  </div>
                </PopoverContent>
              </Popover>
                </div>

                {/* Department */}
                <div className="space-y-2">
                  <Label>Department</Label>
                  <Popover open={tagOpen} onOpenChange={setTagOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <Tag className="mr-2 h-4 w-4" />
                        {formData.department_id ? (
                          <Badge variant="secondary" className="bg-blue-100 text-blue-800 hover:bg-blue-200">
                            {departmentOptions.find(d => d.value === formData.department_id)?.label || "Select department"}
                          </Badge>
                        ) : (
                          <span>Select department</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                <PopoverContent className="w-48 p-2" align="start">
                  <div className="space-y-1">
                    <Button
                      type="button"
                      variant="ghost"
                      className={cn("w-full justify-start", !formData.department_id && "bg-accent")}
                      onClick={() => {
                        setFormData({ ...formData, department_id: undefined })
                        setTagOpen(false)
                      }}
                    >
                      None
                    </Button>
                    {departmentOptions.map((option) => {
                      const isSelected = formData.department_id === option.value
                      return (
                        <Button
                          key={option.value}
                          type="button"
                          variant="ghost"
                          className={cn("w-full justify-start", isSelected && "bg-accent")}
                          onClick={() => {
                            setFormData({ ...formData, department_id: option.value })
                            setTagOpen(false)
                          }}
                        >
                          {option.label}
                        </Button>
                      )
                    })}
                  </div>
                </PopoverContent>
              </Popover>
                </div>

                {/* Estimated Duration */}
                <div className="space-y-2">
                  <Label>Estimated Duration</Label>
                  <Popover open={durationOpen} onOpenChange={setDurationOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <Clock className="mr-2 h-4 w-4" />
                        {formData.estimated_duration ? (
                          `${formData.estimated_duration < 60 ? `${formData.estimated_duration}m` : `${Math.floor(formData.estimated_duration / 60)}h ${formData.estimated_duration % 60}m`}`
                        ) : (
                          <span>Set duration</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                <PopoverContent className="w-64 p-4" align="start">
                  <div className="space-y-2">
                    <Label>Duration (minutes)</Label>
                    <Input
                      type="number"
                      placeholder="e.g., 120"
                      value={formData.estimated_duration || ""}
                      onChange={(e) => {
                        const value = e.target.value ? parseInt(e.target.value) : undefined
                        setFormData({ ...formData, estimated_duration: value })
                      }}
                      min="1"
                    />
                    <div className="text-xs text-muted-foreground">
                      Common: 15m, 30m, 1h (60m), 2h (120m), 4h (240m)
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
                </div>

                {/* Important Links */}
                <div className="space-y-2">
                  <Label>Important Links</Label>
                  <Popover open={linksOpen} onOpenChange={setLinksOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <Link2 className="mr-2 h-4 w-4" />
                        {links.length > 0 ? (
                          <span>{links.length} link{links.length > 1 ? 's' : ''}</span>
                        ) : (
                          <span>Add links</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                <PopoverContent className="w-80 p-4" align="start">
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label>URL</Label>
                      <Input
                        placeholder="https://..."
                        value={newLinkUrl}
                        onChange={(e) => setNewLinkUrl(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault()
                            addLink()
                          }
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Label (optional)</Label>
                      <Input
                        placeholder="Link name"
                        value={newLinkLabel}
                        onChange={(e) => setNewLinkLabel(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault()
                            addLink()
                          }
                        }}
                      />
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      onClick={addLink}
                      disabled={!newLinkUrl.trim()}
                      className="w-full"
                    >
                      <PlusIcon className="h-4 w-4 mr-2" />
                      Add Link
                    </Button>
                    {links.length > 0 && (
                      <div className="space-y-2 border-t pt-2">
                        <Label className="text-xs">Links</Label>
                        {links.map((link, idx) => (
                          <div key={idx} className="flex items-center justify-between gap-2 p-2 bg-muted rounded">
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium truncate">{link.label}</div>
                              <div className="text-xs text-muted-foreground truncate">{link.url}</div>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() => removeLink(idx)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
                </div>
              </div>

              {/* Description - Full Width */}
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  placeholder="Enter task description..."
                  value={formData.description || ""}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="min-h-[100px]"
                />
              </div>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

