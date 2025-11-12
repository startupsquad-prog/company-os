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
import type { JobListingFormData, JobListingFull, JobListingStatus } from '@/lib/types/recruitment'
import { createClient } from '@/lib/supabase/client'

interface JobListingFormProps {
  listing?: JobListingFull | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: JobListingFormData) => Promise<void>
}

const statusOptions: { label: string; value: JobListingStatus }[] = [
  { label: 'Draft', value: 'draft' },
  { label: 'Active', value: 'active' },
  { label: 'Paused', value: 'paused' },
  { label: 'Closed', value: 'closed' },
  { label: 'Expired', value: 'expired' },
]

export function JobListingForm({ listing, open, onOpenChange, onSubmit }: JobListingFormProps) {
  const [formData, setFormData] = useState<JobListingFormData>({
    job_role_id: '',
    job_portal_id: '',
    status: 'draft',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [roles, setRoles] = useState<Array<{ id: string; title: string }>>([])
  const [portals, setPortals] = useState<Array<{ id: string; name: string }>>([])

  useEffect(() => {
    const fetchOptions = async () => {
      const supabase = createClient()
      const [rolesRes, portalsRes] = await Promise.all([
        (supabase as any).schema('ats').from('job_roles').select('id, title').is('deleted_at', null).limit(100),
        (supabase as any).schema('ats').from('job_portals').select('id, name').is('deleted_at', null).limit(100),
      ])
      setRoles(rolesRes.data || [])
      setPortals(portalsRes.data || [])
    }
    if (open) fetchOptions()
  }, [open])

  useEffect(() => {
    if (listing) {
      setFormData({
        job_role_id: listing.job_role_id,
        job_portal_id: listing.job_portal_id,
        external_job_id: listing.external_job_id || undefined,
        listing_url: listing.listing_url || undefined,
        status: listing.status,
        posted_at: listing.posted_at || undefined,
        expires_at: listing.expires_at || undefined,
        custom_description: listing.custom_description || undefined,
        notes: listing.notes || undefined,
      })
    } else {
      setFormData({
        job_role_id: '',
        job_portal_id: '',
        status: 'draft',
      })
    }
  }, [listing, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    setIsSubmitting(true)
    try {
      await onSubmit(formData)
      onOpenChange(false)
    } catch (error) {
      console.error('Error submitting job listing:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{listing ? 'Edit Job Listing' : 'Create Job Listing'}</DialogTitle>
            <DialogDescription>
              {listing ? 'Update job listing information below.' : 'Create a new job listing on a portal.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="job_role_id">Job Role *</Label>
              <Select
                value={formData.job_role_id}
                onValueChange={(value) => setFormData({ ...formData, job_role_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select job role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="job_portal_id">Job Portal *</Label>
              <Select
                value={formData.job_portal_id}
                onValueChange={(value) => setFormData({ ...formData, job_portal_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select portal" />
                </SelectTrigger>
                <SelectContent>
                  {portals.map((portal) => (
                    <SelectItem key={portal.id} value={portal.id}>
                      {portal.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="status">Status *</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value as JobListingStatus })}
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
                <Label htmlFor="external_job_id">External Job ID</Label>
                <Input
                  id="external_job_id"
                  value={formData.external_job_id || ''}
                  onChange={(e) => setFormData({ ...formData, external_job_id: e.target.value })}
                  placeholder="Portal job ID"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="listing_url">Listing URL</Label>
              <Input
                id="listing_url"
                type="url"
                value={formData.listing_url || ''}
                onChange={(e) => setFormData({ ...formData, listing_url: e.target.value })}
                placeholder="https://..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="posted_at">Posted At</Label>
                <Input
                  id="posted_at"
                  type="datetime-local"
                  value={formData.posted_at ? new Date(formData.posted_at).toISOString().slice(0, 16) : ''}
                  onChange={(e) => setFormData({ ...formData, posted_at: e.target.value ? new Date(e.target.value).toISOString() : undefined })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="expires_at">Expires At</Label>
                <Input
                  id="expires_at"
                  type="datetime-local"
                  value={formData.expires_at ? new Date(formData.expires_at).toISOString().slice(0, 16) : ''}
                  onChange={(e) => setFormData({ ...formData, expires_at: e.target.value ? new Date(e.target.value).toISOString() : undefined })}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="custom_description">Custom Description</Label>
              <Textarea
                id="custom_description"
                value={formData.custom_description || ''}
                onChange={(e) => setFormData({ ...formData, custom_description: e.target.value })}
                placeholder="Portal-specific description override..."
                rows={4}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes || ''}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional notes..."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !formData.job_role_id || !formData.job_portal_id}>
              {isSubmitting ? 'Saving...' : listing ? 'Update' : 'Create Listing'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

