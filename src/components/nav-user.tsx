"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  BadgeCheck,
  Bell,
  ChevronsUpDown,
  CreditCard,
  LogOut,
  Sparkles,
  Check,
} from "lucide-react"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
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
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { useRole } from "@/lib/roles/use-role"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

export function NavUser() {
  const { isMobile } = useSidebar()
  const router = useRouter()
  const { roles, activeRole, setActiveRole, loading: roleLoading } = useRole()
  const [user, setUser] = React.useState<{
    name: string
    email: string
    avatar: string
  } | null>(null)
  const [userLoading, setUserLoading] = React.useState(true)

  // Fetch user data
  React.useEffect(() => {
    const loadUser = async () => {
      try {
        setUserLoading(true)
        const supabase = createClient()
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
        
        if (authError) {
          console.error('Error getting user:', authError)
          setUserLoading(false)
          return
        }
        
        if (authUser) {
          // Get profile
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', authUser.id)
            .single()

          if (profileError && profileError.code !== 'PGRST116') {
            console.error('Error fetching profile:', profileError)
          }

          if (profile) {
            const fullName = [profile.first_name, profile.last_name]
              .filter(Boolean)
              .join(' ') || authUser.email?.split('@')[0] || 'User'
            
            setUser({
              name: fullName,
              email: profile.email || authUser.email || '',
              avatar: profile.avatar_url || '',
            })
          } else {
            setUser({
              name: authUser.email?.split('@')[0] || 'User',
              email: authUser.email || '',
              avatar: '',
            })
          }
        } else {
          setUser(null)
        }
      } catch (error) {
        console.error('Error loading user:', error)
      } finally {
        setUserLoading(false)
      }
    }

    loadUser()
  }, [])

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    toast.success('Signed out successfully')
    router.push('/login')
  }

  if (!user || userLoading || roleLoading) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg" disabled>
            <Avatar className="h-8 w-8 rounded-lg">
              <AvatarFallback className="rounded-lg">...</AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-semibold">Loading...</span>
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    )
  }

  const initials = user.name
    .split(' ')
    .map(n => n[0])
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
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{user.name}</span>
                <span className="truncate text-xs">
                  {activeRole ? activeRole.role_name : roles.length > 0 ? roles[0].role_name : 'No role'}
                </span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{user.name}</span>
                  <span className="truncate text-xs">
                    {activeRole ? activeRole.role_name : roles.length > 0 ? roles[0].role_name : 'No role'}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">{user.email}</span>
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
                        <DropdownMenuItem
                          key={role.role_id}
                          onClick={() => setActiveRole(role)}
                        >
                          {activeRole?.role_id === role.role_id && (
                            <Check className="mr-2 h-4 w-4" />
                          )}
                          {!activeRole?.role_id && role.role_id === roles[0].role_id && (
                            <Check className="mr-2 h-4 w-4" />
                          )}
                          <span className={activeRole?.role_id === role.role_id ? 'font-semibold' : ''}>
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
            <DropdownMenuItem onClick={handleSignOut}>
              <LogOut />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
