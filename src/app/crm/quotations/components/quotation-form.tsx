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
import type { QuotationFormData, QuotationFull, QuotationStatus } from '@/lib/types/quotations'
import { createClient } from '@/lib/supabase/client'

interface QuotationFormProps {
  quotation?: QuotationFull | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: QuotationFormData) => Promise<void>
}

export function QuotationForm({ quotation, open, onOpenChange, onSubmit }: QuotationFormProps) {
  const [formData, setFormData] = useState<QuotationFormData>({
    lead_id: '',
    quote_number: '',
    title: '',
    description: '',
    total_amount: 0,
    currency: 'USD',
    tax_amount: 0,
    discount_amount: 0,
    status: 'draft',
    valid_until: undefined,
    items: [],
    terms: '',
    notes: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [leads, setLeads] = useState<Array<{ id: string; contact: { name: string } | null }>>([])

  useEffect(() => {
    const fetchLeads = async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from('leads')
        .select('id, contact:contacts(id, name)')
        .is('deleted_at', null)
        .limit(100)
      setLeads(data || [])
    }
    if (open) fetchLeads()
  }, [open])

  useEffect(() => {
    if (quotation) {
      setFormData({
        lead_id: quotation.lead_id,
        quote_number: quotation.quote_number,
        title: quotation.title || '',
        description: quotation.description || '',
        total_amount: quotation.total_amount,
        currency: quotation.currency || 'USD',
        tax_amount: quotation.tax_amount || 0,
        discount_amount: quotation.discount_amount || 0,
        status: quotation.status || 'draft',
        valid_until: quotation.valid_until || undefined,
        items: quotation.items || [],
        terms: quotation.terms || '',
        notes: quotation.notes || '',
      })
    } else {
      // Generate quote number
      const quoteNum = `QT-${Date.now().toString().slice(-6)}`
      setFormData({
        lead_id: '',
        quote_number: quoteNum,
        title: '',
        description: '',
        total_amount: 0,
        currency: 'USD',
        tax_amount: 0,
        discount_amount: 0,
        status: 'draft',
        valid_until: undefined,
        items: [],
        terms: '',
        notes: '',
      })
    }
  }, [quotation, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.lead_id || !formData.quote_number || formData.total_amount <= 0) return

    setIsSubmitting(true)
    try {
      await onSubmit(formData)
      onOpenChange(false)
    } catch (error) {
      console.error('Error submitting quotation:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{quotation ? 'Edit Quotation' : 'Create Quotation'}</DialogTitle>
            <DialogDescription>
              {quotation ? 'Update quotation information below.' : 'Create a new quotation for a lead.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="lead_id">
                Lead <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.lead_id}
                onValueChange={(value) => setFormData({ ...formData, lead_id: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select lead" />
                </SelectTrigger>
                <SelectContent>
                  {leads.map((lead) => (
                    <SelectItem key={lead.id} value={lead.id}>
                      {lead.contact?.name || `Lead ${lead.id.slice(0, 8)}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="quote_number">
                  Quote Number <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="quote_number"
                  value={formData.quote_number}
                  onChange={(e) => setFormData({ ...formData, quote_number: e.target.value })}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status || 'draft'}
                  onValueChange={(value) => setFormData({ ...formData, status: value as QuotationStatus })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="sent">Sent</SelectItem>
                    <SelectItem value="viewed">Viewed</SelectItem>
                    <SelectItem value="accepted">Accepted</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Quotation title"
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="total_amount">
                  Total Amount <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="total_amount"
                  type="number"
                  step="0.01"
                  value={formData.total_amount}
                  onChange={(e) => setFormData({ ...formData, total_amount: parseFloat(e.target.value) || 0 })}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="tax_amount">Tax Amount</Label>
                <Input
                  id="tax_amount"
                  type="number"
                  step="0.01"
                  value={formData.tax_amount || 0}
                  onChange={(e) => setFormData({ ...formData, tax_amount: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="discount_amount">Discount</Label>
                <Input
                  id="discount_amount"
                  type="number"
                  step="0.01"
                  value={formData.discount_amount || 0}
                  onChange={(e) => setFormData({ ...formData, discount_amount: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="currency">Currency</Label>
                <Select
                  value={formData.currency || 'USD'}
                  onValueChange={(value) => setFormData({ ...formData, currency: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                    <SelectItem value="INR">INR</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="valid_until">Valid Until</Label>
                <DatePicker
                  date={formData.valid_until ? new Date(formData.valid_until) : undefined}
                  onDateChange={(date) => setFormData({ ...formData, valid_until: date?.toISOString().split('T')[0] })}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Quotation description..."
                rows={3}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="terms">Terms & Conditions</Label>
              <Textarea
                id="terms"
                value={formData.terms}
                onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
                placeholder="Payment terms, delivery terms, etc."
                rows={3}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Internal notes..."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !formData.lead_id || !formData.quote_number || formData.total_amount <= 0}>
              {isSubmitting ? 'Saving...' : quotation ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

