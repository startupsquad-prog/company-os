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
} from 'lucide-react'
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

export function TicketDetailsModal({
  ticket,
  open,
  onOpenChange,
  onEdit,
  onDelete,
  allTickets = [],
  onTicketChange,
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
      setIsStarred((ticket as any)?.is_starred || false)
      setEditedTitle(ticket.title || '')
      setEditedDescription(ticket.description || '')
    }
  }, [open, ticket, fetchComments, fetchActivities, fetchAttachments])

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
      if (onEdit) {
        onEdit({ ...ticket, is_starred: newStarredState } as TicketFull)
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
      if (onEdit) {
        onEdit({ ...ticket, title: editedTitle.trim() } as TicketFull)
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
      if (onEdit) {
        onEdit({ ...ticket, description: editedDescription } as TicketFull)
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

