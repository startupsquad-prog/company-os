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
import type { PasswordFormData, PasswordFull } from '@/lib/types/password-vault'
import { createClient } from '@/lib/supabase/client'

interface PasswordFormProps {
  password?: PasswordFull | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: PasswordFormData) => Promise<void>
}

export function PasswordForm({ password, open, onOpenChange, onSubmit }: PasswordFormProps) {
  const [formData, setFormData] = useState<PasswordFormData>({
    title: '',
    username: '',
    password: '',
    url: '',
    category: '',
    company_id: '',
    notes: '',
    tags: [],
    is_favorite: false,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [companies, setCompanies] = useState<Array<{ id: string; name: string }>>([])

  const categories = ['Work', 'Personal', 'Banking', 'Social Media']

  useEffect(() => {
    if (password) {
      setFormData({
        title: password.title,
        username: password.username || '',
        password: password.password_encrypted || '', // For now, show encrypted as plain text
        url: password.url || '',
        category: password.category || '',
        company_id: password.company_id || '',
        notes: password.notes || '',
        tags: password.tags || [],
        is_favorite: password.is_favorite ?? false,
      })
    } else {
      setFormData({
        title: '',
        username: '',
        password: '',
        url: '',
        category: '',
        company_id: '',
        notes: '',
        tags: [],
        is_favorite: false,
      })
    }
  }, [password, open])

  useEffect(() => {
    const fetchCompanies = async () => {
      const supabase = createClient()
      
      // Fetch companies using schema-aware query
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
    if (!formData.title.trim()) return

    setIsSubmitting(true)
    try {
      await onSubmit(formData)
      onOpenChange(false)
    } catch (error) {
      console.error('Error submitting password:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{password ? 'Edit Password' : 'Add Password'}</DialogTitle>
            <DialogDescription>
              {password ? 'Update password information below.' : 'Add a new password to your vault.'}
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
                placeholder="e.g., Gmail Account"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="username@example.com"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Enter password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="url">URL</Label>
              <Input
                id="url"
                type="url"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                placeholder="https://example.com"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category || '__none__'}
                  onValueChange={(value) => setFormData({ ...formData, category: value === '__none__' ? undefined : value || undefined })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">None</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="company_id">Company</Label>
                <Select
                  value={formData.company_id || '__none__'}
                  onValueChange={(value) => setFormData({ ...formData, company_id: value === '__none__' ? undefined : value || undefined })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select company" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">None</SelectItem>
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
            <Button type="submit" disabled={isSubmitting || !formData.title.trim()}>
              {isSubmitting ? 'Saving...' : password ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}


