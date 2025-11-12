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
import type { CallFormData, CallFull, CallType, CallStatus, CallDirection } from '@/lib/types/calls'
import { createClient } from '@/lib/supabase/client'

interface CallFormProps {
  call?: CallFull | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: CallFormData) => Promise<void>
}

export function CallForm({ call, open, onOpenChange, onSubmit }: CallFormProps) {
  const [formData, setFormData] = useState<CallFormData>({
    call_type: 'outbound',
    direction: 'outgoing',
    status: 'completed',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [contacts, setContacts] = useState<Array<{ id: string; name: string }>>([])
  const [leads, setLeads] = useState<Array<{ id: string; contact: { name: string } | null }>>([])

  useEffect(() => {
    const fetchOptions = async () => {
      const supabase = createClient()
      const [contactsRes, leadsRes] = await Promise.all([
        (supabase as any).schema('core').from('contacts').select('id, name').is('deleted_at', null).limit(100),
        (supabase as any).schema('crm').from('leads').select('id, contact_id').is('deleted_at', null).limit(100),
      ])
      
      // Fetch contacts for leads separately
      const leadContactIds = [...new Set((leadsRes.data || []).map((l: any) => l.contact_id).filter(Boolean))]
      const { data: leadContacts } = leadContactIds.length > 0
        ? await (supabase as any)
            .schema('core')
            .from('contacts')
            .select('id, name')
            .in('id', leadContactIds)
        : { data: [] }
      
      const leadContactsMap = new Map((leadContacts || []).map((c: any) => [c.id, c]))
      const leadsWithContacts = (leadsRes.data || []).map((l: any) => ({
        id: l.id,
        contact: l.contact_id ? leadContactsMap.get(l.contact_id) || null : null,
      }))
      
      setContacts(contactsRes.data || [])
      setLeads(leadsWithContacts)
    }
    if (open) fetchOptions()
  }, [open])

  useEffect(() => {
    if (call) {
      setFormData({
        lead_id: call.lead_id || undefined,
        contact_id: call.contact_id || undefined,
        caller_id: call.caller_id || undefined,
        call_type: call.call_type,
        direction: call.direction || undefined,
        phone_number: call.phone_number || undefined,
        duration_seconds: call.duration_seconds || undefined,
        status: call.status || 'completed',
        outcome: call.outcome || undefined,
        subject: call.subject || undefined,
        notes: call.notes || undefined,
        scheduled_at: call.scheduled_at || undefined,
        started_at: call.started_at || undefined,
        ended_at: call.ended_at || undefined,
      })
    } else {
      setFormData({
        call_type: 'outbound',
        direction: 'outgoing',
        status: 'completed',
      })
    }
  }, [call, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    setIsSubmitting(true)
    try {
      await onSubmit(formData)
      onOpenChange(false)
    } catch (error) {
      console.error('Error submitting call:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{call ? 'Edit Call' : 'Log Call'}</DialogTitle>
            <DialogDescription>
              {call ? 'Update call information below.' : 'Log a new call in your CRM.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="call_type">Call Type</Label>
              <Select
                value={formData.call_type}
                onValueChange={(value) => setFormData({ ...formData, call_type: value as CallType })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="inbound">Inbound</SelectItem>
                  <SelectItem value="outbound">Outbound</SelectItem>
                  <SelectItem value="missed">Missed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="contact_id">Contact</Label>
              <Select
                value={formData.contact_id || '__none__'}
                onValueChange={(value) => setFormData({ ...formData, contact_id: value === '__none__' ? undefined : value || undefined, lead_id: undefined })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select contact" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None</SelectItem>
                  {contacts.map((contact) => (
                    <SelectItem key={contact.id} value={contact.id}>
                      {contact.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="lead_id">Lead</Label>
              <Select
                value={formData.lead_id || '__none__'}
                onValueChange={(value) => setFormData({ ...formData, lead_id: value === '__none__' ? undefined : value || undefined, contact_id: undefined })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select lead" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None</SelectItem>
                  {leads.map((lead) => (
                    <SelectItem key={lead.id} value={lead.id}>
                      {lead.contact?.name || `Lead ${lead.id.slice(0, 8)}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone_number">Phone Number</Label>
              <Input
                id="phone_number"
                type="tel"
                value={formData.phone_number || ''}
                onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                placeholder="+1 (555) 123-4567"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="direction">Direction</Label>
                <Select
                  value={formData.direction || ''}
                  onValueChange={(value) => setFormData({ ...formData, direction: value as CallDirection })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="incoming">Incoming</SelectItem>
                    <SelectItem value="outgoing">Outgoing</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status || 'completed'}
                  onValueChange={(value) => setFormData({ ...formData, status: value as CallStatus })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="no_answer">No Answer</SelectItem>
                    <SelectItem value="busy">Busy</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="duration_seconds">Duration (seconds)</Label>
              <Input
                id="duration_seconds"
                type="number"
                value={formData.duration_seconds || ''}
                onChange={(e) => setFormData({ ...formData, duration_seconds: e.target.value ? parseInt(e.target.value) : undefined })}
                placeholder="120"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                value={formData.subject || ''}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                placeholder="Call subject"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="outcome">Outcome</Label>
              <Input
                id="outcome"
                value={formData.outcome || ''}
                onChange={(e) => setFormData({ ...formData, outcome: e.target.value })}
                placeholder="Call outcome"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes || ''}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Call notes..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : call ? 'Update' : 'Log Call'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

