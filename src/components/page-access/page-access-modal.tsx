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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { X, Search, UserPlus } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@clerk/nextjs'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface PageAccessModalProps {
  pagePath: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdate?: () => void
}

interface Profile {
  id: string
  first_name: string | null
  last_name: string | null
  email: string | null
  avatar_url: string | null
}

interface PageAccessData {
  id: string
  owner_id: string | null
  owner: Profile | null
  members: Array<{
    id: string
    profile_id: string
    access_level: 'view' | 'edit' | 'admin'
    profile: Profile
  }>
}

export function PageAccessModal({ pagePath, open, onOpenChange, onUpdate }: PageAccessModalProps) {
  const { user: clerkUser } = useUser()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [accessData, setAccessData] = useState<PageAccessData | null>(null)
  const [availableProfiles, setAvailableProfiles] = useState<Profile[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedOwnerId, setSelectedOwnerId] = useState<string | null>(null)
  const [memberAccessLevels, setMemberAccessLevels] = useState<Record<string, 'view' | 'edit' | 'admin'>>({})
  const [membersToAdd, setMembersToAdd] = useState<string[]>([])

  useEffect(() => {
    if (open && clerkUser?.id) {
      fetchPageAccess()
      fetchAvailableProfiles()
    }
  }, [open, pagePath, clerkUser?.id])

  const fetchPageAccess = async () => {
    if (!clerkUser?.id) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const supabase = createClient()

      // Fetch or create page access control record
      let { data: pageAccess, error: pageError } = await (supabase as any)
        .schema('core')
        .from('page_access_control')
        .select('id, owner_id')
        .eq('page_path', pagePath)
        .is('deleted_at', null)
        .maybeSingle()

      if (pageError) {
        console.error('Error fetching page access control:', pageError)
        toast.error('Failed to load page access settings')
        return
      }

      if (!pageAccess) {
        // Create new page access control record
        const { data: newPageAccess, error: createError } = await (supabase as any)
          .schema('core')
          .from('page_access_control')
          .insert({
            page_path: pagePath,
            created_by: clerkUser.id,
          })
          .select('id, owner_id')
          .single()

        if (createError) {
          console.error('Error creating page access control:', createError)
          toast.error('Failed to create page access settings')
          return
        }
        pageAccess = newPageAccess
      }

      // Fetch owner profile
      let owner = null
      if (pageAccess.owner_id) {
        const { data: ownerProfile, error: ownerError } = await (supabase as any)
          .schema('core')
          .from('profiles')
          .select('id, first_name, last_name, email, avatar_url')
          .eq('id', pageAccess.owner_id)
          .maybeSingle()

        if (ownerError) {
          console.error('Error fetching owner profile:', ownerError)
        } else if (ownerProfile) {
          owner = ownerProfile
        }
      }

      // Fetch members
      const { data: members, error: membersError } = await (supabase as any)
        .schema('core')
        .from('page_access_control_members')
        .select('id, profile_id, access_level')
        .eq('page_access_control_id', pageAccess.id)

      if (membersError) {
        console.error('Error fetching members:', membersError)
        toast.error('Failed to load members')
        return
      }

      // Fetch member profiles
      const profileIds = (members || []).map((m: any) => m.profile_id).filter(Boolean)
      const { data: profiles, error: profilesError } = profileIds.length > 0
        ? await (supabase as any)
            .schema('core')
            .from('profiles')
            .select('id, first_name, last_name, email, avatar_url')
            .in('id', profileIds)
        : { data: [], error: null }

      if (profilesError) {
        console.error('Error fetching member profiles:', profilesError)
        toast.error('Failed to load member profiles')
        return
      }

      const profilesMap = new Map((profiles || []).map((p: any) => [p.id, p]))

      const membersWithProfiles = (members || [])
        .map((m: any) => ({
          id: m.id,
          profile_id: m.profile_id,
          access_level: m.access_level,
          profile: profilesMap.get(m.profile_id) || null,
        }))
        .filter((m) => m.profile !== null)

      setAccessData({
        id: pageAccess.id,
        owner_id: pageAccess.owner_id,
        owner,
        members: membersWithProfiles,
      })

      // Initialize state
      setSelectedOwnerId(pageAccess.owner_id)
      const accessLevels: Record<string, 'view' | 'edit' | 'admin'> = {}
      membersWithProfiles.forEach((m) => {
        if (m.profile) {
          accessLevels[m.profile.id] = m.access_level
        }
      })
      setMemberAccessLevels(accessLevels)
      setMembersToAdd([])
    } catch (error: any) {
      console.error('Error fetching page access:', error)
      toast.error('Failed to load page access settings')
    } finally {
      setLoading(false)
    }
  }

  const fetchAvailableProfiles = async () => {
    if (!clerkUser?.id) return

    try {
      const supabase = createClient()
      const { data: profiles, error } = await (supabase as any)
        .schema('core')
        .from('profiles')
        .select('id, first_name, last_name, email, avatar_url')
        .is('deleted_at', null)
        .order('first_name')

      if (error) {
        console.error('Error fetching profiles:', error)
        toast.error('Failed to load available users')
        return
      }
      setAvailableProfiles(profiles || [])
    } catch (error: any) {
      console.error('Error fetching profiles:', error)
      toast.error('Failed to load available users')
    }
  }

  const handleSave = async () => {
    if (!clerkUser?.id || !accessData) return

    try {
      setSaving(true)

      // Update owner
      if (selectedOwnerId !== accessData.owner_id) {
        const supabase = createClient()
        const { error: updateError } = await (supabase as any)
          .schema('core')
          .from('page_access_control')
          .update({
            owner_id: selectedOwnerId,
            updated_at: new Date().toISOString(),
          })
          .eq('id', accessData.id)

        if (updateError) {
          console.error('Error updating owner:', updateError)
          throw updateError
        }
      }

      // Update existing members' access levels
      const supabase = createClient()
      for (const member of accessData.members) {
        const newAccessLevel = memberAccessLevels[member.profile_id]
        if (newAccessLevel && newAccessLevel !== member.access_level) {
          const { error: updateError } = await (supabase as any)
            .schema('core')
            .from('page_access_control_members')
            .update({
              access_level: newAccessLevel,
            })
            .eq('id', member.id)

          if (updateError) {
            console.error('Error updating member access level:', updateError)
            throw updateError
          }
        }
      }

      // Add new members
      for (const profileId of membersToAdd) {
        const accessLevel = memberAccessLevels[profileId] || 'view'
        const { error: insertError } = await (supabase as any)
          .schema('core')
          .from('page_access_control_members')
          .insert({
            page_access_control_id: accessData.id,
            profile_id: profileId,
            access_level: accessLevel,
            created_by: clerkUser.id,
          })

        if (insertError) {
          // If it's a duplicate, update instead
          if (insertError.code === '23505') {
            const { error: updateError } = await (supabase as any)
              .schema('core')
              .from('page_access_control_members')
              .update({
                access_level: accessLevel,
              })
              .eq('page_access_control_id', accessData.id)
              .eq('profile_id', profileId)

            if (updateError) {
              console.error('Error updating duplicate member:', updateError)
              throw updateError
            }
          } else {
            console.error('Error adding member:', insertError)
            throw insertError
          }
        }
      }

      toast.success('Page access updated successfully')
      onUpdate?.()
      onOpenChange(false)
    } catch (error: any) {
      console.error('Error saving page access:', error)
      toast.error(error.message || 'Failed to save page access settings')
    } finally {
      setSaving(false)
    }
  }

  const handleRemoveMember = async (memberId: string) => {
    if (!accessData || !clerkUser?.id) return

    try {
      const supabase = createClient()
      const { error } = await (supabase as any)
        .schema('core')
        .from('page_access_control_members')
        .delete()
        .eq('id', memberId)

      if (error) {
        console.error('Error removing member:', error)
        throw error
      }

      setAccessData({
        ...accessData,
        members: accessData.members.filter((m) => m.id !== memberId),
      })

      toast.success('Member removed')
    } catch (error: any) {
      console.error('Error removing member:', error)
      toast.error('Failed to remove member')
    }
  }

  const handleAddMember = (profileId: string) => {
    if (!membersToAdd.includes(profileId)) {
      setMembersToAdd([...membersToAdd, profileId])
      if (!memberAccessLevels[profileId]) {
        setMemberAccessLevels({ ...memberAccessLevels, [profileId]: 'view' })
      }
    }
  }

  const handleRemoveMemberToAdd = (profileId: string) => {
    setMembersToAdd(membersToAdd.filter((id) => id !== profileId))
    const newLevels = { ...memberAccessLevels }
    delete newLevels[profileId]
    setMemberAccessLevels(newLevels)
  }

  const getDiceBearAvatar = (seed: string) => {
    return `https://api.dicebear.com/7.x/micah/svg?seed=${encodeURIComponent(seed)}`
  }

  const getName = (profile: Profile) => {
    if (profile?.first_name && profile?.last_name) {
      return `${profile.first_name} ${profile.last_name}`
    }
    return profile?.email || 'Unknown'
  }

  const getInitials = (profile: Profile) => {
    if (profile?.first_name && profile?.last_name) {
      return `${profile.first_name[0]}${profile.last_name[0]}`.toUpperCase()
    }
    return profile?.email?.[0]?.toUpperCase() || '?'
  }

  const filteredProfiles = availableProfiles.filter((profile) => {
    const name = getName(profile).toLowerCase()
    const email = profile.email?.toLowerCase() || ''
    const query = searchQuery.toLowerCase()
    return name.includes(query) || email.includes(query)
  })

  // Filter out profiles that are already owner or members
  const existingProfileIds = new Set([
    ...(accessData?.owner_id ? [accessData.owner_id] : []),
    ...(accessData?.members || []).map((m) => m.profile_id),
    ...membersToAdd,
  ])

  const availableToAdd = filteredProfiles.filter((p) => !existingProfileIds.has(p.id))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Page Access Control</DialogTitle>
          <DialogDescription>Manage ownership and access for this page</DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="py-8 text-center text-sm text-muted-foreground">Loading...</div>
        ) : (
          <div className="space-y-6">
            {/* Owner Section */}
            <div className="space-y-2">
              <Label>Owner</Label>
              <Select value={selectedOwnerId || ''} onValueChange={setSelectedOwnerId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select owner" />
                </SelectTrigger>
                <SelectContent>
                  {availableProfiles.map((profile) => (
                    <SelectItem key={profile.id} value={profile.id}>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={getDiceBearAvatar(profile.email || profile.id)} />
                          <AvatarFallback className="text-xs">{getInitials(profile)}</AvatarFallback>
                        </Avatar>
                        <span>{getName(profile)}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                The owner is responsible for maintaining this page
              </p>
            </div>

            {/* Members Section */}
            <div className="space-y-2">
              <Label>Members</Label>
              <div className="space-y-2">
                {accessData?.members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-2 rounded-md border bg-card"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <Avatar className="h-8 w-8">
                        <AvatarImage
                          src={getDiceBearAvatar(member.profile.email || member.profile.id)}
                        />
                        <AvatarFallback className="text-xs">{getInitials(member.profile)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{getName(member.profile)}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {member.profile.email}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Select
                        value={memberAccessLevels[member.profile_id] || member.access_level}
                        onValueChange={(value: 'view' | 'edit' | 'admin') => {
                          setMemberAccessLevels({
                            ...memberAccessLevels,
                            [member.profile_id]: value,
                          })
                        }}
                      >
                        <SelectTrigger className="w-24 h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="view">View</SelectItem>
                          <SelectItem value="edit">Edit</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => handleRemoveMember(member.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}

                {/* Members to Add */}
                {membersToAdd.map((profileId) => {
                  const profile = availableProfiles.find((p) => p.id === profileId)
                  if (!profile) return null
                  return (
                    <div
                      key={profileId}
                      className="flex items-center justify-between p-2 rounded-md border bg-muted/50"
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={getDiceBearAvatar(profile.email || profile.id)} />
                          <AvatarFallback className="text-xs">{getInitials(profile)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{getName(profile)}</p>
                          <p className="text-xs text-muted-foreground truncate">{profile.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Select
                          value={memberAccessLevels[profileId] || 'view'}
                          onValueChange={(value: 'view' | 'edit' | 'admin') => {
                            setMemberAccessLevels({
                              ...memberAccessLevels,
                              [profileId]: value,
                            })
                          }}
                        >
                          <SelectTrigger className="w-24 h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="view">View</SelectItem>
                            <SelectItem value="edit">Edit</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => handleRemoveMemberToAdd(profileId)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Add Member */}
              <div className="space-y-2">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search users to add..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8"
                  />
                </div>
                {searchQuery && availableToAdd.length > 0 && (
                  <div className="border rounded-md max-h-48 overflow-y-auto">
                    {availableToAdd.map((profile) => (
                      <div
                        key={profile.id}
                        onClick={() => handleAddMember(profile.id)}
                        className="flex items-center gap-2 p-2 hover:bg-accent cursor-pointer"
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={getDiceBearAvatar(profile.email || profile.id)} />
                          <AvatarFallback className="text-xs">{getInitials(profile)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{getName(profile)}</p>
                          <p className="text-xs text-muted-foreground truncate">{profile.email}</p>
                        </div>
                        <UserPlus className="h-4 w-4 text-muted-foreground" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}