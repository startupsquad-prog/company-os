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
import type { JobPortalFormData, JobPortalFull, JobPortalStatus, JobPortalType } from '@/lib/types/recruitment'
import { createClient } from '@/lib/supabase/client'

interface JobPortalFormProps {
  portal?: JobPortalFull | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: JobPortalFormData) => Promise<void>
}

const statusOptions: { label: string; value: JobPortalStatus }[] = [
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
  { label: 'Expired', value: 'expired' },
]

const typeOptions: { label: string; value: JobPortalType }[] = [
  { label: 'Job Board', value: 'job_board' },
  { label: 'LinkedIn', value: 'linkedin' },
  { label: 'Indeed', value: 'indeed' },
  { label: 'Naukri', value: 'naukri' },
  { label: 'Monster', value: 'monster' },
  { label: 'Glassdoor', value: 'glassdoor' },
  { label: 'Other', value: 'other' },
]

export function JobPortalForm({ portal, open, onOpenChange, onSubmit }: JobPortalFormProps) {
  const [formData, setFormData] = useState<JobPortalFormData>({
    name: '',
    status: 'active',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [subscriptions, setSubscriptions] = useState<Array<{ id: string; name: string }>>([])

  useEffect(() => {
    const fetchSubscriptions = async () => {
      const supabase = createClient()
      const { data } = await (supabase as any).schema('common_util').from('subscriptions').select('id, name').is('deleted_at', null).limit(100)
      setSubscriptions(data || [])
    }
    if (open) fetchSubscriptions()
  }, [open])

  useEffect(() => {
    if (portal) {
      setFormData({
        name: portal.name,
        url: portal.url || undefined,
        subscription_id: portal.subscription_id || undefined,
        status: portal.status,
        portal_type: portal.portal_type || undefined,
        api_key: portal.api_key || undefined,
        api_secret: portal.api_secret || undefined,
        notes: portal.notes || undefined,
      })
    } else {
      setFormData({
        name: '',
        status: 'active',
      })
    }
  }, [portal, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    setIsSubmitting(true)
    try {
      await onSubmit(formData)
      onOpenChange(false)
    } catch (error) {
      console.error('Error submitting job portal:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{portal ? 'Edit Job Portal' : 'Add Job Portal'}</DialogTitle>
            <DialogDescription>
              {portal ? 'Update job portal information below.' : 'Add a new job portal to track job postings.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., LinkedIn Jobs"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="portal_type">Type</Label>
                <Select
                  value={formData.portal_type || '__none__'}
                  onValueChange={(value) => setFormData({ ...formData, portal_type: value === '__none__' ? undefined : value as JobPortalType })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">None</SelectItem>
                    {typeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="status">Status *</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value as JobPortalStatus })}
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
              <Label htmlFor="url">URL</Label>
              <Input
                id="url"
                type="url"
                value={formData.url || ''}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                placeholder="https://..."
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="subscription_id">Subscription (Optional)</Label>
              <Select
                value={formData.subscription_id || '__none__'}
                onValueChange={(value) => setFormData({ ...formData, subscription_id: value === '__none__' ? undefined : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select subscription" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None</SelectItem>
                  {subscriptions.map((sub) => (
                    <SelectItem key={sub.id} value={sub.id}>
                      {sub.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="api_key">API Key</Label>
                <Input
                  id="api_key"
                  type="password"
                  value={formData.api_key || ''}
                  onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
                  placeholder="API key"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="api_secret">API Secret</Label>
                <Input
                  id="api_secret"
                  type="password"
                  value={formData.api_secret || ''}
                  onChange={(e) => setFormData({ ...formData, api_secret: e.target.value })}
                  placeholder="API secret"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes || ''}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional notes..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !formData.name}>
              {isSubmitting ? 'Saving...' : portal ? 'Update' : 'Create Portal'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

