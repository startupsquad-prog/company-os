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
import type { CandidateFormData, CandidateFull, CandidateStatus, CandidateSource } from '@/lib/types/recruitment'
import { createClient } from '@/lib/supabase/client'

interface CandidateFormProps {
  candidate?: CandidateFull | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: CandidateFormData) => Promise<void>
}

const statusOptions: { label: string; value: CandidateStatus }[] = [
  { label: 'New', value: 'new' },
  { label: 'Screening', value: 'screening' },
  { label: 'Shortlisted', value: 'shortlisted' },
  { label: 'Interviewing', value: 'interviewing' },
  { label: 'Offered', value: 'offered' },
  { label: 'Hired', value: 'hired' },
  { label: 'Rejected', value: 'rejected' },
  { label: 'Withdrawn', value: 'withdrawn' },
]

const sourceOptions: { label: string; value: CandidateSource }[] = [
  { label: 'Website', value: 'website' },
  { label: 'Referral', value: 'referral' },
  { label: 'LinkedIn', value: 'linkedin' },
  { label: 'Indeed', value: 'indeed' },
  { label: 'Other', value: 'other' },
]

export function CandidateForm({ candidate, open, onOpenChange, onSubmit }: CandidateFormProps) {
  const [formData, setFormData] = useState<CandidateFormData>({
    status: 'new',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [contacts, setContacts] = useState<Array<{ id: string; name: string }>>([])
  const [recruiters, setRecruiters] = useState<Array<{ id: string; first_name: string | null; last_name: string | null; email: string | null }>>([])

  useEffect(() => {
    const fetchOptions = async () => {
      const supabase = createClient()
      const [contactsRes, recruitersRes] = await Promise.all([
        (supabase as any).schema('core').from('contacts').select('id, name').is('deleted_at', null).limit(100),
        (supabase as any).schema('core').from('profiles').select('id, first_name, last_name, email').limit(100),
      ])
      
      setContacts(contactsRes.data || [])
      setRecruiters(recruitersRes.data || [])
    }
    if (open) fetchOptions()
  }, [open])

  useEffect(() => {
    if (candidate) {
      setFormData({
        contact_id: candidate.contact_id,
        status: candidate.status,
        source: candidate.source || undefined,
        recruiter_id: candidate.recruiter_id || undefined,
        resume_url: candidate.resume_url || undefined,
        cover_letter_url: candidate.cover_letter_url || undefined,
        tags: candidate.tags || undefined,
        notes: candidate.notes || undefined,
      })
    } else {
      setFormData({
        status: 'new',
      })
    }
  }, [candidate, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    setIsSubmitting(true)
    try {
      await onSubmit(formData)
      onOpenChange(false)
    } catch (error) {
      console.error('Error submitting candidate:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{candidate ? 'Edit Candidate' : 'Add Candidate'}</DialogTitle>
            <DialogDescription>
              {candidate ? 'Update candidate information below.' : 'Add a new candidate to your recruitment pipeline.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="contact_id">Contact</Label>
              <Select
                value={formData.contact_id || '__none__'}
                onValueChange={(value) => setFormData({ ...formData, contact_id: value === '__none__' ? undefined : value || undefined })}
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
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value as CandidateStatus })}
                >
                  <SelectTrigger>
                    <SelectValue />
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
              <div className="grid gap-2">
                <Label htmlFor="source">Source</Label>
                <Select
                  value={formData.source || '__none__'}
                  onValueChange={(value) => setFormData({ ...formData, source: value === '__none__' ? undefined : value as CandidateSource })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select source" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">None</SelectItem>
                    {sourceOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="recruiter_id">Recruiter</Label>
              <Select
                value={formData.recruiter_id || '__none__'}
                onValueChange={(value) => setFormData({ ...formData, recruiter_id: value === '__none__' ? undefined : value || undefined })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select recruiter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None</SelectItem>
                  {recruiters.map((recruiter) => {
                    const name = `${recruiter.first_name || ''} ${recruiter.last_name || ''}`.trim() || recruiter.email || 'Unknown'
                    return (
                      <SelectItem key={recruiter.id} value={recruiter.id}>
                        {name}
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="resume_url">Resume URL</Label>
              <Input
                id="resume_url"
                value={formData.resume_url || ''}
                onChange={(e) => setFormData({ ...formData, resume_url: e.target.value })}
                placeholder="https://..."
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="cover_letter_url">Cover Letter URL</Label>
              <Input
                id="cover_letter_url"
                value={formData.cover_letter_url || ''}
                onChange={(e) => setFormData({ ...formData, cover_letter_url: e.target.value })}
                placeholder="https://..."
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes || ''}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Candidate notes..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !formData.contact_id}>
              {isSubmitting ? 'Saving...' : candidate ? 'Update' : 'Add Candidate'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

