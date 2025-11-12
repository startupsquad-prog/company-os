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
import type { RecruitmentCallFull } from '@/lib/types/recruitment'

interface RecruitmentCallFormProps {
  call?: RecruitmentCallFull | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: any) => Promise<void>
}

export function RecruitmentCallForm({ call, open, onOpenChange, onSubmit }: RecruitmentCallFormProps) {
  const [formData, setFormData] = useState({
    candidate_id: '',
    call_type: 'screening',
    call_date: new Date().toISOString().slice(0, 16),
    duration_minutes: 0,
    notes: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (call) {
      setFormData({
        candidate_id: call.candidate_id || '',
        call_type: call.call_type || 'screening',
        call_date: call.call_date ? new Date(call.call_date).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
        duration_minutes: call.duration_minutes || 0,
        notes: call.notes || '',
      })
    } else {
      setFormData({
        candidate_id: '',
        call_type: 'screening',
        call_date: new Date().toISOString().slice(0, 16),
        duration_minutes: 0,
        notes: '',
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
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{call ? 'Edit Call' : 'Log Call'}</DialogTitle>
            <DialogDescription>Record a call with a candidate</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="call_type">Call Type</Label>
              <Select value={formData.call_type} onValueChange={(value) => setFormData({ ...formData, call_type: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="screening">Screening</SelectItem>
                  <SelectItem value="follow_up">Follow Up</SelectItem>
                  <SelectItem value="offer">Offer</SelectItem>
                  <SelectItem value="rejection">Rejection</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="call_date">Date & Time</Label>
              <Input
                id="call_date"
                type="datetime-local"
                value={formData.call_date}
                onChange={(e) => setFormData({ ...formData, call_date: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="duration_minutes">Duration (minutes)</Label>
              <Input
                id="duration_minutes"
                type="number"
                value={formData.duration_minutes}
                onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={4}
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


