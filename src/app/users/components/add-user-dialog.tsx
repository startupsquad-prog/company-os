'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import { Checkbox } from '@/components/ui/checkbox'
import { UserPlus } from 'lucide-react'
import type { UserFormData } from '@/lib/types/users'
import { createClient } from '@/lib/supabase/client'

interface AddUserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: UserFormData) => Promise<void>
  roleOptions: { label: string; value: string }[]
  departmentOptions: { label: string; value: string }[]
}

export function AddUserDialog({
  open,
  onOpenChange,
  onSubmit,
  roleOptions,
  departmentOptions,
}: AddUserDialogProps) {
  const [formData, setFormData] = useState<UserFormData>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    department_id: '',
    role_ids: [],
  })
  const [loading, setLoading] = useState(false)
  const [selectedRoleNames, setSelectedRoleNames] = useState<string[]>([])
  const [roleIdMap, setRoleIdMap] = useState<Map<string, string>>(new Map())

  // Load role ID mapping
  useEffect(() => {
    async function loadRoleIds() {
      if (roleOptions.length === 0) return

      const supabase = createClient()
      const { data: roles } = await supabase
        .from('roles')
        .select('id, name')
        .in(
          'name',
          roleOptions.map((r: { label: string; value: string }) => r.value)
        )
        .is('deleted_at', null)

      if (roles) {
        const map = new Map<string, string>()
        roles.forEach((role: { id: string; name: string }) => {
          map.set(role.name, role.id)
        })
        setRoleIdMap(map)
      }
    }

    loadRoleIds()
  }, [roleOptions])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.first_name || !formData.last_name || !formData.email) {
      return
    }

    // Convert role names to IDs
    const roleIds = selectedRoleNames
      .map((name) => roleIdMap.get(name))
      .filter((id): id is string => id !== undefined)

    if (roleIds.length === 0) {
      return
    }

    setLoading(true)
    try {
      // Call API to create user in Clerk and profile in Supabase
      const response = await fetch('/api/users/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          firstName: formData.first_name,
          lastName: formData.last_name,
          phoneNumber: formData.phone || undefined,
          departmentId: formData.department_id || undefined,
          roleIds: roleIds,
          skipPasswordChecks: true, // Allow creating user without password (they'll set it on first login)
          skipPasswordRequirement: true,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || result.details || 'Failed to create user')
      }

      // User created successfully - call parent onSubmit to refresh the user list
      // The parent will handle refreshing the table
      await onSubmit({
        ...formData,
        role_ids: roleIds,
      })

      // Reset form
      setFormData({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        department_id: '',
        role_ids: [],
      })
      setSelectedRoleNames([])
      onOpenChange(false)
    } catch (error) {
      // Error handling is done in parent
      throw error
    } finally {
      setLoading(false)
    }
  }

  const toggleRoleName = (roleName: string) => {
    setSelectedRoleNames((prev) =>
      prev.includes(roleName)
        ? prev.filter((name) => name !== roleName)
        : [...prev, roleName]
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Add New User
          </DialogTitle>
          <DialogDescription>
            Create a new user account. The user will be created in Clerk and a profile will be automatically created.
            An invitation email will be sent to the user to set their password and complete their account setup.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">First Name *</Label>
              <Input
                id="first_name"
                value={formData.first_name}
                onChange={(e) =>
                  setFormData({ ...formData, first_name: e.target.value })
                }
                placeholder="Enter first name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name">Last Name *</Label>
              <Input
                id="last_name"
                value={formData.last_name}
                onChange={(e) =>
                  setFormData({ ...formData, last_name: e.target.value })
                }
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

          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="Enter phone number"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="department_id">Department</Label>
            <Select
              value={formData.department_id || 'none'}
              onValueChange={(value) =>
                setFormData({ ...formData, department_id: value === 'none' ? '' : value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No department</SelectItem>
                {departmentOptions.map((dept) => (
                  <SelectItem key={dept.value} value={dept.value}>
                    {dept.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Roles *</Label>
            <div className="space-y-2 border rounded-md p-4 max-h-48 overflow-y-auto">
              {roleOptions.length === 0 ? (
                <p className="text-sm text-muted-foreground">No roles available</p>
              ) : (
                roleOptions.map((role) => (
                  <div key={role.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`role-${role.value}`}
                      checked={selectedRoleNames.includes(role.value)}
                      onCheckedChange={() => toggleRoleName(role.value)}
                    />
                    <Label
                      htmlFor={`role-${role.value}`}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {role.label}
                    </Label>
                  </div>
                ))
              )}
            </div>
            {selectedRoleNames.length === 0 && (
              <p className="text-xs text-muted-foreground">At least one role is required</p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading || selectedRoleNames.length === 0}
            >
              {loading ? 'Creating User...' : 'Create User'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

