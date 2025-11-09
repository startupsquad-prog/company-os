"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  CheckCircle2,
  Calendar,
  Clock,
  Flag,
  User,
  Tag,
  Link2,
  Play,
  MoreVertical,
  Star,
  Share2,
  Sparkles,
  Send,
  Plus,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  Trash2,
  Download,
  Upload,
  FileText,
} from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import type { TaskFull } from "@/lib/types/tasks"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

interface TaskDetailsModalProps {
  task: TaskFull | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onEdit?: (task: TaskFull) => void
  onDelete?: (task: TaskFull) => void
  allTasks?: TaskFull[] // For navigation
  onTaskChange?: (task: TaskFull) => void // Callback when navigating to different task
}

interface TaskComment {
  id: string
  body: string
  created_at: string
  author: {
    id: string
    first_name: string | null
    last_name: string | null
    email: string
    avatar_url: string | null
  }
}

interface ActivityEvent {
  id: string
  action: string
  created_at: string
  created_by_profile: {
    id: string
    first_name: string | null
    last_name: string | null
    email: string
    avatar_url: string | null
  } | null
  metadata: any
}

interface Subtask {
  id: string
  task_id: string
  title: string
  is_completed: boolean
  position: number
  created_at: string
}

interface Attachment {
  id: string
  task_id: string
  file_name: string
  file_path: string
  file_size: number
  mime_type: string | null
  created_at: string
}

interface Deliverable {
  id: string
  task_id: string
  title: string
  is_completed: boolean
  position: number
  created_at: string
}

