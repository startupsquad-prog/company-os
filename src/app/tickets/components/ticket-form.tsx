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
import type { TicketFormData, TicketFull, TicketStatus, TicketPriority } from '@/lib/types/tickets'
import { createClient } from '@/lib/supabase/client'

interface TicketFormProps {
  ticket?: TicketFull | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: TicketFormData) => Promise<void>
}

export function TicketForm({ ticket, open, onOpenChange, onSubmit }: TicketFormProps) {
  const [formData, setFormData] = useState<TicketFormData>({
    title: '',
    description: '',
    client_id: '',
    client_email: '',
    client_name: '',
    status: 'new',
    priority: 'medium',
    category: '',
    assignee_id: '',
    due_date: undefined,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [contacts, setContacts] = useState<Array<{ id: string; name: string; email: string | null }>>([])
  const [profiles, setProfiles] = useState<Array<{ id: string; first_name: string | null; last_name: string | null }>>([])

  useEffect(() => {
    const fetchOptions = async () => {
      const supabase = createClient()
      const [contactsRes, profilesRes] = await Promise.all([
        supabase.from('contacts').select('id, name, email').is('deleted_at', null).limit(100),
        supabase.from('profiles').select('id, first_name, last_name').limit(100),
      ])
      setContacts(contactsRes.data || [])
      setProfiles(profilesRes.data || [])
    }
    if (open) fetchOptions()
  }, [open])

  useEffect(() => {
    if (ticket) {
      setFormData({
        title: ticket.title,
        description: ticket.description || '',
        client_id: ticket.client_id || '',
        client_email: ticket.client_email || '',
        client_name: ticket.client_name || '',
        status: ticket.status || 'new',
        priority: ticket.priority || 'medium',
        category: ticket.category || '',
        assignee_id: ticket.assignee_id || '',
        due_date: ticket.due_date || undefined,
      })
    } else {
      // Generate ticket number
      const ticketNum = `TKT-${Date.now().toString().slice(-6)}`
      setFormData({
        title: '',
        description: '',
        client_id: '',
        client_email: '',
        client_name: '',
        status: 'new',
        priority: 'medium',
        category: '',
        assignee_id: '',
        due_date: undefined,
      })
    }
  }, [ticket, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim()) return

    setIsSubmitting(true)
    try {
      await onSubmit(formData)
      onOpenChange(false)
    } catch (error) {
      console.error('Error submitting ticket:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{ticket ? 'Edit Ticket' : 'Create Ticket'}</DialogTitle>
            <DialogDescription>
              {ticket ? 'Update ticket information below.' : 'Create a new support ticket.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">
                Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Ticket title"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe the issue..."
                rows={4}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="client_id">Client</Label>
                <Select
                  value={formData.client_id || ''}
                  onValueChange={(value) => {
                    const contact = contacts.find((c) => c.id === value)
                    setFormData({
                      ...formData,
                      client_id: value || undefined,
                      client_name: contact?.name || undefined,
                      client_email: contact?.email || undefined,
                    })
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select client" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {contacts.map((contact) => (
                      <SelectItem key={contact.id} value={contact.id}>
                        {contact.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="assignee_id">Assignee</Label>
                <Select
                  value={formData.assignee_id || ''}
                  onValueChange={(value) => setFormData({ ...formData, assignee_id: value || undefined })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select assignee" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Unassigned</SelectItem>
                    {profiles.map((profile) => (
                      <SelectItem key={profile.id} value={profile.id}>
                        {[profile.first_name, profile.last_name].filter(Boolean).join(' ') || 'Unknown'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status || 'new'}
                  onValueChange={(value) => setFormData({ ...formData, status: value as TicketStatus })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="waiting">Waiting</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={formData.priority || 'medium'}
                  onValueChange={(value) => setFormData({ ...formData, priority: value as TicketPriority })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="Category"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="due_date">Due Date</Label>
              <DatePicker
                date={formData.due_date ? new Date(formData.due_date) : undefined}
                onDateChange={(date) => setFormData({ ...formData, due_date: date?.toISOString() })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !formData.title.trim()}>
              {isSubmitting ? 'Saving...' : ticket ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

