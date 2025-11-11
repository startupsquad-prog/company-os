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
import { Switch } from '@/components/ui/switch'
import { Eye, EyeOff } from 'lucide-react'
import type { CardFormData, CardFull } from '@/lib/types/password-vault'
import { createClient } from '@/lib/supabase/client'

interface CardFormProps {
  card?: CardFull | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: CardFormData) => Promise<void>
}

const months = Array.from({ length: 12 }, (_, i) => i + 1)
const currentYear = new Date().getFullYear()
const years = Array.from({ length: 20 }, (_, i) => currentYear + i)

export function CardForm({ card, open, onOpenChange, onSubmit }: CardFormProps) {
  const [formData, setFormData] = useState<CardFormData>({
    title: '',
    cardholder_name: '',
    card_number: '',
    expiry_month: undefined,
    expiry_year: undefined,
    cvv: '',
    card_type: 'credit',
    bank_name: '',
    billing_address: '',
    category: '',
    company_id: '',
    notes: '',
    tags: [],
    is_favorite: false,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showCardNumber, setShowCardNumber] = useState(false)
  const [showCvv, setShowCvv] = useState(false)
  const [companies, setCompanies] = useState<Array<{ id: string; name: string }>>([])

  useEffect(() => {
    if (card) {
      setFormData({
        title: card.title,
        cardholder_name: card.cardholder_name || '',
        card_number: card.card_number_encrypted || '', // For now, show encrypted as plain text
        expiry_month: card.expiry_month || undefined,
        expiry_year: card.expiry_year || undefined,
        cvv: card.cvv_encrypted || '', // For now, show encrypted as plain text
        card_type: card.card_type || 'credit',
        bank_name: card.bank_name,
        billing_address: card.billing_address || '',
        category: card.category || '',
        company_id: card.company_id || '',
        notes: card.notes || '',
        tags: card.tags || [],
        is_favorite: card.is_favorite ?? false,
      })
    } else {
      setFormData({
        title: '',
        cardholder_name: '',
        card_number: '',
        expiry_month: undefined,
        expiry_year: undefined,
        cvv: '',
        card_type: 'credit',
        bank_name: '',
        billing_address: '',
        category: '',
        company_id: '',
        notes: '',
        tags: [],
        is_favorite: false,
      })
    }
  }, [card, open])

  useEffect(() => {
    const fetchCompanies = async () => {
      const supabase = createClient()
      
      const { data: companyData } = await (supabase as any)
        .schema('core')
        .from('companies')
        .select('id, name')
        .is('deleted_at', null)
        .limit(100)

      setCompanies(companyData || [])
    }

    if (open) {
      fetchCompanies()
    }
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim() || !formData.bank_name.trim()) return

    setIsSubmitting(true)
    try {
      await onSubmit(formData)
      onOpenChange(false)
    } catch (error) {
      console.error('Error submitting card:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{card ? 'Edit Card' : 'Add Card'}</DialogTitle>
            <DialogDescription>
              {card ? 'Update card information below.' : 'Add a new card to your vault.'}
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
                placeholder="e.g., Chase Business Card"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="cardholder_name">Cardholder Name</Label>
                <Input
                  id="cardholder_name"
                  value={formData.cardholder_name}
                  onChange={(e) => setFormData({ ...formData, cardholder_name: e.target.value })}
                  placeholder="John Doe"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="card_type">Card Type</Label>
                <Select
                  value={formData.card_type || 'credit'}
                  onValueChange={(value) => setFormData({ ...formData, card_type: value as 'debit' | 'credit' })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="credit">Credit</SelectItem>
                    <SelectItem value="debit">Debit</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="card_number">Card Number</Label>
              <div className="relative">
                <Input
                  id="card_number"
                  type={showCardNumber ? 'text' : 'password'}
                  value={formData.card_number}
                  onChange={(e) => setFormData({ ...formData, card_number: e.target.value.replace(/\s/g, '') })}
                  placeholder="1234 5678 9012 3456"
                  maxLength={19}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowCardNumber(!showCardNumber)}
                >
                  {showCardNumber ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="expiry_month">Expiry Month</Label>
                <Select
                  value={formData.expiry_month?.toString() || ''}
                  onValueChange={(value) => setFormData({ ...formData, expiry_month: value ? parseInt(value) : undefined })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Month" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {months.map((month) => (
                      <SelectItem key={month} value={month.toString()}>
                        {String(month).padStart(2, '0')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="expiry_year">Expiry Year</Label>
                <Select
                  value={formData.expiry_year?.toString() || ''}
                  onValueChange={(value) => setFormData({ ...formData, expiry_year: value ? parseInt(value) : undefined })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Year" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {years.map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="cvv">CVV</Label>
                <div className="relative">
                  <Input
                    id="cvv"
                    type={showCvv ? 'text' : 'password'}
                    value={formData.cvv}
                    onChange={(e) => setFormData({ ...formData, cvv: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                    placeholder="123"
                    maxLength={4}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowCvv(!showCvv)}
                  >
                    {showCvv ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="bank_name">
                Bank Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="bank_name"
                value={formData.bank_name}
                onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                placeholder="Chase Bank"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="billing_address">Billing Address</Label>
              <Textarea
                id="billing_address"
                value={formData.billing_address}
                onChange={(e) => setFormData({ ...formData, billing_address: e.target.value })}
                placeholder="123 Main St, City, State ZIP"
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="Personal, Business, etc."
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="company_id">Company</Label>
                <Select
                  value={formData.company_id || ''}
                  onValueChange={(value) => setFormData({ ...formData, company_id: value || undefined })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select company" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {companies.map((company) => (
                      <SelectItem key={company.id} value={company.id}>
                        {company.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional notes..."
                rows={3}
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="is_favorite"
                checked={formData.is_favorite ?? false}
                onCheckedChange={(checked) => setFormData({ ...formData, is_favorite: checked })}
              />
              <Label htmlFor="is_favorite">Favorite</Label>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !formData.title.trim() || !formData.bank_name.trim()}>
              {isSubmitting ? 'Saving...' : card ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

