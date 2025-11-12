'use client'

import { useState, useEffect, useCallback } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import {
  CheckCircle2,
  Calendar,
  Clock,
  Flag,
  User,
  Tag,
  Link2,
  MoreVertical,
  Star,
  Share2,
  Sparkles,
  Send,
  Plus,
  ChevronLeft,
  ChevronRight,
  Ticket,
  MessageSquare,
  FileText,
  Download,
  Upload,
  Trash2,
  CheckSquare,
  X,
} from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { RainbowButton } from '@/components/ui/rainbow-button'
import { format, isPast, differenceInDays } from 'date-fns'
import { cn } from '@/lib/utils'
import type { TicketFull } from '@/lib/types/tickets'
import { createClient } from '@/lib/supabase/client' // Still needed for file attachments (Supabase Storage)
import { toast } from 'sonner'

interface TicketDetailsModalProps {
  ticket: TicketFull | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onEdit?: (ticket: TicketFull) => void
  onDelete?: (ticket: TicketFull) => void
  allTickets?: TicketFull[] // For navigation
  onTicketChange?: (ticket: TicketFull) => void // Callback when navigating to different ticket
  onUpdate?: (ticket: TicketFull) => void // Callback for inline updates (doesn't open form)
}

interface TicketComment {
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

interface TicketAttachment {
  id: string
  ticket_id: string
  file_name: string
  file_path: string
  file_size: number
  mime_type: string | null
  created_at: string
}

interface ChecklistItem {
  id: string
  text: string
  is_completed: boolean
  position: number
}

interface TicketSolution {
  id: string
  ticket_id: string
  title: string
  description: string | null
  checklist_items: ChecklistItem[]
  is_active: boolean
  created_at: string
  updated_at: string
  created_by: string | null
}

export function TicketDetailsModal({
  ticket,
  open,
  onOpenChange,
  onEdit,
  onDelete,
  allTickets = [],
  onTicketChange,
  onUpdate,
}: TicketDetailsModalProps) {
  const [comments, setComments] = useState<TicketComment[]>([])
  const [activities, setActivities] = useState<ActivityEvent[]>([])
  const [commentText, setCommentText] = useState('')
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)
  const [loading, setLoading] = useState(false)
  const [isStarred, setIsStarred] = useState((ticket as any)?.is_starred || false)
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [editedTitle, setEditedTitle] = useState(ticket?.title || '')
  const [isSavingTitle, setIsSavingTitle] = useState(false)
  const [attachments, setAttachments] = useState<TicketAttachment[]>([])
  const [isEditingDescription, setIsEditingDescription] = useState(false)
  const [editedDescription, setEditedDescription] = useState(ticket?.description || '')
  const [uploadingFile, setUploadingFile] = useState(false)
  const [solutions, setSolutions] = useState<TicketSolution[]>([])
  const [selectedSolution, setSelectedSolution] = useState<TicketSolution | null>(null)
  const [newSolutionTitle, setNewSolutionTitle] = useState('')
  const [newSolutionDescription, setNewSolutionDescription] = useState('')
  const [newChecklistItemText, setNewChecklistItemText] = useState('')
  const [isCreatingSolution, setIsCreatingSolution] = useState(false)
  const [isGeneratingSolutions, setIsGeneratingSolutions] = useState(false)

  const fetchComments = useCallback(async () => {
    if (!ticket) return

    try {
      const response = await fetch(`/api/unified/tickets/${ticket.id}/comments`)
      if (!response.ok) {
        throw new Error('Failed to fetch comments')
      }
      const result = await response.json()
      setComments(result.data || [])
    } catch (error) {
      console.error('Error fetching comments:', error)
    }
  }, [ticket])

