'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { getDiceBearAvatar, getUserInitials } from '@/lib/utils'
import type { UserFull } from '@/lib/types/users'
import { Shield, Crown, User as UserIcon, Calendar, Mail, Edit, Trash2, Phone, Building } from 'lucide-react'

interface UserDetailsModalProps {
  user: UserFull | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onEdit: (user: UserFull) => void
  onDelete: (user: UserFull) => void
}

export function UserDetailsModal({
  user,
  open,
  onOpenChange,
  onEdit,
  onDelete,
}: UserDetailsModalProps) {
  if (!user) return null

  const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ') || 'No name'
  const initials = getUserInitials(user.first_name, user.last_name, user.email)
  const avatarSeed = user.email || user.id || 'default'

  const getRoleIcon = (roleName: string) => {
    switch (roleName.toLowerCase()) {
      case 'superadmin':
        return <Shield className="h-4 w-4" />
      case 'admin':
        return <Crown className="h-4 w-4" />
      default:
        return <UserIcon className="h-4 w-4" />
    }
  }

  const getRoleVariant = (roleName: string): 'default' | 'secondary' | 'outline' => {
    switch (roleName.toLowerCase()) {
      case 'superadmin':
        return 'default'
      case 'admin':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={getDiceBearAvatar(avatarSeed)} alt={fullName} />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <div>
                <DialogTitle>{fullName}</DialogTitle>
                <DialogDescription>Complete user profile and role information</DialogDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={() => onEdit(user)} size="sm" variant="outline">
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button
                onClick={() => onDelete(user)}
                size="sm"
                variant="outline"
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="roles">Roles & Permissions</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 mt-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-3">Basic Information</h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Email:</span>
                      <span>{user.email || '—'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Phone:</span>
                      <span>{user.phone || '—'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Department:</span>
                      <span>{user.department?.name || '—'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Joined:</span>
                      <span>{new Date(user.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Last Updated:</span>
                      <span>{new Date(user.updated_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-3">Account Details</h4>
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm text-muted-foreground">User ID:</span>
                      <div className="mt-1">
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {user.clerk_user_id}
                        </code>
                      </div>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Profile ID:</span>
                      <div className="mt-1">
                        <code className="text-xs bg-muted px-2 py-1 rounded">{user.id}</code>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="roles" className="space-y-6 mt-6">
            <div className="space-y-4">
              <h4 className="font-medium">Assigned Roles</h4>
              {user.roles.length === 0 ? (
                <p className="text-sm text-muted-foreground">No roles assigned</p>
              ) : (
                <div className="space-y-3">
                  {user.roles.map((role) => (
                    <div key={role.id} className="flex items-center gap-3 p-3 rounded-lg border">
                      <div className="flex items-center gap-2">
                        {getRoleIcon(role.name)}
                        <Badge variant={getRoleVariant(role.name)}>{role.name}</Badge>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{role.name}</p>
                        {role.description && (
                          <p className="text-xs text-muted-foreground">{role.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="activity" className="space-y-6 mt-6">
            <div className="space-y-4">
              <h4 className="font-medium">Recent Activity</h4>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-lg border">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-sm">Profile created</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(user.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg border">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-sm">Profile last updated</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(user.updated_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}


