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
import type { InterviewFormData, InterviewFull, InterviewType, InterviewStatus } from '@/lib/types/recruitment'
import { createClient } from '@/lib/supabase/client'

interface InterviewFormProps {
  interview?: InterviewFull | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: InterviewFormData) => Promise<void>
}

const typeOptions: { label: string; value: InterviewType }[] = [
  { label: 'Phone Screen', value: 'phone_screen' },
  { label: 'Technical', value: 'technical' },
  { label: 'Behavioral', value: 'behavioral' },
  { label: 'Panel', value: 'panel' },
  { label: 'Final', value: 'final' },
  { label: 'Other', value: 'other' },
]

const statusOptions: { label: string; value: InterviewStatus }[] = [
  { label: 'Scheduled', value: 'scheduled' },
  { label: 'In Progress', value: 'in_progress' },
  { label: 'Completed', value: 'completed' },
  { label: 'Cancelled', value: 'cancelled' },
  { label: 'No Show', value: 'no_show' },
]

export function InterviewForm({ interview, open, onOpenChange, onSubmit }: InterviewFormProps) {
  const [formData, setFormData] = useState<InterviewFormData>({
    application_id: '',
    candidate_id: '',
    interview_type: 'phone_screen',
    status: 'scheduled',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [candidates, setCandidates] = useState<Array<{ id: string; contact: { name: string } | null }>>([])
  const [applications, setApplications] = useState<Array<{ id: string; job_title: string | null }>>([])
  const [interviewers, setInterviewers] = useState<Array<{ id: string; first_name: string | null; last_name: string | null; email: string | null }>>([])

  useEffect(() => {
    const fetchOptions = async () => {
      const supabase = createClient()
      const [candidatesRes, applicationsRes, interviewersRes] = await Promise.all([
        (supabase as any).schema('ats').from('candidates').select('id, contact_id').is('deleted_at', null).limit(100),
        (supabase as any).schema('ats').from('applications').select('id, job_title').is('deleted_at', null).limit(100),
        (supabase as any).schema('core').from('profiles').select('id, first_name, last_name, email').limit(100),
      ])
      
      // Fetch contacts for candidates
      const contactIds = [...new Set((candidatesRes.data || []).map((c: any) => c.contact_id).filter(Boolean))]
      const { data: contactsData } = contactIds.length > 0
        ? await (supabase as any).schema('core').from('contacts').select('id, name').in('id', contactIds)
        : { data: [] }
      
      const contactsMap = new Map((contactsData || []).map((c: any) => [c.id, c]))
      const candidatesWithContacts = (candidatesRes.data || []).map((c: any) => ({
        id: c.id,
        contact: contactsMap.get(c.contact_id) || null,
      }))
      
      setCandidates(candidatesWithContacts)
      setApplications(applicationsRes.data || [])
      setInterviewers(interviewersRes.data || [])
    }
    if (open) fetchOptions()
  }, [open])

  useEffect(() => {
    if (interview) {
      setFormData({
        application_id: interview.application_id,
        candidate_id: interview.candidate_id,
        interview_type: interview.interview_type,
        status: interview.status,
        scheduled_at: interview.scheduled_at || undefined,
        duration_minutes: interview.duration_minutes || undefined,
        location: interview.location || undefined,
        interviewer_ids: interview.interviewer_ids || undefined,
        notes: interview.notes || undefined,
        feedback_summary: interview.feedback_summary || undefined,
      })
    } else {
      setFormData({
        application_id: '',
        candidate_id: '',
        interview_type: 'phone_screen',
        status: 'scheduled',
      })
    }
  }, [interview, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    setIsSubmitting(true)
    try {
      await onSubmit(formData)
      onOpenChange(false)
    } catch (error) {
      console.error('Error submitting interview:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{interview ? 'Edit Interview' : 'Schedule Interview'}</DialogTitle>
            <DialogDescription>
              {interview ? 'Update interview information below.' : 'Schedule a new interview for a candidate.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="candidate_id">Candidate</Label>
              <Select
                value={formData.candidate_id}
                onValueChange={(value) => setFormData({ ...formData, candidate_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select candidate" />
                </SelectTrigger>
                <SelectContent>
                  {candidates.map((candidate) => (
                    <SelectItem key={candidate.id} value={candidate.id}>
                      {candidate.contact?.name || `Candidate ${candidate.id.slice(0, 8)}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="application_id">Application (Optional)</Label>
              <Select
                value={formData.application_id || '__none__'}
                onValueChange={(value) => setFormData({ ...formData, application_id: value === '__none__' ? '' : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select application" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None</SelectItem>
                  {applications.map((app) => (
                    <SelectItem key={app.id} value={app.id}>
                      {app.job_title || `Application ${app.id.slice(0, 8)}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="interview_type">Type</Label>
                <Select
                  value={formData.interview_type}
                  onValueChange={(value) => setFormData({ ...formData, interview_type: value as InterviewType })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {typeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value as InterviewStatus })}
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
            </div>
            <div className="grid gap-2">
              <Label htmlFor="scheduled_at">Scheduled At</Label>
              <Input
                id="scheduled_at"
                type="datetime-local"
                value={formData.scheduled_at ? new Date(formData.scheduled_at).toISOString().slice(0, 16) : ''}
                onChange={(e) => setFormData({ ...formData, scheduled_at: e.target.value ? new Date(e.target.value).toISOString() : undefined })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="duration_minutes">Duration (minutes)</Label>
                <Input
                  id="duration_minutes"
                  type="number"
                  value={formData.duration_minutes || ''}
                  onChange={(e) => setFormData({ ...formData, duration_minutes: e.target.value ? parseInt(e.target.value) : undefined })}
                  placeholder="60"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location || ''}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="In-person, Video, Phone"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes || ''}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Interview notes..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !formData.candidate_id}>
              {isSubmitting ? 'Saving...' : interview ? 'Update' : 'Schedule Interview'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