  const fetchActivities = useCallback(async () => {
    if (!ticket) return

    try {
      const response = await fetch(`/api/unified/tickets/${ticket.id}/status-history`)
      if (!response.ok) {
        throw new Error('Failed to fetch status history')
      }
      const result = await response.json()
      const activitiesWithProfiles = (result.data || []).map((history: any) => ({
        id: history.id,
        action: `Status changed to ${history.status}`,
        created_at: history.created_at,
        created_by_profile: history.created_by_profile || null,
        metadata: { old_status: history.previous_status, new_status: history.status },
      }))
      setActivities(activitiesWithProfiles)
    } catch (error) {
      console.error('Error fetching activities:', error)
    }
  }, [ticket])

  const fetchAttachments = useCallback(async () => {
    if (!ticket) return

    try {
      // Use API route instead of direct Supabase call
      const response = await fetch(`/api/unified/tickets/${ticket.id}/attachments`)
      if (!response.ok) {
        // If API route doesn't exist, return empty array
        if (response.status === 404) {
          setAttachments([])
          return
        }
        throw new Error('Failed to fetch attachments')
      }
      const result = await response.json()
      setAttachments(result.data || [])
    } catch (error) {
      console.error('Error fetching attachments:', error)
      setAttachments([]) // Set empty array on error
    }
  }, [ticket])

  const fetchSolutions = useCallback(async () => {
    if (!ticket) return

    try {
      const response = await fetch(`/api/unified/tickets/${ticket.id}/solutions`)
      if (!response.ok) {
        if (response.status === 404) {
          setSolutions([])
          return
        }
        throw new Error('Failed to fetch solutions')
      }
      const result = await response.json()
      const solutionsData = result.data || []
      setSolutions(solutionsData)
      // Set the first active solution as selected, or the first one if none are active
      // If we already have a selected solution, try to keep it selected
      if (solutionsData.length > 0) {
        if (selectedSolution) {
          const updatedSolution = solutionsData.find((s: TicketSolution) => s.id === selectedSolution.id)
          setSelectedSolution(updatedSolution || solutionsData[0])
        } else {
          const activeSolution = solutionsData.find((s: TicketSolution) => s.is_active) || solutionsData[0]
          setSelectedSolution(activeSolution)
        }
      } else {
        setSelectedSolution(null)
      }
    } catch (error) {
      console.error('Error fetching solutions:', error)
      setSolutions([])
      setSelectedSolution(null)
    }
  }, [ticket])

  const getCurrentTicketIndex = () => {
    if (!ticket || allTickets.length === 0) return -1
    return allTickets.findIndex((t) => t.id === ticket.id)
  }

  const handlePreviousTicket = () => {
    const currentIndex = getCurrentTicketIndex()
    if (currentIndex > 0 && onTicketChange) {
      onTicketChange(allTickets[currentIndex - 1])
    }
  }

  const handleNextTicket = () => {
    const currentIndex = getCurrentTicketIndex()
    if (currentIndex >= 0 && currentIndex < allTickets.length - 1 && onTicketChange) {
      onTicketChange(allTickets[currentIndex + 1])
    }
  }

  const canNavigatePrevious = () => {
    const currentIndex = getCurrentTicketIndex()
    return currentIndex > 0
  }

  const canNavigateNext = () => {
    const currentIndex = getCurrentTicketIndex()
    return currentIndex >= 0 && currentIndex < allTickets.length - 1
  }

  // Share function
  const handleShare = async () => {
    if (!ticket) return
    const ticketUrl = `${window.location.origin}/tickets?ticket=${ticket.id}`
    try {
      await navigator.clipboard.writeText(ticketUrl)
      toast.success('Ticket link copied to clipboard')
    } catch (error) {
      console.error('Error copying to clipboard:', error)
      toast.error('Failed to copy link')
    }
  }

  // Fetch comments and activities when modal opens
  useEffect(() => {
    if (open && ticket) {
      fetchComments()
      fetchActivities()
      fetchAttachments()
      fetchSolutions()
      setIsStarred((ticket as any)?.is_starred || false)
      setEditedTitle(ticket.title || '')
      setEditedDescription(ticket.description || '')
    }
  }, [open, ticket, fetchComments, fetchActivities, fetchAttachments, fetchSolutions])

