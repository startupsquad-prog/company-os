'use client'

import * as React from 'react'
import { BadgeCheck, Bell, ChevronsUpDown, Check } from 'lucide-react'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { getDiceBearAvatar } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar'
import { useRole } from '@/lib/roles/use-role'
import { useUser, UserButton } from '@clerk/nextjs'
import { createClient } from '@/lib/supabase/client'
import { Skeleton } from '@/components/ui/skeleton'

export function NavUser() {
  const { isMobile } = useSidebar()
  const { roles, activeRole, setActiveRole, loading: roleLoading } = useRole()
  const { user: clerkUser, isLoaded: userLoaded } = useUser()
  const [profile, setProfile] = React.useState<{
    name: string
    email: string
    avatar: string
  } | null>(null)
  const [profileLoading, setProfileLoading] = React.useState(true)

  // Fetch profile data from Supabase
  React.useEffect(() => {
    const loadProfile = async () => {
      if (!clerkUser || !userLoaded) {
        setProfileLoading(false)
        return
      }

      try {
        setProfileLoading(true)
        const supabase = createClient()

        // Get profile
        const { data: profileData, error: profileError } = await (supabase as any)
          .from('profiles')
          .select('*')
          .eq('user_id', clerkUser.id)
          .single()

        if (profileError && profileError.code !== 'PGRST116') {
          console.error('Error fetching profile:', profileError)
        }

        const profileTyped = profileData as any

        if (profileTyped) {
          const fullName =
            [profileTyped.first_name, profileTyped.last_name].filter(Boolean).join(' ') ||
            clerkUser.emailAddresses[0]?.emailAddress?.split('@')[0] ||
            'User'

          const avatarSeed = profileTyped.email || clerkUser.emailAddresses[0]?.emailAddress || clerkUser.id || 'default'
          setProfile({
            name: fullName,
            email: profileTyped.email || clerkUser.emailAddresses[0]?.emailAddress || '',
            avatar: getDiceBearAvatar(avatarSeed),
          })
        } else {
          // Fallback to Clerk user data
          const email = clerkUser.emailAddresses[0]?.emailAddress || ''
          const avatarSeed = email || clerkUser.id || 'default'
          setProfile({
            name: clerkUser.fullName || clerkUser.firstName || email.split('@')[0] || 'User',
            email,
            avatar: getDiceBearAvatar(avatarSeed),
          })
        }
      } catch (error) {
        console.error('Error loading profile:', error)
        // Fallback to Clerk user data
        const email = clerkUser.emailAddresses[0]?.emailAddress || ''
        const avatarSeed = email || clerkUser.id || 'default'
        setProfile({
          name: clerkUser.fullName || clerkUser.firstName || email.split('@')[0] || 'User',
          email,
          avatar: getDiceBearAvatar(avatarSeed),
        })
      } finally {
        setProfileLoading(false)
      }
    }

    loadProfile()
  }, [clerkUser, userLoaded])

  if (!clerkUser || !userLoaded || !profile || profileLoading || roleLoading) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg" disabled>
            <Avatar className="h-8 w-8 rounded-lg">
              <AvatarFallback className="rounded-lg">
                <Skeleton className="h-full w-full rounded-lg" />
              </AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-16 mt-1" />
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    )
  }

  const initials =
    profile.name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'U'

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage src={profile.avatar} alt={profile.name} />
                <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{profile.name}</span>
                <span className="truncate text-xs">
                  {activeRole
                    ? activeRole.role_name
                    : roles.length > 0
                      ? roles[0].role_name
                      : 'No role'}
                </span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            side={isMobile ? 'bottom' : 'right'}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={profile.avatar} alt={profile.name} />
                  <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{profile.name}</span>
                  <span className="truncate text-xs">
                    {activeRole
                      ? activeRole.role_name
                      : roles.length > 0
                        ? roles[0].role_name
                        : 'No role'}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">{profile.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />

            {/* Role Switcher - only show if multiple roles */}
            {roles.length > 1 && (
              <>
                <DropdownMenuGroup>
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                      <BadgeCheck />
                      Switch Role
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                      {roles.map((role) => (
                        <DropdownMenuItem key={role.role_id} onClick={() => setActiveRole(role)}>
                          {activeRole?.role_id === role.role_id && (
                            <Check className="mr-2 h-4 w-4" />
                          )}
                          {!activeRole?.role_id && role.role_id === roles[0].role_id && (
                            <Check className="mr-2 h-4 w-4" />
                          )}
                          <span
                            className={activeRole?.role_id === role.role_id ? 'font-semibold' : ''}
                          >
                            {role.role_name}
                          </span>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
              </>
            )}

            <DropdownMenuGroup>
              <DropdownMenuItem>
                <BadgeCheck />
                Account
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Bell />
                Notifications
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <div className="px-2 py-1.5">
              <UserButton afterSignOutUrl="/login" />
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