export function TaskDetailsModal({
  task,
  open,
  onOpenChange,
  onEdit,
  onDelete,
  allTasks = [],
  onTaskChange,
}: TaskDetailsModalProps) {
  const [comments, setComments] = useState<TaskComment[]>([])
  const [activities, setActivities] = useState<ActivityEvent[]>([])
  const [commentText, setCommentText] = useState("")
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)
  const [loading, setLoading] = useState(false)
  const [isStarred, setIsStarred] = useState((task as any)?.is_starred || false)
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [editedTitle, setEditedTitle] = useState(task?.title || "")
  const [isSavingTitle, setIsSavingTitle] = useState(false)
  
  // New state for subtasks, attachments, deliverables
  const [subtasks, setSubtasks] = useState<Subtask[]>([])
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [deliverables, setDeliverables] = useState<Deliverable[]>([])
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("")
  const [newDeliverableTitle, setNewDeliverableTitle] = useState("")
  const [isEditingDescription, setIsEditingDescription] = useState(false)
  const [editedDescription, setEditedDescription] = useState(task?.description || "")
  const [uploadingFile, setUploadingFile] = useState(false)

  const fetchComments = useCallback(async () => {
    if (!task) return

    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("task_comments")
        .select(`
          *,
          author:profiles(
            id,
            first_name,
            last_name,
            email,
            avatar_url
          )
        `)
        .eq("task_id", task.id)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Error fetching comments:", error)
        setComments([])
        return
      }

      setComments(
        (data || []).map((c: any) => ({
          id: c.id,
          body: c.body,
          created_at: c.created_at,
          author: c.author || {
            id: "",
            first_name: null,
            last_name: null,
            email: "Unknown",
            avatar_url: null,
          },
        }))
      )
    } catch (error) {
      console.error("Error fetching comments:", error)
      setComments([])
    }
  }, [task])

  const fetchActivities = useCallback(async () => {
    if (!task) return

    try {
      const supabase = createClient()
      
      // Try direct query to activity_events (may be in core schema or accessible via view)
      // If that fails, gracefully handle and show empty activities
      let events: any[] = []
      let eventsError: any = null
      
      try {
        const result = await supabase
          .from("activity_events")
          .select("*")
          .eq("entity_type", "task")
          .eq("entity_id", task.id)
          .order("created_at", { ascending: false })
          .limit(50)
        events = result.data || []
        eventsError = result.error
      } catch (err) {
        // If table doesn't exist or isn't accessible, that's okay
        eventsError = err
      }

      // If table doesn't exist or isn't accessible, gracefully handle it
      if (eventsError) {
        // Check if it's a "relation does not exist" error
        if (eventsError.code === '42P01' || eventsError.message?.includes('does not exist') || eventsError.message?.includes('permission denied')) {
          console.warn("Activity events table not accessible. This feature may not be configured yet.")
          setActivities([])
          return
        }
        // Don't throw, just log and set empty
        console.warn("Error fetching activities:", eventsError)
        setActivities([])
        return
      }

      // If no events, set empty array
      if (!events || events.length === 0) {
        setActivities([])
        return
      }

      // Get profiles for each event
      // activity_events.created_by references auth.users(id), not profiles.id
      const userIds = [...new Set((events || []).map((e: any) => e.created_by).filter(Boolean))]
      
      let profilesMap: Record<string, any> = {}
      if (userIds.length > 0) {
        const { data: profiles, error: profilesError } = await supabase
          .from("profiles")
          .select("id, first_name, last_name, email, avatar_url, user_id")
          .in("user_id", userIds)
        
        if (profilesError) {
          console.warn("Error fetching profiles for activities:", profilesError)
        } else if (profiles) {
          // Map by user_id (from auth.users) to profile
          profilesMap = profiles.reduce((acc: any, p: any) => {
            acc[p.user_id] = p
            return acc
          }, {})
        }
      }

      setActivities(
        (events || []).map((a: any) => ({
          id: a.id,
          action: a.action,
          created_at: a.created_at,
          created_by_profile: a.created_by ? profilesMap[a.created_by] || null : null,
          metadata: a.metadata || {},
        }))
      )
    } catch (error) {
      // Better error logging
      const errorMessage = error instanceof Error 
        ? error.message 
        : typeof error === 'object' && error !== null
        ? JSON.stringify(error, Object.getOwnPropertyNames(error))
        : String(error)
      
      console.error("Error fetching activities:", {
        message: errorMessage,
        error: error,
        taskId: task?.id
      })
      
      // Set empty activities on error to prevent UI issues
      setActivities([])
    }
  }, [task])

  // Fetch subtasks
  const fetchSubtasks = useCallback(async () => {
    if (!task) return
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("task_subtasks")
        .select("*")
        .eq("task_id", task.id)
        .order("position", { ascending: true })
      
      if (error) {
        // Better error extraction
        const errorDetails = {
          message: error.message || 'Unknown error',
          code: (error as any)?.code,
          details: (error as any)?.details,
          hint: (error as any)?.hint,
          status: (error as any)?.status,
          statusText: (error as any)?.statusText,
        }
        
        console.error("Error fetching subtasks:", {
          ...errorDetails,
          error: error,
          errorString: JSON.stringify(error, null, 2),
          taskId: task.id
        })
        setSubtasks([])
        return
      }
      
      setSubtasks(data || [])
    } catch (error) {
      // Catch block for unexpected errors
      const errorDetails = {
        message: error instanceof Error ? error.message : 'Unknown error',
        errorType: error?.constructor?.name,
        errorString: JSON.stringify(error, Object.getOwnPropertyNames(error || {}), 2),
      }
      
      console.error("Error fetching subtasks (catch):", {
        ...errorDetails,
        error: error,
        taskId: task?.id
      })
      setSubtasks([])
    }
  }, [task])

  // Fetch attachments
  const fetchAttachments = useCallback(async () => {
    if (!task) return
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("task_attachments")
        .select("*")
        .eq("task_id", task.id)
        .order("created_at", { ascending: false })
      
      if (error) {
        // Better error extraction
        const errorDetails = {
          message: error.message || 'Unknown error',
          code: (error as any)?.code,
          details: (error as any)?.details,
          hint: (error as any)?.hint,
          status: (error as any)?.status,
          statusText: (error as any)?.statusText,
        }
        
        console.error("Error fetching attachments:", {
          ...errorDetails,
          error: error,
          errorString: JSON.stringify(error, null, 2),
          taskId: task.id
        })
        setAttachments([])
        return
      }
      
      setAttachments(data || [])
    } catch (error) {
      // Catch block for unexpected errors
      const errorDetails = {
        message: error instanceof Error ? error.message : 'Unknown error',
        errorType: error?.constructor?.name,
        errorString: JSON.stringify(error, Object.getOwnPropertyNames(error || {}), 2),
      }
      
      console.error("Error fetching attachments (catch):", {
        ...errorDetails,
        error: error,
        taskId: task?.id
      })
      setAttachments([])
    }
  }, [task])

  // Fetch deliverables
  const fetchDeliverables = useCallback(async () => {
    if (!task) return
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("task_deliverables")
        .select("*")
        .eq("task_id", task.id)
        .order("position", { ascending: true })
      
      if (error) {
        // Better error extraction
        const errorDetails = {
          message: error.message || 'Unknown error',
          code: (error as any)?.code,
          details: (error as any)?.details,
          hint: (error as any)?.hint,
          status: (error as any)?.status,
          statusText: (error as any)?.statusText,
        }
        
        console.error("Error fetching deliverables:", {
          ...errorDetails,
          error: error,
          errorString: JSON.stringify(error, null, 2),
          taskId: task.id
        })
        setDeliverables([])
        return
      }
      
      setDeliverables(data || [])
    } catch (error) {
      // Catch block for unexpected errors
      const errorDetails = {
        message: error instanceof Error ? error.message : 'Unknown error',
        errorType: error?.constructor?.name,
        errorString: JSON.stringify(error, Object.getOwnPropertyNames(error || {}), 2),
      }
      
      console.error("Error fetching deliverables (catch):", {
        ...errorDetails,
        error: error,
        taskId: task?.id
      })
      setDeliverables([])
    }
  }, [task])

  // Navigation functions
  const getCurrentTaskIndex = () => {
    if (!task || allTasks.length === 0) return -1
    return allTasks.findIndex(t => t.id === task.id)
  }

  const handlePreviousTask = () => {
    const currentIndex = getCurrentTaskIndex()
    if (currentIndex > 0 && onTaskChange) {
      onTaskChange(allTasks[currentIndex - 1])
    }
  }

  const handleNextTask = () => {
    const currentIndex = getCurrentTaskIndex()
    if (currentIndex >= 0 && currentIndex < allTasks.length - 1 && onTaskChange) {
      onTaskChange(allTasks[currentIndex + 1])
    }
  }

  const canNavigatePrevious = () => {
    const currentIndex = getCurrentTaskIndex()
    return currentIndex > 0
  }

  const canNavigateNext = () => {
    const currentIndex = getCurrentTaskIndex()
    return currentIndex >= 0 && currentIndex < allTasks.length - 1
  }

  // Share function
  const handleShare = async () => {
    if (!task) return
    const taskUrl = `${window.location.origin}/tasks?task=${task.id}`
    try {
      await navigator.clipboard.writeText(taskUrl)
      toast.success("Task link copied to clipboard")
    } catch (error) {
      console.error("Error copying to clipboard:", error)
      toast.error("Failed to copy link")
    }
  }

  // Fetch comments and activities when modal opens
  useEffect(() => {
    if (open && task) {
      fetchComments()
      fetchActivities()
      fetchSubtasks()
      fetchAttachments()
      fetchDeliverables()
      setIsStarred((task as any)?.is_starred || false)
      setEditedTitle(task.title || "")
      setEditedDescription(task.description || "")
    }
  }, [open, task, fetchComments, fetchActivities, fetchSubtasks, fetchAttachments, fetchDeliverables])

  const handleSubmitComment = async () => {
    if (!task || !commentText.trim()) return

    setIsSubmittingComment(true)
    try {
      const supabase = createClient()
      
      // Get current user's profile
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")
      
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .single()
      
      if (!profile) throw new Error("Profile not found")
      
      const { error } = await supabase
        .from("task_comments")
        .insert({
          task_id: task.id,
          author_id: (profile as any).id,
          body: commentText.trim(),
        } as any)

      if (error) throw error

      setCommentText("")
      await fetchComments()
      toast.success("Comment added")
    } catch (error) {
      console.error("Error adding comment:", error)
      toast.error("Failed to add comment")
    } finally {
      setIsSubmittingComment(false)
    }
  }

  const handleToggleStar = async () => {
    if (!task) return
    
    const newStarredState = !isStarred
    setIsStarred(newStarredState)
    
    try {
      const supabase = createClient()
      
      // Get current user's profile for updated_by
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")
      
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .single()
      
      if (!profile) throw new Error("Profile not found")
      
      const { error } = await supabase
        .from("tasks")
        .update({ 
          is_starred: newStarredState,
          updated_by: profile.id 
        })
        .eq("id", task.id)
      
      if (error) throw error
      
      toast.success(newStarredState ? "Task starred" : "Task unstarred")
      // Update task in parent if callback exists
      if (onEdit) {
        onEdit({ ...task, is_starred: newStarredState } as TaskFull)
      }
    } catch (error) {
      console.error("Error toggling star:", error)
      setIsStarred(!newStarredState) // Revert on error
      toast.error("Failed to update star status")
    }
  }

  const handleSaveTitle = async () => {
    if (!task || !editedTitle.trim() || editedTitle === task.title) {
      setIsEditingTitle(false)
      return
    }
    
    setIsSavingTitle(true)
    try {
      const supabase = createClient()
      
      // Get current user's profile for updated_by
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")
      
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .single()
      
      if (!profile) throw new Error("Profile not found")
      
      const { error } = await supabase
        .from("tasks")
        .update({ 
          title: editedTitle.trim(),
          updated_by: profile.id 
        })
        .eq("id", task.id)
      
      if (error) throw error
      
      toast.success("Title updated")
      setIsEditingTitle(false)
      if (onEdit) {
        onEdit({ ...task, title: editedTitle.trim() } as TaskFull)
      }
    } catch (error) {
      console.error("Error updating title:", error)
      toast.error("Failed to update title")
      setEditedTitle(task.title || "")
    } finally {
      setIsSavingTitle(false)
    }
  }

  const handleSaveDescription = async () => {
    if (!task || editedDescription === task.description) {
      setIsEditingDescription(false)
      return
    }
    
    try {
      const supabase = createClient()
      
      // Get current user's profile for updated_by
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")
      
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .single()
      
      if (!profile) throw new Error("Profile not found")
      
      const { error } = await supabase
        .from("tasks")
        .update({ 
          description: editedDescription,
          updated_by: profile.id 
        })
        .eq("id", task.id)
      
      if (error) throw error
      
      toast.success("Description updated")
      setIsEditingDescription(false)
      if (onEdit) {
        onEdit({ ...task, description: editedDescription } as TaskFull)
      }
    } catch (error) {
      console.error("Error updating description:", error)
      toast.error("Failed to update description")
      setEditedDescription(task.description || "")
    }
  }

  // Subtask handlers
  const handleAddSubtask = async () => {
    if (!task || !newSubtaskTitle.trim()) return
    
    try {
      const supabase = createClient()
      
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")
      
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .single()
      
      if (!profile) throw new Error("Profile not found")
      
      const maxPosition = subtasks.length > 0 
        ? Math.max(...subtasks.map(s => s.position)) 
        : -1
      
      const { error } = await supabase
        .from("task_subtasks")
        .insert({
          task_id: task.id,
          title: newSubtaskTitle.trim(),
          is_completed: false,
          position: maxPosition + 1,
          created_by: profile.id
        })
      
      if (error) throw error
      
      setNewSubtaskTitle("")
      await fetchSubtasks()
      toast.success("Subtask added")
    } catch (error) {
      console.error("Error adding subtask:", error)
      toast.error("Failed to add subtask")
    }
  }

  const handleToggleSubtask = async (subtaskId: string, currentState: boolean) => {
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from("task_subtasks")
        .update({ is_completed: !currentState })
        .eq("id", subtaskId)
      
      if (error) throw error
      await fetchSubtasks()
    } catch (error) {
      console.error("Error toggling subtask:", error)
      toast.error("Failed to update subtask")
    }
  }

  const handleDeleteSubtask = async (subtaskId: string) => {
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from("task_subtasks")
        .delete()
        .eq("id", subtaskId)
      
      if (error) throw error
      await fetchSubtasks()
      toast.success("Subtask deleted")
    } catch (error) {
      console.error("Error deleting subtask:", error)
      toast.error("Failed to delete subtask")
    }
  }

  // Deliverable handlers (similar to subtasks)
  const handleAddDeliverable = async () => {
    if (!task || !newDeliverableTitle.trim()) return
    
    try {
      const supabase = createClient()
      
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")
      
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .single()
      
      if (!profile) throw new Error("Profile not found")
      
      const maxPosition = deliverables.length > 0 
        ? Math.max(...deliverables.map(d => d.position)) 
        : -1
      
      const { error } = await supabase
        .from("task_deliverables")
        .insert({
          task_id: task.id,
          title: newDeliverableTitle.trim(),
          is_completed: false,
          position: maxPosition + 1,
          created_by: profile.id
        })
      
      if (error) throw error
      
      setNewDeliverableTitle("")
      await fetchDeliverables()
      toast.success("Deliverable added")
    } catch (error) {
      console.error("Error adding deliverable:", error)
      toast.error("Failed to add deliverable")
    }
  }

  const handleToggleDeliverable = async (deliverableId: string, currentState: boolean) => {
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from("task_deliverables")
        .update({ is_completed: !currentState })
        .eq("id", deliverableId)
      
      if (error) throw error
      await fetchDeliverables()
    } catch (error) {
      console.error("Error toggling deliverable:", error)
      toast.error("Failed to update deliverable")
    }
  }

  const handleDeleteDeliverable = async (deliverableId: string) => {
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from("task_deliverables")
        .delete()
        .eq("id", deliverableId)
      
      if (error) throw error
      await fetchDeliverables()
      toast.success("Deliverable deleted")
    } catch (error) {
      console.error("Error deleting deliverable:", error)
      toast.error("Failed to delete deliverable")
    }
  }

  // Attachment handlers
  const handleUploadFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!task || !event.target.files || event.target.files.length === 0) return
    
    const file = event.target.files[0]
    setUploadingFile(true)
    
    try {
      const supabase = createClient()
      
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")
      
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .single()
      
      if (!profile) throw new Error("Profile not found")
      
      // Upload to Supabase Storage
      // Path format: {task_id}/{timestamp}.{ext}
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}.${fileExt}`
      const filePath = `${task.id}/${fileName}`
      
      const { error: uploadError } = await supabase.storage
        .from('task-attachments')
        .upload(filePath, file)
      
      if (uploadError) {
        if (uploadError.message?.includes('Bucket not found') || uploadError.message?.includes('not found')) {
          throw new Error('Storage bucket "task-attachments" not found. Please create it in Supabase Storage settings.')
        }
        throw uploadError
      }
      
      // Save attachment record
      // Store the full path including bucket for reference
      const fullPath = `task-attachments/${filePath}`
      
      const { error: insertError } = await supabase
        .from("task_attachments")
        .insert({
          task_id: task.id,
          file_name: file.name,
          file_path: fullPath,
          file_size: file.size,
          mime_type: file.type,
          uploaded_by: profile.id
        })
      
      if (insertError) throw insertError
      
      await fetchAttachments()
      toast.success("File uploaded successfully")
    } catch (error) {
      console.error("Error uploading file:", error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload file'
      if (errorMessage.includes('Bucket not found')) {
        toast.error("Storage bucket not configured. Please contact your administrator.")
      } else {
        toast.error(errorMessage)
      }
    } finally {
      setUploadingFile(false)
      // Reset input
      event.target.value = ''
    }
  }

  const handleDownloadAttachment = async (attachment: Attachment) => {
    try {
      const supabase = createClient()
      // Extract the path without the bucket prefix
      // file_path format: task-attachments/{task_id}/{filename}
      const pathWithoutBucket = attachment.file_path.replace(/^task-attachments\//, '')
      
      const { data, error } = await supabase.storage
        .from('task-attachments')
        .download(pathWithoutBucket)
      
      if (error) {
        if (error.message?.includes('Bucket not found') || error.message?.includes('not found')) {
          throw new Error('Storage bucket "task-attachments" not found.')
        }
        throw error
      }
      
      // Create download link
      const url = URL.createObjectURL(data)
      const a = document.createElement('a')
      a.href = url
      a.download = attachment.file_name
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      toast.success("File downloaded")
    } catch (error) {
      console.error("Error downloading file:", error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to download file'
      if (errorMessage.includes('Bucket not found')) {
        toast.error("Storage bucket not configured. Please contact your administrator.")
      } else {
        toast.error(errorMessage)
      }
    }
  }

  const handleDeleteAttachment = async (attachmentId: string, filePath: string) => {
    try {
      const supabase = createClient()
      
      // Extract the path without the bucket prefix
      // file_path format: task-attachments/{task_id}/{filename}
      const pathWithoutBucket = filePath.replace(/^task-attachments\//, '')
      
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('task-attachments')
        .remove([pathWithoutBucket])
      
      if (storageError) console.warn("Error deleting from storage:", storageError)
      
      // Delete record
      const { error } = await supabase
        .from("task_attachments")
        .delete()
        .eq("id", attachmentId)
      
      if (error) throw error
      
      await fetchAttachments()
      toast.success("Attachment deleted")
    } catch (error) {
      console.error("Error deleting attachment:", error)
      toast.error("Failed to delete attachment")
    }
  }

  if (!task) return null

  const statusConfig: Record<
    string,
    { label: string; variant: "default" | "secondary" | "outline" | "destructive" }
  > = {
    pending: { label: "To Do", variant: "outline" },
    in_progress: { label: "In Progress", variant: "default" },
    completed: { label: "Completed", variant: "secondary" },
    cancelled: { label: "Cancelled", variant: "destructive" },
  }

  const priorityConfig: Record<string, { label: string; color: string }> = {
    low: { label: "Low", color: "text-gray-500" },
    medium: { label: "Medium", color: "text-yellow-500" },
    high: { label: "High", color: "text-orange-500" },
    urgent: { label: "Urgent", color: "text-red-500" },
  }

  const status = task.status ? statusConfig[task.status] : null
  const priority = task.priority ? priorityConfig[task.priority] : null

  const getDiceBearAvatar = (seed: string) => {
    return `https://api.dicebear.com/7.x/micah/svg?seed=${encodeURIComponent(seed)}`
  }

  const getName = (profile: any) => {
    if (profile?.first_name && profile?.last_name) {
      return `${profile.first_name} ${profile.last_name}`
    }
    return profile?.email || "Unknown"
  }

  const getInitials = (profile: any) => {
    if (profile?.first_name && profile?.last_name) {
      return `${profile.first_name[0]}${profile.last_name[0]}`
    }
    return profile?.email?.[0]?.toUpperCase() || "?"
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] w-full h-[95vh] max-h-[95vh] p-0 gap-0 overflow-hidden flex flex-col">
        <DialogTitle className="sr-only">Task Details</DialogTitle>
        <DialogDescription className="sr-only">Task details and information</DialogDescription>

        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-3 border-b">
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">
              Created {format(new Date(task.created_at), "MMM d")}
            </span>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="h-8">
                <Sparkles className="h-4 w-4 mr-2" />
                Ask AI
              </Button>
              <Button variant="ghost" size="sm" className="h-8" onClick={handleShare}>
                <Share2 className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" className="h-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8"
                onClick={handleToggleStar}
              >
                <Star className={cn("h-4 w-4", isStarred && "fill-yellow-400 text-yellow-400")} />
              </Button>
            </div>
          </div>
          {/* Navigation arrows */}
          {allTasks.length > 1 && (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={handlePreviousTask}
                disabled={!canNavigatePrevious()}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-xs text-muted-foreground">
                {getCurrentTaskIndex() + 1} / {allTasks.length}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={handleNextTask}
                disabled={!canNavigateNext()}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Main Content - 2:1 Split */}
        <div className="flex flex-1 overflow-hidden min-h-0">
          {/* Left/Center Panel - 2/3 width */}
          <div className="flex-[2] flex flex-col overflow-y-auto p-6 space-y-6">
            {/* Title Section */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Task</span>
                <span className="text-xs text-muted-foreground font-mono">
                  {task.id.slice(0, 10)}
                </span>
              </div>
              {isEditingTitle ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    onBlur={handleSaveTitle}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleSaveTitle()
                      } else if (e.key === "Escape") {
                        setEditedTitle(task.title || "")
                        setIsEditingTitle(false)
                      }
                    }}
                    className="text-2xl font-bold bg-transparent border-b-2 border-primary focus:outline-none flex-1"
                    autoFocus
                    disabled={isSavingTitle}
                  />
                </div>
              ) : (
                <h1 
                  className="text-2xl font-bold cursor-pointer hover:bg-muted/50 px-2 py-1 rounded transition-colors"
                  onClick={() => setIsEditingTitle(true)}
                >
                  {task.title}
                </h1>
              )}
            </div>

            {/* Quick Details - Icons with Tooltips */}
            <div className="flex flex-wrap items-center gap-4">
              <TooltipProvider>
                {/* Status */}
                {status && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                        <Badge variant={status.variant} className="cursor-pointer">
                          {status.label}
                        </Badge>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>Status</TooltipContent>
                  </Tooltip>
                )}

                {/* Start Date */}
                {task.due_date && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>{format(new Date(task.due_date), "MMM d, yyyy")}</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>Due Date</TooltipContent>
                  </Tooltip>
                )}

                {/* Time Estimate */}
                {(task as any)?.estimated_duration ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>
                          {(task as any)?.estimated_duration < 60 
                            ? `${(task as any)?.estimated_duration}m`
                            : `${Math.floor((task as any)?.estimated_duration / 60)}h ${(task as any)?.estimated_duration % 60}m`
                          }
                        </span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>Estimated Duration</TooltipContent>
                  </Tooltip>
                ) : (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>Empty</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>Time Estimate</TooltipContent>
                  </Tooltip>
                )}

                {/* Tags */}
                {task.department && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-2">
                        <Tag className="h-4 w-4 text-muted-foreground" />
                        <Badge variant="secondary" className="bg-blue-100 text-blue-800 hover:bg-blue-200">
                          {task.department.name}
                        </Badge>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>Department</TooltipContent>
                  </Tooltip>
                )}

                {/* Assignees */}
                {task.assignees && task.assignees.length > 0 ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <div className="flex -space-x-2">
                          {task.assignees.slice(0, 3).map((assignee) => {
                            const profile = assignee.profile
                            const name = getName(profile)
                            const seed = profile?.email || assignee.profile_id
                            return (
                              <Tooltip key={assignee.id}>
                                <TooltipTrigger asChild>
                                  <Avatar className="h-6 w-6 border-2 border-background cursor-pointer">
                                    <AvatarImage
                                      src={getDiceBearAvatar(seed)}
                                      alt={name}
                                    />
                                    <AvatarFallback className="text-xs">
                                      {getInitials(profile)}
                                    </AvatarFallback>
                                  </Avatar>
                                </TooltipTrigger>
                                <TooltipContent>{name}</TooltipContent>
                              </Tooltip>
                            )
                          })}
                        </div>
                        {task.assignees.length > 3 && (
                          <span className="text-xs text-muted-foreground">
                            +{task.assignees.length - 3}
                          </span>
                        )}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      {task.assignees.map((a) => getName(a.profile)).join(", ")}
                    </TooltipContent>
                  </Tooltip>
                ) : (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <User className="h-4 w-4" />
                        <span>Empty</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>Assignees</TooltipContent>
                  </Tooltip>
                )}

                {/* Priority */}
                {priority ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-2">
                        <Flag className={cn("h-4 w-4", priority.color)} />
                        <span className="text-sm">{priority.label}</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>Priority</TooltipContent>
                  </Tooltip>
                ) : (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Flag className="h-4 w-4" />
                        <span>Empty</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>Priority</TooltipContent>
                  </Tooltip>
                )}


                {/* Important Links */}
                {(task as any)?.important_links && Array.isArray((task as any)?.important_links) && (task as any)?.important_links.length > 0 ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-2">
                        <Link2 className="h-4 w-4 text-muted-foreground" />
                        <div className="flex flex-wrap gap-1">
                          {(task as any)?.important_links.slice(0, 3).map((link: any, idx: number) => (
                            <a
                              key={idx}
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-primary hover:underline"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {link.label || link.url}
                            </a>
                          ))}
                          {(task as any)?.important_links.length > 3 && (
                            <span className="text-xs text-muted-foreground">
                              +{(task as any)?.important_links.length - 3}
                            </span>
                          )}
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="space-y-1">
                        {(task as any)?.important_links.map((link: any, idx: number) => (
                          <a
                            key={idx}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block text-xs text-primary hover:underline"
                          >
                            {link.label || link.url}
                          </a>
                        ))}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                ) : (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Link2 className="h-4 w-4" />
                        <span>Empty</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>Important Links</TooltipContent>
                  </Tooltip>
                )}
              </TooltipProvider>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold">Description</h3>
              {isEditingDescription ? (
                <div className="space-y-2">
                  <Textarea
                    value={editedDescription}
                    onChange={(e) => setEditedDescription(e.target.value)}
                    className="min-h-[100px] resize-none"
                    placeholder="Add a description..."
                    onKeyDown={(e) => {
                      if (e.key === "Escape") {
                        setEditedDescription(task.description || "")
                        setIsEditingDescription(false)
                      }
                    }}
                    autoFocus
                  />
                  <div className="flex items-center gap-2">
                    <Button size="sm" onClick={handleSaveDescription}>
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setEditedDescription(task.description || "")
                        setIsEditingDescription(false)
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div 
                  className="min-h-[100px] rounded-md border p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => setIsEditingDescription(true)}
                >
                  {task.description ? (
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {task.description}
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">
                      Click to add description...
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Tabbed Container */}
            <Tabs defaultValue="subtasks" className="w-full">
              <TabsList>
                <TabsTrigger value="subtasks">Subtasks</TabsTrigger>
                <TabsTrigger value="attachments">Attachments</TabsTrigger>
                <TabsTrigger value="deliverables">Deliverables</TabsTrigger>
              </TabsList>
              <TabsContent value="subtasks" className="mt-4">
                <div className="rounded-md border p-4 min-h-[200px] space-y-3">
                  {/* Subtasks list */}
                  <div className="space-y-2">
                    {subtasks.map((subtask) => (
                      <div
                        key={subtask.id}
                        className="flex items-center gap-2 p-2 rounded-md hover:bg-muted/50 transition-colors"
                      >
                        <button
                          onClick={() => handleToggleSubtask(subtask.id, subtask.is_completed)}
                          className="flex-shrink-0"
                        >
                          {subtask.is_completed ? (
                            <Check className="h-5 w-5 text-green-600" />
                          ) : (
                            <div className="h-5 w-5 border-2 border-muted-foreground rounded" />
                          )}
                        </button>
                        <span
                          className={cn(
                            "flex-1 text-sm",
                            subtask.is_completed && "line-through text-muted-foreground"
                          )}
                        >
                          {subtask.title}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => handleDeleteSubtask(subtask.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  {/* Add subtask input */}
                  <div className="flex items-center gap-2 pt-2 border-t">
                    <input
                      type="text"
                      value={newSubtaskTitle}
                      onChange={(e) => setNewSubtaskTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleAddSubtask()
                        }
                      }}
                      placeholder="Add a subtask..."
                      className="flex-1 px-2 py-1 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <Button size="sm" onClick={handleAddSubtask} disabled={!newSubtaskTitle.trim()}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="attachments" className="mt-4">
                <div className="rounded-md border p-4 min-h-[200px] space-y-3">
                  {/* Upload area */}
                  <div className="border-2 border-dashed rounded-md p-4 text-center">
                    <input
                      type="file"
                      id="file-upload"
                      className="hidden"
                      onChange={handleUploadFile}
                      disabled={uploadingFile}
                    />
                    <label
                      htmlFor="file-upload"
                      className="cursor-pointer flex flex-col items-center gap-2"
                    >
                      <Upload className="h-8 w-8 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {uploadingFile ? "Uploading..." : "Click to upload or drag and drop"}
                      </span>
                    </label>
                  </div>
                  {/* Attachments list */}
                  <div className="space-y-2">
                    {attachments.map((attachment) => (
                      <div
                        key={attachment.id}
                        className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 transition-colors"
                      >
                        <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{attachment.file_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {(attachment.file_size / 1024).toFixed(1)} KB
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => handleDownloadAttachment(attachment)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => handleDeleteAttachment(attachment.id, attachment.file_path)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    {attachments.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No attachments yet
                      </p>
                    )}
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="deliverables" className="mt-4">
                <div className="rounded-md border p-4 min-h-[200px] space-y-3">
                  {/* Deliverables list */}
                  <div className="space-y-2">
                    {deliverables.map((deliverable) => (
                      <div
                        key={deliverable.id}
                        className="flex items-center gap-2 p-2 rounded-md hover:bg-muted/50 transition-colors"
                      >
                        <button
                          onClick={() => handleToggleDeliverable(deliverable.id, deliverable.is_completed)}
                          className="flex-shrink-0"
                        >
                          {deliverable.is_completed ? (
                            <Check className="h-5 w-5 text-green-600" />
                          ) : (
                            <div className="h-5 w-5 border-2 border-muted-foreground rounded" />
                          )}
                        </button>
                        <span
                          className={cn(
                            "flex-1 text-sm",
                            deliverable.is_completed && "line-through text-muted-foreground"
                          )}
                        >
                          {deliverable.title}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => handleDeleteDeliverable(deliverable.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  {/* Add deliverable input */}
                  <div className="flex items-center gap-2 pt-2 border-t">
                    <input
                      type="text"
                      value={newDeliverableTitle}
                      onChange={(e) => setNewDeliverableTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleAddDeliverable()
                        }
                      }}
                      placeholder="Add a deliverable..."
                      className="flex-1 px-2 py-1 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <Button size="sm" onClick={handleAddDeliverable} disabled={!newDeliverableTitle.trim()}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Panel - 1/3 width - Updates & Comments */}
          <div className="flex-[1] flex flex-col border-l overflow-hidden">
            {/* Activity Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <h2 className="text-sm font-semibold">Activity</h2>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Activity Feed */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
              {/* Created Event - Show first */}
              {task.created_by_profile && (
                <div className="space-y-2">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src={getDiceBearAvatar(
                          task.created_by_profile.email || task.created_by_profile.id
                        )}
                        alt={getName(task.created_by_profile)}
                      />
                      <AvatarFallback className="text-xs">
                        {getInitials(task.created_by_profile)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {getName(task.created_by_profile)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(task.created_at), "MMM d, h:mm a")}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        created this task
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Activity Events */}
              {activities.map((activity) => {
                const actorName = activity.created_by_profile
                  ? getName(activity.created_by_profile)
                  : "System"
                const actorInitials = activity.created_by_profile
                  ? getInitials(activity.created_by_profile)
                  : "S"
                const actorSeed = activity.created_by_profile?.email || "system"

                return (
                  <div key={activity.id} className="space-y-2">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage
                          src={getDiceBearAvatar(actorSeed)}
                          alt={actorName}
                        />
                        <AvatarFallback className="text-xs">
                          {actorInitials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{actorName}</span>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(activity.created_at), "MMM d, h:mm a")}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {activity.action.replace(/_/g, " ")}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}

              {/* Comments */}
              {comments.map((comment) => {
                const authorName = getName(comment.author)
                const authorInitials = getInitials(comment.author)
                const authorSeed = comment.author.email || comment.author.id

                return (
                  <div key={comment.id} className="space-y-2">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage
                          src={getDiceBearAvatar(authorSeed)}
                          alt={authorName}
                        />
                        <AvatarFallback className="text-xs">
                          {authorInitials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{authorName}</span>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(comment.created_at), "MMM d, h:mm a")}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {comment.body}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}

              {comments.length === 0 && activities.length === 0 && !task.created_by_profile && (
                <div className="text-center py-8">
                  <p className="text-sm text-muted-foreground">
                    No activity yet
                  </p>
                </div>
              )}
            </div>

            {/* Comment Input */}
            <div className="border-t p-4 space-y-2">
              <Textarea
                placeholder="Write a comment..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="min-h-[80px] resize-none"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                    handleSubmitComment()
                  }
                }}
              />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <Plus className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8">
                    Comment
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <Sparkles className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <Link2 className="h-4 w-4" />
                  </Button>
                </div>
                <Button
                  size="sm"
                  onClick={handleSubmitComment}
                  disabled={!commentText.trim() || isSubmittingComment}
                >
                  <Send className="h-4 w-4 mr-2" />
                  Send
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