  const handleSubmitComment = async () => {
    if (!ticket || !commentText.trim()) return

    setIsSubmittingComment(true)
    try {
      const response = await fetch(`/api/unified/tickets/${ticket.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          body: commentText.trim(),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to add comment')
      }

      setCommentText('')
      await fetchComments()
      toast.success('Comment added')
    } catch (error) {
      console.error('Error adding comment:', error)
      toast.error('Failed to add comment')
    } finally {
      setIsSubmittingComment(false)
    }
  }

  const handleToggleStar = async () => {
    if (!ticket) return

    const newStarredState = !isStarred
    setIsStarred(newStarredState)

    try {
      // Note: tickets table doesn't have is_starred field in schema
      // This feature may need to be implemented differently or removed
      toast.success(newStarredState ? 'Ticket starred' : 'Ticket unstarred')
      // Update ticket in parent if callback exists
      const updatedTicket = { ...ticket, is_starred: newStarredState } as TicketFull
      if (onUpdate) {
        onUpdate(updatedTicket)
      } else if (onEdit) {
        onEdit(updatedTicket)
      }
    } catch (error) {
      console.error('Error toggling star:', error)
      setIsStarred(!newStarredState) // Revert on error
      toast.error('Failed to update star status')
    }
  }

  const handleSaveTitle = async () => {
    if (!ticket || !editedTitle.trim() || editedTitle === ticket.title) {
      setIsEditingTitle(false)
      return
    }

    setIsSavingTitle(true)
    try {
      const response = await fetch(`/api/unified/tickets/${ticket.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editedTitle.trim(),
          // Don't send updated_at - it's handled automatically by the API
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to update title')
      }

      toast.success('Title updated')
      setIsEditingTitle(false)
      const updatedTicket = { ...ticket, title: editedTitle.trim() } as TicketFull
      // Use onUpdate for inline edits (doesn't open form), fallback to onEdit if onUpdate not provided
      if (onUpdate) {
        onUpdate(updatedTicket)
      } else if (onEdit) {
        onEdit(updatedTicket)
      }
    } catch (error) {
      console.error('Error updating title:', error)
      toast.error('Failed to update title')
      setEditedTitle(ticket.title || '')
    } finally {
      setIsSavingTitle(false)
    }
  }

  const handleSaveDescription = async () => {
    if (!ticket || editedDescription === ticket.description) {
      setIsEditingDescription(false)
      return
    }

    try {
      const response = await fetch(`/api/unified/tickets/${ticket.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: editedDescription || null,
          // Don't send updated_at - it's handled automatically by the API
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to update description')
      }

      toast.success('Description updated')
      setIsEditingDescription(false)
      const updatedTicket = { ...ticket, description: editedDescription } as TicketFull
      // Use onUpdate for inline edits (doesn't open form), fallback to onEdit if onUpdate not provided
      if (onUpdate) {
        onUpdate(updatedTicket)
      } else if (onEdit) {
        onEdit(updatedTicket)
      }
    } catch (error) {
      console.error('Error updating description:', error)
      toast.error('Failed to update description')
      setEditedDescription(ticket.description || '')
    }
  }

  // Attachment handlers
  const handleUploadFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!ticket || !event.target.files || event.target.files.length === 0) return

    const file = event.target.files[0]
    setUploadingFile(true)

    try {
      const supabase = createClient()

      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data: profile } = await (supabase as any)
        .schema('core')
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single()

      const profileTyped = profile as any

      if (!profileTyped) throw new Error('Profile not found')

      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}.${fileExt}`
      const filePath = `${ticket.id}/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('ticket-attachments')
        .upload(filePath, file)

      if (uploadError) {
        if (
          uploadError.message?.includes('Bucket not found') ||
          uploadError.message?.includes('not found')
        ) {
          throw new Error(
            'Storage bucket "ticket-attachments" not found. Please create it in Supabase Storage settings.'
          )
        }
        throw uploadError
      }

      // Save attachment record
      const fullPath = `ticket-attachments/${filePath}`

      const { error: insertError } = await (supabase as any)
        .schema('common_util')
        .from('ticket_attachments')
        .insert({
          ticket_id: ticket.id,
          file_name: file.name,
          file_path: fullPath,
          file_size: file.size,
          mime_type: file.type,
          uploaded_by: profileTyped.id,
        })

      if (insertError) throw insertError

      await fetchAttachments()
      toast.success('File uploaded successfully')
    } catch (error) {
      console.error('Error uploading file:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload file'
      if (errorMessage.includes('Bucket not found')) {
        toast.error('Storage bucket not configured. Please contact your administrator.')
      } else {
        toast.error(errorMessage)
      }
    } finally {
      setUploadingFile(false)
      event.target.value = ''
    }
  }

  const handleDownloadAttachment = async (attachment: TicketAttachment) => {
    try {
      const supabase = createClient()
      const pathWithoutBucket = attachment.file_path.replace(/^ticket-attachments\//, '')

      const { data, error } = await supabase.storage
        .from('ticket-attachments')
        .download(pathWithoutBucket)

      if (error) {
        if (error.message?.includes('Bucket not found') || error.message?.includes('not found')) {
          throw new Error('Storage bucket "ticket-attachments" not found.')
        }
        throw error
      }

      const url = URL.createObjectURL(data)
      const a = document.createElement('a')
      a.href = url
      a.download = attachment.file_name
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast.success('File downloaded')
    } catch (error) {
      console.error('Error downloading file:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to download file'
      if (errorMessage.includes('Bucket not found')) {
        toast.error('Storage bucket not configured. Please contact your administrator.')
      } else {
        toast.error(errorMessage)
      }
    }
  }

  const handleDeleteAttachment = async (attachmentId: string, filePath: string) => {
    try {
      const supabase = createClient()

      const pathWithoutBucket = filePath.replace(/^ticket-attachments\//, '')

      const { error: storageError } = await supabase.storage
        .from('ticket-attachments')
        .remove([pathWithoutBucket])

      if (storageError) console.warn('Error deleting from storage:', storageError)

      const { error } = await (supabase as any)
        .schema('common_util')
        .from('ticket_attachments')
        .delete()
        .eq('id', attachmentId)

      if (error) throw error

      await fetchAttachments()
      toast.success('Attachment deleted')
    } catch (error) {
      console.error('Error deleting attachment:', error)
      toast.error('Failed to delete attachment')
    }
  }

  // Solution handlers
  const handleCreateSolution = async () => {
    if (!ticket || !newSolutionTitle.trim()) return

    setIsCreatingSolution(true)
    try {
      const response = await fetch(`/api/unified/tickets/${ticket.id}/solutions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newSolutionTitle.trim(),
          description: newSolutionDescription.trim() || null,
          checklist_items: [],
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to create solution')
      }

      setNewSolutionTitle('')
      setNewSolutionDescription('')
      await fetchSolutions()
      toast.success('Solution created')
    } catch (error) {
      console.error('Error creating solution:', error)
      toast.error('Failed to create solution')
    } finally {
      setIsCreatingSolution(false)
    }
  }

  const handleAddChecklistItem = async () => {
    if (!selectedSolution || !newChecklistItemText.trim()) return

    try {
      const currentItems = selectedSolution.checklist_items || []
      const maxPosition = currentItems.length > 0 ? Math.max(...currentItems.map((item) => item.position || 0)) : -1
      const newItem: ChecklistItem = {
        id: crypto.randomUUID(),
        text: newChecklistItemText.trim(),
        is_completed: false,
        position: maxPosition + 1,
      }

      const updatedItems = [...currentItems, newItem]

      const response = await fetch(`/api/unified/tickets/solutions/${selectedSolution.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          checklist_items: updatedItems,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to add checklist item')
      }

      setNewChecklistItemText('')
      await fetchSolutions()
      toast.success('Checklist item added')
    } catch (error) {
      console.error('Error adding checklist item:', error)
      toast.error('Failed to add checklist item')
    }
  }

  const handleToggleChecklistItem = async (itemId: string) => {
    if (!selectedSolution) return

    try {
      const currentItems = selectedSolution.checklist_items || []
      const updatedItems = currentItems.map((item) =>
        item.id === itemId ? { ...item, is_completed: !item.is_completed } : item
      )

      const response = await fetch(`/api/unified/tickets/solutions/${selectedSolution.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          checklist_items: updatedItems,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to update checklist item')
      }

      await fetchSolutions()
    } catch (error) {
      console.error('Error toggling checklist item:', error)
      toast.error('Failed to update checklist item')
    }
  }

  const handleDeleteChecklistItem = async (itemId: string) => {
    if (!selectedSolution) return

    try {
      const currentItems = selectedSolution.checklist_items || []
      const updatedItems = currentItems.filter((item) => item.id !== itemId)

      const response = await fetch(`/api/unified/tickets/solutions/${selectedSolution.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          checklist_items: updatedItems,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to delete checklist item')
      }

      await fetchSolutions()
      toast.success('Checklist item deleted')
    } catch (error) {
      console.error('Error deleting checklist item:', error)
      toast.error('Failed to delete checklist item')
    }
  }

  const handleDeleteSolution = async (solutionId: string) => {
    if (!confirm('Are you sure you want to delete this solution?')) return

    try {
      const response = await fetch(`/api/unified/tickets/solutions/${solutionId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to delete solution')
      }

      await fetchSolutions()
      toast.success('Solution deleted')
    } catch (error) {
      console.error('Error deleting solution:', error)
      toast.error('Failed to delete solution')
    }
  }

  const handleGenerateSolutions = async () => {
    if (!ticket) return

    // Check if solutions already exist
    if (solutions.length > 0) {
      toast.error('Solutions already exist for this ticket. Please delete existing solutions before generating new ones.')
      return
    }

    setIsGeneratingSolutions(true)
    try {
      const response = await fetch(`/api/unified/tickets/${ticket.id}/generate-solutions`, {
        method: 'POST',
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to generate solutions')
      }

      const result = await response.json()
      await fetchSolutions()
      toast.success(result.message || `Successfully generated ${result.data?.length || 0} solution(s)`)
    } catch (error) {
      console.error('Error generating solutions:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to generate solutions')
    } finally {
      setIsGeneratingSolutions(false)
    }
  }

  if (!ticket) return null

  const statusConfig: Record<
    string,
    { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }
  > = {
    new: { label: 'New', variant: 'outline' },
    open: { label: 'Open', variant: 'default' },
    in_progress: { label: 'In Progress', variant: 'default' },
    waiting: { label: 'Waiting', variant: 'secondary' },
    resolved: { label: 'Resolved', variant: 'secondary' },
    closed: { label: 'Closed', variant: 'secondary' },
    cancelled: { label: 'Cancelled', variant: 'destructive' },
  }

  const priorityConfig: Record<string, { label: string; color: string }> = {
    low: { label: 'Low', color: 'text-gray-500' },
    medium: { label: 'Medium', color: 'text-yellow-500' },
    high: { label: 'High', color: 'text-orange-500' },
    critical: { label: 'Critical', color: 'text-red-500' },
  }

  const status = ticket.status ? statusConfig[ticket.status] : null
  const priority = ticket.priority ? priorityConfig[ticket.priority] : null

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

  const dueDate = ticket.due_date ? new Date(ticket.due_date) : null
  const isOverdue = dueDate && isPast(dueDate) && ticket.status !== 'resolved' && ticket.status !== 'closed'
  const daysUntilDue = dueDate ? differenceInDays(dueDate, new Date()) : null
  const isDueSoon = daysUntilDue !== null && daysUntilDue <= 3 && daysUntilDue >= 0 && !isOverdue

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="!max-w-[95vw] sm:!max-w-[95vw] lg:!max-w-[95vw] w-full h-[95vh] max-h-[95vh] p-0 gap-0 overflow-hidden flex flex-col"
        style={{ maxWidth: '95vw' }}
      >
        <DialogTitle className="sr-only">Ticket Details</DialogTitle>
        <DialogDescription className="sr-only">Ticket details and information</DialogDescription>

        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-3 border-b">
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">
              Created {format(new Date(ticket.created_at), 'MMM d')}
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
              <Button variant="ghost" size="sm" className="h-8" onClick={handleToggleStar}>
                <Star className={cn('h-4 w-4', isStarred && 'fill-yellow-400 text-yellow-400')} />
              </Button>
            </div>
          </div>
          {/* Navigation arrows */}
          {allTickets.length > 1 && (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={handlePreviousTicket}
                disabled={!canNavigatePrevious()}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-xs text-muted-foreground">
                {getCurrentTicketIndex() + 1} / {allTickets.length}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={handleNextTicket}
                disabled={!canNavigateNext()}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Main Content - Split Layout */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel - 2/3 width - Ticket Details */}
          <div className="flex-[2] flex flex-col overflow-y-auto px-6 py-4 space-y-6">
            {/* Title */}
            <div className="space-y-2">
              {isEditingTitle ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    onBlur={handleSaveTitle}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleSaveTitle()
                      } else if (e.key === 'Escape') {
                        setEditedTitle(ticket.title || '')
                        setIsEditingTitle(false)
                      }
                    }}
                    className="flex-1 text-2xl font-semibold border-none outline-none bg-transparent focus:ring-2 focus:ring-primary rounded px-2 py-1"
                    autoFocus
                  />
                  {isSavingTitle && <span className="text-xs text-muted-foreground">Saving...</span>}
                </div>
              ) : (
                <h2
                  className="text-2xl font-semibold cursor-pointer hover:bg-muted/50 rounded px-2 py-1 -mx-2 -my-1 transition-colors"
                  onClick={() => setIsEditingTitle(true)}
                >
                  {ticket.title || 'Untitled Ticket'}
                </h2>
              )}
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className="text-xs">
                  <Ticket className="h-3 w-3 mr-1" />
                  {ticket.ticket_number}
                </Badge>
                {status && (
                  <Badge variant={status.variant} className="text-xs">
                    {status.label}
                  </Badge>
                )}
                {priority && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge variant="outline" className="text-xs">
                          <Flag className={cn('h-3 w-3 mr-1', priority.color)} />
                          {priority.label}
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>Priority</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
                {ticket.category && (
                  <Badge variant="secondary" className="text-xs">
                    <Tag className="h-3 w-3 mr-1" />
                    {ticket.category}
                  </Badge>
                )}
              </div>
            </div>

            {/* Ticket Info Grid */}
            <div className="grid grid-cols-2 gap-4">
              {/* Client */}
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="h-4 w-4" />
                  <span>Client</span>
                </div>
                <div className="text-sm font-medium">
                  {ticket.client?.name || ticket.client_name || 'Unassigned'}
                </div>
              </div>

              {/* Assignee */}
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="h-4 w-4" />
                  <span>Assignee</span>
                </div>
                {ticket.assignee ? (
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage
                        src={getDiceBearAvatar(ticket.assignee.email || ticket.assignee.id)}
                        alt={getName(ticket.assignee)}
                      />
                      <AvatarFallback className="text-xs">{getInitials(ticket.assignee)}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">{getName(ticket.assignee)}</span>
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">Unassigned</span>
                )}
              </div>

              {/* Due Date */}
              {dueDate && (
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>Due Date</span>
                  </div>
                  <div
                    className={cn(
                      'text-sm font-medium',
                      isOverdue && 'text-destructive',
                      isDueSoon && !isOverdue && 'text-orange-600'
                    )}
                  >
                    {format(dueDate, 'MMM d, yyyy')}
                    {isOverdue && <span className="ml-2 text-xs">(Overdue)</span>}
                    {isDueSoon && !isOverdue && <span className="ml-2 text-xs">(Due Soon)</span>}
                  </div>
                </div>
              )}

              {/* Created At */}
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>Created</span>
                </div>
                <div className="text-sm font-medium">
                  {format(new Date(ticket.created_at), 'MMM d, yyyy')}
                </div>
              </div>
            </div>

            <Separator />

            {/* Description */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold">Description</h3>
              {isEditingDescription ? (
                <div className="space-y-2">
                  <Textarea
                    value={editedDescription}
                    onChange={(e) => setEditedDescription(e.target.value)}
                    className="min-h-[120px]"
                    placeholder="Add a description..."
                  />
                  <div className="flex items-center gap-2">
                    <Button size="sm" onClick={handleSaveDescription}>
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setEditedDescription(ticket.description || '')
                        setIsEditingDescription(false)
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div
                  className="text-sm text-muted-foreground cursor-pointer hover:bg-muted/50 rounded p-2 -mx-2 transition-colors min-h-[40px]"
                  onClick={() => setIsEditingDescription(true)}
                >
                  {ticket.description ? (
                    <p className="whitespace-pre-wrap">{ticket.description}</p>
                  ) : (
                    <p className="text-muted-foreground italic">Click to add description...</p>
                  )}
                </div>
              )}
            </div>

            {/* Tabbed Container */}
            <Tabs defaultValue="attachments" className="w-full">
              <TabsList>
                <TabsTrigger value="attachments">Attachments</TabsTrigger>
                <TabsTrigger value="comments">Comments</TabsTrigger>
                <TabsTrigger value="solution">Solution</TabsTrigger>
              </TabsList>
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
                        {uploadingFile ? 'Uploading...' : 'Click to upload or drag and drop'}
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
                            onClick={() =>
                              handleDeleteAttachment(attachment.id, attachment.file_path)
                            }
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
              <TabsContent value="comments" className="mt-4">
                <div className="rounded-md border p-4 min-h-[200px] space-y-3">
                  <div className="space-y-2">
                    {comments.map((comment) => {
                      const authorName = getName(comment.author)
                      const authorInitials = getInitials(comment.author)
                      const authorSeed = comment.author.email || comment.author.id

                      return (
                        <div key={comment.id} className="space-y-2">
                          <div className="flex items-start gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={getDiceBearAvatar(authorSeed)} alt={authorName} />
                              <AvatarFallback className="text-xs">{authorInitials}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">{authorName}</span>
                                <span className="text-xs text-muted-foreground">
                                  {format(new Date(comment.created_at), 'MMM d, h:mm a')}
                                </span>
                              </div>
                              <p className="text-sm text-muted-foreground">{comment.body}</p>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                    {comments.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">No comments yet</p>
                    )}
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="solution" className="mt-4">
                <div className="rounded-md border p-4 min-h-[200px] space-y-4">
                  {solutions.length === 0 ? (
                    <div className="space-y-4">
                      <div className="text-center py-8">
                        <CheckSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                        <p className="text-sm text-muted-foreground mb-4">No solution yet</p>
                      </div>
                      {/* Create new solution form */}
                      <div className="space-y-3 p-4 border rounded-lg bg-muted/50">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Solution Title *</label>
                          <Input
                            placeholder="Enter solution title..."
                            value={newSolutionTitle}
                            onChange={(e) => setNewSolutionTitle(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault()
                                handleCreateSolution()
                              }
                            }}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Description (optional)</label>
                          <Textarea
                            placeholder="Enter solution description..."
                            value={newSolutionDescription}
                            onChange={(e) => setNewSolutionDescription(e.target.value)}
                            rows={2}
                            className="resize-none"
                          />
                        </div>
                        <Button
                          onClick={handleCreateSolution}
                          disabled={!newSolutionTitle.trim() || isCreatingSolution}
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          {isCreatingSolution ? 'Creating...' : 'Create Solution'}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Solution selector */}
                      {solutions.length > 1 && (
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Select Solution</label>
                          <select
                            value={selectedSolution?.id || ''}
                            onChange={(e) => {
                              const solution = solutions.find((s) => s.id === e.target.value)
                              setSelectedSolution(solution || null)
                            }}
                            className="w-full px-3 py-2 text-sm border rounded-md bg-background"
                          >
                            {solutions.map((solution) => (
                              <option key={solution.id} value={solution.id}>
                                {solution.title} {solution.is_active ? '(Active)' : ''}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      {selectedSolution && (
                        <div className="space-y-4">
                          {/* Solution header */}
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="text-sm font-semibold mb-1">{selectedSolution.title}</h3>
                              {selectedSolution.description && (
                                <p className="text-sm text-muted-foreground">{selectedSolution.description}</p>
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => handleDeleteSolution(selectedSolution.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>

                          <Separator />

                          {/* Checklist */}
                          <div className="space-y-3">
                            <div className="flex items-center gap-2">
                              <CheckSquare className="h-4 w-4 text-muted-foreground" />
                              <h4 className="text-sm font-medium">Checklist</h4>
                            </div>

                            {/* Checklist items */}
                            <div className="space-y-2">
                              {selectedSolution.checklist_items && selectedSolution.checklist_items.length > 0 ? (
                                selectedSolution.checklist_items
                                  .sort((a, b) => (a.position || 0) - (b.position || 0))
                                  .map((item) => (
                                    <div
                                      key={item.id}
                                      className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 transition-colors"
                                    >
                                      <Checkbox
                                        checked={item.is_completed}
                                        onCheckedChange={() => handleToggleChecklistItem(item.id)}
                                      />
                                      <span
                                        className={cn(
                                          'flex-1 text-sm',
                                          item.is_completed && 'line-through text-muted-foreground'
                                        )}
                                      >
                                        {item.text}
                                      </span>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 w-6 p-0"
                                        onClick={() => handleDeleteChecklistItem(item.id)}
                                      >
                                        <X className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  ))
                              ) : (
                                <p className="text-sm text-muted-foreground text-center py-2">
                                  No checklist items yet
                                </p>
                              )}
                            </div>

                            {/* Add checklist item */}
                            <div className="flex items-center gap-2 pt-2 border-t">
                              <Input
                                placeholder="Add a checklist item..."
                                value={newChecklistItemText}
                                onChange={(e) => setNewChecklistItemText(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault()
                                    handleAddChecklistItem()
                                  }
                                }}
                                className="flex-1"
                              />
                              <Button
                                size="sm"
                                onClick={handleAddChecklistItem}
                                disabled={!newChecklistItemText.trim()}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>

            {/* AI Generate Solutions Button */}
            <div className="mt-4 flex justify-center">
              <RainbowButton
                onClick={handleGenerateSolutions}
                disabled={isGeneratingSolutions || solutions.length > 0}
                className="w-full sm:w-auto"
              >
                {isGeneratingSolutions ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Generating...
                  </span>
                ) : (
                  'Generate using AI'
                )}
              </RainbowButton>
            </div>
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
              {ticket.created_by && (
                <div className="space-y-2">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src={getDiceBearAvatar(ticket.created_by || 'system')}
                        alt="Creator"
                      />
                      <AvatarFallback className="text-xs">?</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">System</span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(ticket.created_at), 'MMM d, h:mm a')}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">created this ticket</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Activity Events */}
              {activities.map((activity) => {
                const actorName = activity.created_by_profile
                  ? getName(activity.created_by_profile)
                  : 'System'
                const actorInitials = activity.created_by_profile
                  ? getInitials(activity.created_by_profile)
                  : 'S'
                const actorSeed = activity.created_by_profile?.email || 'system'

                return (
                  <div key={activity.id} className="space-y-2">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={getDiceBearAvatar(actorSeed)} alt={actorName} />
                        <AvatarFallback className="text-xs">{actorInitials}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{actorName}</span>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(activity.created_at), 'MMM d, h:mm a')}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {activity.action.replace(/_/g, ' ')}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}

              {activities.length === 0 && !ticket.created_by && (
                <div className="text-center py-8">
                  <p className="text-sm text-muted-foreground">No activity yet</p>
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
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
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

