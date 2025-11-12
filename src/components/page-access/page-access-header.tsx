'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { UserPlus } from 'lucide-react'
import { PageAccessModal } from './page-access-modal'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@clerk/nextjs'
import { cn } from '@/lib/utils'

interface PageAccessHeaderProps {
  pagePath: string
  className?: string
}

interface PageAccessData {
  owner: {
    id: string
    first_name: string | null
    last_name: string | null
    email: string | null
    avatar_url: string | null
  } | null
  members: Array<{
    id: string
    profile_id: string
    access_level: 'view' | 'edit' | 'admin'
    profile: {
      id: string
      first_name: string | null
      last_name: string | null
      email: string | null
      avatar_url: string | null
    }
  }>
}

export function PageAccessHeader({ pagePath, className }: PageAccessHeaderProps) {
  const { user: clerkUser } = useUser()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [accessData, setAccessData] = useState<PageAccessData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (clerkUser?.id) {
      fetchPageAccess()
    } else {
      setAccessData({ owner: null, members: [] })
      setLoading(false)
    }
  }, [pagePath, clerkUser?.id])

  const fetchPageAccess = async () => {
    if (!clerkUser?.id) {
      setAccessData({ owner: null, members: [] })
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const supabase = createClient()

      // Fetch page access control record
      const { data: pageAccess, error: pageError } = await (supabase as any)
        .schema('core')
        .from('page_access_control')
        .select('id, owner_id')
        .eq('page_path', pagePath)
        .is('deleted_at', null)
        .maybeSingle()

      if (pageError) {
        // Only log if error has meaningful content (not just empty object)
        const hasErrorContent =
          pageError &&
          (pageError.message ||
            pageError.details ||
            pageError.hint ||
            pageError.code ||
            (typeof pageError === 'object' &&
              Object.keys(pageError).length > 0 &&
              Object.values(pageError).some((v) => v !== null && v !== undefined && v !== '')))
        if (hasErrorContent) {
          console.error('Error fetching page access:', {
            error: pageError,
            message: pageError?.message || 'Unknown error',
            details: pageError?.details || null,
            hint: pageError?.hint || null,
            code: pageError?.code || null,
            pagePath,
          })
        }
        // Don't throw - gracefully handle missing page access records
        setAccessData({ owner: null, members: [] })
        setLoading(false)
        return
      }

      if (!pageAccess) {
        setAccessData({ owner: null, members: [] })
        setLoading(false)
        return
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
          console.error('Error fetching owner profile:', {
            error: ownerError,
            message: ownerError?.message,
            details: ownerError?.details,
            hint: ownerError?.hint,
            code: ownerError?.code,
          })
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
        console.error('Error fetching members:', {
          error: membersError,
          message: membersError?.message,
          details: membersError?.details,
          hint: membersError?.hint,
          code: membersError?.code,
        })
        setAccessData({ owner, members: [] })
        setLoading(false)
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
        console.error('Error fetching member profiles:', {
          error: profilesError,
          message: profilesError?.message,
          details: profilesError?.details,
          hint: profilesError?.hint,
          code: profilesError?.code,
        })
        setAccessData({ owner, members: [] })
        setLoading(false)
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

      setAccessData({ owner, members: membersWithProfiles })
    } catch (error: any) {
      console.error('Error fetching page access:', {
        error: error || 'Unknown error',
        message: error?.message || 'Failed to fetch page access',
        stack: error?.stack || null,
        pagePath,
      })
      // Gracefully handle errors - page access is optional
      setAccessData({ owner: null, members: [] })
      setLoading(false)
    }
  }

  const getDiceBearAvatar = (seed: string) => {
    return `https://api.dicebear.com/7.x/micah/svg?seed=${encodeURIComponent(seed)}`
  }

  const getName = (profile: { first_name: string | null; last_name: string | null; email: string | null }) => {
    if (profile?.first_name && profile?.last_name) {
      return `${profile.first_name} ${profile.last_name}`
    }
    return profile?.email || 'Unknown'
  }

  const getInitials = (profile: { first_name: string | null; last_name: string | null; email: string | null }) => {
    if (profile?.first_name && profile?.last_name) {
      return `${profile.first_name[0]}${profile.last_name[0]}`.toUpperCase()
    }
    return profile?.email?.[0]?.toUpperCase() || '?'
  }

  // Combine owner and members for display (owner first, then members)
  const allPeople = [
    ...(accessData?.owner ? [{ ...accessData.owner, isOwner: true }] : []),
    ...(accessData?.members || []).map((m) => ({ ...m.profile, isOwner: false, access_level: m.access_level })),
  ]

  // Show max 3 avatars, then "+X" for remaining
  const visiblePeople = allPeople.slice(0, 3)
  const remainingCount = Math.max(0, allPeople.length - 3)

  if (loading) {
    return null
  }

  return (
    <>
      <div className={cn('flex items-center gap-2', className)}>
        {visiblePeople.length > 0 && (
          <div className="flex items-center -space-x-2">
            {visiblePeople.map((person, index) => {
              const seed = person.email || person.id || 'unknown'
              return (
                <Avatar
                  key={person.id || index}
                  className="h-8 w-8 border-2 border-background cursor-pointer hover:z-10 transition-all"
                  title={getName(person)}
                >
                  <AvatarImage src={getDiceBearAvatar(seed)} alt={getName(person)} />
                  <AvatarFallback className="text-xs">{getInitials(person)}</AvatarFallback>
                </Avatar>
              )
            })}
          </div>
        )}
        {remainingCount > 0 && (
          <div className="h-8 w-8 rounded-full border-2 border-background bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground">
            +{remainingCount}
          </div>
        )}
        <Button
          variant="outline"
          size="sm"
          className="h-8 rounded-full px-3 gap-2"
          onClick={() => setIsModalOpen(true)}
        >
          <UserPlus className="h-4 w-4" />
          <span className="text-sm">Add Assignee</span>
        </Button>
      </div>

      <PageAccessModal
        pagePath={pagePath}
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onUpdate={fetchPageAccess}
      />
    </>
  )
}