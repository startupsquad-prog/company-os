'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import type { LeadFull, CreateLeadInput, LeadStatus } from '@/lib/types/leads'

interface LeadFormProps {
  lead: LeadFull | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

const statusOptions: { label: string; value: LeadStatus }[] = [
  { label: 'New', value: 'new' },
  { label: 'Contacted', value: 'contacted' },
  { label: 'Qualified', value: 'qualified' },
  { label: 'Proposal', value: 'proposal' },
  { label: 'Negotiation', value: 'negotiation' },
  { label: 'Won', value: 'won' },
  { label: 'Lost', value: 'lost' },
]

const sourceOptions = [
  { label: 'Website', value: 'website' },
  { label: 'Referral', value: 'referral' },
  { label: 'Cold Call', value: 'cold_call' },
  { label: 'Event', value: 'event' },
  { label: 'Social', value: 'social' },
  { label: 'Other', value: 'other' },
]

export function LeadForm({ lead, open, onOpenChange, onSuccess }: LeadFormProps) {
  const [loading, setLoading] = useState(false)
  const { register, handleSubmit, reset, setValue, watch } = useForm<
    CreateLeadInput & { contact_name?: string; company_name?: string }
  >()

  useEffect(() => {
    if (lead) {
      reset({
        status: lead.status,
        source: lead.source || undefined,
        value: lead.value || undefined,
        probability: lead.probability || undefined,
        expected_close_date: lead.expected_close_date || undefined,
        notes: lead.notes || undefined,
        tags: lead.tags || undefined,
        contact_name: lead.contact?.name,
        company_name: lead.company?.name,
      })
    } else {
      reset({
        status: 'new',
      })
    }
  }, [lead, reset])

  const onSubmit = async (data: any) => {
    try {
      setLoading(true)

      const payload: CreateLeadInput = {
        status: data.status || 'new',
        source: data.source || null,
        value: data.value ? parseFloat(data.value) : null,
        probability: data.probability ? parseInt(data.probability) : null,
        expected_close_date: data.expected_close_date || null,
        notes: data.notes || null,
        tags: data.tags
          ? Array.isArray(data.tags)
            ? data.tags
            : data.tags.split(',').map((t) => t.trim())
          : null,
      }

      const url = lead ? `/api/crm/leads/${lead.id}` : '/api/crm/leads'
      const method = lead ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save lead')
      }

      toast.success(lead ? 'Lead updated' : 'Lead created')
      onSuccess()
    } catch (error: any) {
      console.error('Error saving lead:', error)
      toast.error(error.message || 'Failed to save lead')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{lead ? 'Edit Lead' : 'Create Lead'}</DialogTitle>
          <DialogDescription>
            {lead ? 'Update lead information' : 'Add a new lead to your pipeline'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={watch('status') || 'new'}
                onValueChange={(value) => setValue('status', value as LeadStatus)}
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
            <div className="space-y-2">
              <Label htmlFor="source">Source</Label>
              <Select
                value={watch('source') || ''}
                onValueChange={(value) => setValue('source', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select source" />
                </SelectTrigger>
                <SelectContent>
                  {sourceOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="value">Value ($)</Label>
              <Input
                id="value"
                type="number"
                step="0.01"
                {...register('value', { valueAsNumber: true })}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="probability">Probability (%)</Label>
              <Input
                id="probability"
                type="number"
                min="0"
                max="100"
                {...register('probability', { valueAsNumber: true })}
                placeholder="0"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="expected_close_date">Expected Close Date</Label>
            <Input id="expected_close_date" type="date" {...register('expected_close_date')} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              {...register('notes')}
              placeholder="Add notes about this lead..."
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Tags (comma-separated)</Label>
            <Input id="tags" {...register('tags')} placeholder="enterprise, hot, priority" />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : lead ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
