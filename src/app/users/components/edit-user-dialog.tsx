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
import { Edit } from 'lucide-react'
import type { UserFull, UserFormData } from '@/lib/types/users'
import { createClient } from '@/lib/supabase/client'

interface EditUserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: UserFull | null
  onSubmit: (data: UserFormData) => Promise<void>
  roleOptions: { label: string; value: string }[]
  departmentOptions: { label: string; value: string }[]
}

export function EditUserDialog({
  open,
  onOpenChange,
  user,
  onSubmit,
  roleOptions,
  departmentOptions,
}: EditUserDialogProps) {
  const [formData, setFormData] = useState<UserFormData>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    department_id: '',
    role_ids: [],
  })
  const [selectedRoleNames, setSelectedRoleNames] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [roleIdMap, setRoleIdMap] = useState<Map<string, string>>(new Map())

  // Load role ID mapping
  useEffect(() => {
    async function loadRoleIds() {
      if (roleOptions.length === 0) return

      const supabase = createClient()
      const { data: roles } = await (supabase as any)
        .from('roles')
        .select('id, name')
        .in(
          'name',
          roleOptions.map((r) => r.value)
        )
        .is('deleted_at', null)

      if (roles) {
        const rolesTyped = roles as any[]
        const map = new Map<string, string>()
        rolesTyped.forEach((role) => {
          map.set(role.name, role.id)
        })
        setRoleIdMap(map)
      }
    }

    loadRoleIds()
  }, [roleOptions])

  // Initialize form when user changes
  useEffect(() => {
    if (user && open) {
      setFormData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        phone: user.phone || '',
        department_id: user.department_id || '',
        role_ids: user.roles.map((r) => r.id),
      })
      setSelectedRoleNames(user.roles.map((r) => r.name))
    }
  }, [user, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !formData.first_name || !formData.last_name || !formData.email) {
      return
    }

    // Convert role names to IDs
    const roleIds = selectedRoleNames
      .map((name) => roleIdMap.get(name))
      .filter((id): id is string => id !== undefined)

    setLoading(true)
    try {
      await onSubmit({
        ...formData,
        role_ids: roleIds,
      })
      onOpenChange(false)
    } catch (error) {
      // Error handling is done in parent
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

  if (!user) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Edit User
          </DialogTitle>
          <DialogDescription>
            Update user information, department, and role assignments
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit_first_name">First Name *</Label>
              <Input
                id="edit_first_name"
                value={formData.first_name}
                onChange={(e) =>
                  setFormData({ ...formData, first_name: e.target.value })
                }
                placeholder="Enter first name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_last_name">Last Name *</Label>
              <Input
                id="edit_last_name"
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
            <Label htmlFor="edit_email">Email *</Label>
            <Input
              id="edit_email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="Enter email address"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit_phone">Phone</Label>
            <Input
              id="edit_phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="Enter phone number"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit_department_id">Department</Label>
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
                      id={`edit-role-${role.value}`}
                      checked={selectedRoleNames.includes(role.value)}
                      onCheckedChange={() => toggleRoleName(role.value)}
                    />
                    <Label
                      htmlFor={`edit-role-${role.value}`}
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
            <Button type="submit" disabled={loading || selectedRoleNames.length === 0}>
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}


