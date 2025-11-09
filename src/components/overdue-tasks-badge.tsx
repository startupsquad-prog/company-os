'use client'

import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Bell } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { TaskList } from '@/app/tasks/components/task-list'
import type { TaskFull } from '@/lib/types/tasks'
import { useRouter } from 'next/navigation'

export function OverdueTasksBadge() {
  const [count, setCount] = useState(0)
  const [tasks, setTasks] = useState<TaskFull[]>([])
  const [loading, setLoading] = useState(true)
  const [sheetOpen, setSheetOpen] = useState(false)
  const router = useRouter()

  const fetchOverdueCount = async () => {
    try {
      const supabase = createClient()
      
      // Get current user's profile ID
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setCount(0)
        setLoading(false)
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (!profile) {
        setCount(0)
        setLoading(false)
        return
      }

      // Fetch overdue count for assigned tasks
      const response = await fetch(
        `/api/tasks/overdue?assigned_to_me=true`
      )
      
      if (response.ok) {
        const data = await response.json()
        setCount(data.count || 0)
      }
    } catch (error) {
      console.error('Error fetching overdue tasks count:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchOverdueTasks = async () => {
    try {
      const supabase = createClient()
      
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (!profile) return

      const response = await fetch(
        `/api/tasks/overdue?assigned_to_me=true&include_list=true`
      )
      
      if (response.ok) {
        const data = await response.json()
        setTasks(data.tasks || [])
      }
    } catch (error) {
      console.error('Error fetching overdue tasks:', error)
    }
  }

  useEffect(() => {
    fetchOverdueCount()
    
    // Refresh count every 30 seconds
    const interval = setInterval(fetchOverdueCount, 30000)
    
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (sheetOpen) {
      fetchOverdueTasks()
    }
  }, [sheetOpen])

  if (loading || count === 0) {
    return null
  }

  return (
    <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
        >
          <Bell className="h-5 w-5" />
          <Badge
            variant="destructive"
            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
          >
            {count > 99 ? '99+' : count}
          </Badge>
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Overdue Tasks</SheetTitle>
          <SheetDescription>
            You have {count} {count === 1 ? 'task' : 'tasks'} past their due date
          </SheetDescription>
        </SheetHeader>
        <div className="mt-6">
          {tasks.length > 0 ? (
            <TaskList
              data={tasks}
              onView={(task) => {
                setSheetOpen(false)
                router.push(`/tasks?id=${task.id}`)
              }}
            />
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-sm">No overdue tasks found</p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

