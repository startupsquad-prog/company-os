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
import type { JobRoleFormData, JobRoleFull, JobRoleStatus, EmploymentType } from '@/lib/types/recruitment'

interface JobRoleFormProps {
  role?: JobRoleFull | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: JobRoleFormData) => Promise<void>
}

const statusOptions: { label: string; value: JobRoleStatus }[] = [
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
  { label: 'Archived', value: 'archived' },
]

const employmentTypeOptions: { label: string; value: EmploymentType }[] = [
  { label: 'Full Time', value: 'full_time' },
  { label: 'Part Time', value: 'part_time' },
  { label: 'Contract', value: 'contract' },
  { label: 'Internship', value: 'internship' },
  { label: 'Freelance', value: 'freelance' },
]

export function JobRoleForm({ role, open, onOpenChange, onSubmit }: JobRoleFormProps) {
  const [formData, setFormData] = useState<JobRoleFormData>({
    title: '',
    status: 'active',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (role) {
      setFormData({
        title: role.title,
        department: role.department || undefined,
        location: role.location || undefined,
        employment_type: role.employment_type || undefined,
        status: role.status,
        description: role.description || undefined,
        requirements: role.requirements || undefined,
        responsibilities: role.responsibilities || undefined,
        salary_range_min: role.salary_range_min || undefined,
        salary_range_max: role.salary_range_max || undefined,
        currency: role.currency || undefined,
        experience_required_years: role.experience_required_years || undefined,
        tags: role.tags || undefined,
        notes: role.notes || undefined,
      })
    } else {
      setFormData({
        title: '',
        status: 'active',
      })
    }
  }, [role, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    setIsSubmitting(true)
    try {
      await onSubmit(formData)
      onOpenChange(false)
    } catch (error) {
      console.error('Error submitting job role:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{role ? 'Edit Job Role' : 'Add Job Role'}</DialogTitle>
            <DialogDescription>
              {role ? 'Update job role information below.' : 'Create a new job role for recruitment.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Job Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Senior Software Engineer"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="department">Department</Label>
                <Input
                  id="department"
                  value={formData.department || ''}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  placeholder="e.g., Engineering"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location || ''}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g., Gurgaon, India"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="employment_type">Employment Type</Label>
                <Select
                  value={formData.employment_type || '__none__'}
                  onValueChange={(value) => setFormData({ ...formData, employment_type: value === '__none__' ? undefined : value as EmploymentType })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">None</SelectItem>
                    {employmentTypeOptions.map((option) => (
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
                  onValueChange={(value) => setFormData({ ...formData, status: value as JobRoleStatus })}
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
            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="salary_range_min">Min Salary</Label>
                <Input
                  id="salary_range_min"
                  type="number"
                  value={formData.salary_range_min || ''}
                  onChange={(e) => setFormData({ ...formData, salary_range_min: e.target.value ? parseFloat(e.target.value) : undefined })}
                  placeholder="50000"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="salary_range_max">Max Salary</Label>
                <Input
                  id="salary_range_max"
                  type="number"
                  value={formData.salary_range_max || ''}
                  onChange={(e) => setFormData({ ...formData, salary_range_max: e.target.value ? parseFloat(e.target.value) : undefined })}
                  placeholder="100000"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="currency">Currency</Label>
                <Input
                  id="currency"
                  value={formData.currency || 'INR'}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  placeholder="INR"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="experience_required_years">Experience Required (Years)</Label>
              <Input
                id="experience_required_years"
                type="number"
                value={formData.experience_required_years || ''}
                onChange={(e) => setFormData({ ...formData, experience_required_years: e.target.value ? parseInt(e.target.value) : undefined })}
                placeholder="3"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Job description..."
                rows={4}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="requirements">Requirements</Label>
              <Textarea
                id="requirements"
                value={formData.requirements || ''}
                onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                placeholder="Required skills and qualifications..."
                rows={3}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="responsibilities">Responsibilities</Label>
              <Textarea
                id="responsibilities"
                value={formData.responsibilities || ''}
                onChange={(e) => setFormData({ ...formData, responsibilities: e.target.value })}
                placeholder="Key responsibilities..."
                rows={3}
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
            <Button type="submit" disabled={isSubmitting || !formData.title}>
              {isSubmitting ? 'Saving...' : role ? 'Update' : 'Create Role'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

