'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { DatePicker } from '@/components/ui/date-picker'
import { createClient } from '@/lib/supabase/client'
import type { Employee } from './types'

interface EmployeeFormProps {
  isOpen: boolean
  onClose: () => void
  employee: Employee | null
  isEditing: boolean
  onSubmit: (formData: any) => void
}

export function EmployeeForm({ isOpen, onClose, employee, isEditing, onSubmit }: EmployeeFormProps) {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    employee_id: '',
    status: 'active' as 'active' | 'onboarding' | 'resigned',
    hire_date: undefined as Date | undefined,
    termination_date: undefined as Date | undefined,
    department_id: '',
  })
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      loadDepartments()
      if (isEditing && employee) {
        setFormData({
          first_name: employee.first_name,
          last_name: employee.last_name,
          email: employee.email,
          phone: employee.phone || '',
          employee_id: employee.employee_id || '',
          status: employee.status,
          hire_date: employee.hire_date ? new Date(employee.hire_date) : undefined,
          termination_date: employee.termination_date ? new Date(employee.termination_date) : undefined,
          department_id: employee.department?.id || '',
        })
      } else {
        setFormData({
          first_name: '',
          last_name: '',
          email: '',
          phone: '',
          employee_id: '',
          status: 'active',
          hire_date: undefined,
          termination_date: undefined,
          department_id: '',
        })
      }
    }
  }, [isOpen, isEditing, employee])

  const loadDepartments = async () => {
    try {
      // Use unified API endpoint to bypass RLS issues
      const response = await fetch('/api/unified/departments')
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to fetch departments')
      }

      const result = await response.json()
      setDepartments(result.data || [])
    } catch (error) {
      console.error('Error loading departments:', error)
      // Set empty array on error to prevent UI issues
      setDepartments([])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await onSubmit({
        ...formData,
        hire_date: formData.hire_date ? formData.hire_date.toISOString().split('T')[0] : null,
        termination_date: formData.termination_date
          ? formData.termination_date.toISOString().split('T')[0]
          : null,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Employee' : 'Add New Employee'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">First Name *</Label>
              <Input
                id="first_name"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                placeholder="Enter first name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name">Last Name *</Label>
              <Input
                id="last_name"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                placeholder="Enter last name"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="Enter email address"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="Enter phone number"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="employee_id">Employee ID</Label>
              <Input
                id="employee_id"
                value={formData.employee_id}
                onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                placeholder="Enter employee ID"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: 'active' | 'onboarding' | 'resigned') =>
                  setFormData({ ...formData, status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="onboarding">Onboarding</SelectItem>
                  <SelectItem value="resigned">Resigned</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="department_id">Department</Label>
              <Select
                value={formData.department_id || 'none'}
                onValueChange={(value) => setFormData({ ...formData, department_id: value === 'none' ? '' : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="hire_date">Hire Date</Label>
              <DatePicker
                date={formData.hire_date}
                onDateChange={(date) => setFormData({ ...formData, hire_date: date || undefined })}
                placeholder="Pick a date"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="termination_date">Termination Date</Label>
              <DatePicker
                date={formData.termination_date}
                onDateChange={(date) =>
                  setFormData({ ...formData, termination_date: date || undefined })
                }
                placeholder="Pick a date"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : isEditing ? 'Update Employee' : 'Add Employee'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

