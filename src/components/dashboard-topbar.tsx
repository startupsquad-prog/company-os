'use client'

import { Settings } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { NotificationsDropdown } from '@/components/notifications-dropdown'
import { SearchCommand, SearchButton } from '@/components/search-command'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ThemeToggleButton } from '@/components/theme-toggle'
import { createClient } from '@/lib/supabase/client'
import { useRole } from '@/lib/roles/use-role'
import { toast } from 'sonner'

export function DashboardTopbar() {
  const [searchOpen, setSearchOpen] = useState(false)
  const [user, setUser] = useState<{
    name: string
    email: string
    avatar: string
  } | null>(null)
  const [userLoading, setUserLoading] = useState(true)
  const router = useRouter()
  const { activeRole, roles } = useRole()

  // Keyboard shortcut handler for Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault()
        setSearchOpen(true)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Fetch user data
  useEffect(() => {
    const loadUser = async () => {
      try {
        setUserLoading(true)
        const supabase = createClient()
        const {
          data: { user: authUser },
          error: authError,
        } = await supabase.auth.getUser()

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

  const initials = user?.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'U'

  return (
    <header className="sticky top-0 z-50 flex h-16 shrink-0 items-center gap-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 isolate">
      {/* Left: Sidebar Trigger */}
      <div className="flex items-center gap-2">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
      </div>

      {/* Center: Search Bar */}
      <div className="flex-1 flex justify-center">
        <div className="w-full max-w-md">
          <SearchButton onClick={() => setSearchOpen(true)} />
        </div>
      </div>

      {/* Search Command Dialog */}
      <SearchCommand open={searchOpen} onOpenChange={setSearchOpen} />

      {/* Right: Actions & Profile */}
      <div className="flex items-center gap-2">
        <NotificationsDropdown />
        <ThemeToggleButton variant="circle" start="center" blur={true} size="icon" className="h-9 w-9" />
        <Button variant="ghost" size="icon" className="h-9 w-9">
          <Settings className="h-4 w-4" />
          <span className="sr-only">Settings</span>
        </Button>
        <Separator orientation="vertical" className="h-6" />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 w-9 rounded-full">
              {userLoading ? (
                <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
              ) : user ? (
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
              ) : (
                <Avatar className="h-8 w-8">
                  <AvatarFallback>U</AvatarFallback>
                </Avatar>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            {user ? (
              <>
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.name}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {activeRole ? activeRole.role_name : roles.length > 0 ? roles[0].role_name : 'No role'}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Profile</DropdownMenuItem>
                <DropdownMenuItem>Settings</DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            ) : (
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {userLoading ? 'Loading...' : 'User'}
                  </p>
                </div>
              </DropdownMenuLabel>
            )}
            <DropdownMenuItem onClick={handleSignOut}>Log out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}

