"use client"

import { useState, useEffect, useCallback, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { DataTable } from "@/components/data-table/data-table"
import { TaskKanban } from "./components/task-kanban"
import { TaskKanbanSkeleton } from "./components/task-kanban-skeleton"
import { TaskTableSkeleton } from "./components/task-table-skeleton"
import { TaskList } from "./components/task-list"
import { TaskDetailsModal } from "./components/task-details-modal"
import { TaskForm } from "./components/task-form"
import { TaskTabs } from "./components/task-tabs"
import { createTaskColumns } from "./components/task-columns"
import { useUserRole } from "@/lib/hooks/useUserRole"
import { createClient } from "@/lib/supabase/client"
import type { TaskFull, TaskFormData } from "@/lib/types/tasks"
import type { SortingState, ColumnFiltersState } from "@tanstack/react-table"
import { toast } from "sonner"
import { Plus } from "lucide-react"
import { calculateUrgencyTag } from "@/lib/utils/task-utils"

function TasksPageContent() {
  const searchParams = useSearchParams()
  const { role, isLoading: roleLoading } = useUserRole()
  const [tasks, setTasks] = useState<TaskFull[]>([])
  const [loading, setLoading] = useState(true)
  const [initialLoading, setInitialLoading] = useState(true)
  const [view, setView] = useState<"table" | "list" | "kanban">("kanban")
  const [selectedTask, setSelectedTask] = useState<TaskFull | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<TaskFull | null>(null)
  const [defaultStatus, setDefaultStatus] = useState<string | undefined>(undefined)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [pageCount, setPageCount] = useState(0)
  const [sorting, setSorting] = useState<SortingState>([])
  const [filters, setFilters] = useState<ColumnFiltersState>([])
  const [search, setSearch] = useState("")

  // Set default view based on role
  useEffect(() => {
    if (role === "employee" || role === "superadmin") {
      setView("kanban")
    } else {
      setView("table")
    }
  }, [role])

  // Fetch tasks
  const fetchTasks = useCallback(async () => {
    if (roleLoading || !role) return

    try {
      setLoading(true)
      
      // Check for missing environment variables
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        console.warn('Supabase environment variables not set')
        setTasks([])
        setInitialLoading(false)
        setLoading(false)
        return
      }

      const supabase = createClient()
      
      // Build filter based on role and search params
      const filter: any = {}
      const filterParam = searchParams.get("filter")
      
      if (filterParam === "my") {
        // Get current user's profile ID
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("id")
            .eq("user_id", user.id)
            .single()
          if (profile) {
            filter.assigned_to = (profile as any).id
          }
        }
      } else if (filterParam === "department" && (role === "manager" || role === "admin" || role === "superadmin")) {
        // Get user's department
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("department_id")
            .eq("user_id", user.id)
            .single()
          if (profile?.department_id) {
            filter.department_id = profile.department_id
          }
        }
      }

      // Apply search
      if (search) {
        // Note: Full-text search would require a different approach
        // For now, we'll filter client-side
      }

      // Fetch tasks using public schema views
      const { data: tasksData, error } = await supabase
        .from("tasks")
        .select(`
          *,
          department:departments!tasks_department_id_fkey(*),
          created_by_profile:profiles!tasks_created_by_fkey(*),
          updated_by_profile:profiles!tasks_updated_by_fkey(*)
        `)
        .is("deleted_at", null)
        .order("created_at", { ascending: false })

      if (error) throw error

      // Fetch assignees for each task
      const tasksWithAssignees = await Promise.all(
        (tasksData || []).map(async (task: any) => {
          const { data: assignees } = await supabase
            .from("task_assignees")
            .select(`
              *,
              profile:profiles!task_assignees_profile_id_fkey(*)
            `)
            .eq("task_id", task.id)

          return {
            ...task,
            assignees: assignees || [],
          } as TaskFull
        })
      )

      // Apply client-side filters
      let filteredTasks = tasksWithAssignees
      if (filter.assigned_to) {
        filteredTasks = filteredTasks.filter((task) =>
          task.assignees.some((a) => a.profile_id === filter.assigned_to)
        )
      }
      if (filter.department_id) {
        filteredTasks = filteredTasks.filter((task) => task.department_id === filter.department_id)
      }
      if (search) {
        filteredTasks = filteredTasks.filter((task) =>
          task.title.toLowerCase().includes(search.toLowerCase()) ||
          task.description?.toLowerCase().includes(search.toLowerCase())
        )
      }

      setTasks(filteredTasks)
      setPageCount(Math.ceil(filteredTasks.length / pageSize))
      setInitialLoading(false)
    } catch (error) {
      console.error("Error fetching tasks:", error)
      // Log more details about the error
      if (error && typeof error === 'object') {
        console.error("Error details:", JSON.stringify(error, null, 2))
      }
      // Don't show toast if it's an auth error - user might not be logged in
      const errorMessage = error instanceof Error ? error.message : String(error)
      if (!errorMessage.includes('auth') && !errorMessage.includes('JWT')) {
        toast.error("Failed to load tasks")
      }
      // Set empty tasks array to prevent crashes
      setTasks([])
      setPageCount(0)
      setInitialLoading(false)
    } finally {
      setLoading(false)
    }
  }, [role, roleLoading, searchParams, search, pageSize])

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  // Handle task query parameter to open modal
  useEffect(() => {
    const taskId = searchParams.get('task')
    if (!taskId || loading || initialLoading) return

    // First, try to find the task in the loaded tasks
    const task = tasks.find((t) => t.id === taskId)
    if (task) {
      setSelectedTask(task)
      setDrawerOpen(true)
      // Clean up URL parameter after opening modal
      const url = new URL(window.location.href)
      url.searchParams.delete('task')
      window.history.replaceState({}, '', url.toString())
      return
    }

    // Task not in current list, fetch it directly
    const fetchTaskById = async () => {
      try {
        const supabase = createClient()
        const { data: taskData, error } = await supabase
          .from("tasks")
          .select(`
            *,
            department:departments!tasks_department_id_fkey(*),
            created_by_profile:profiles!tasks_created_by_fkey(*),
            updated_by_profile:profiles!tasks_updated_by_fkey(*)
          `)
          .eq("id", taskId)
          .is("deleted_at", null)
          .single()

        if (error) throw error

        if (taskData) {
          // Fetch assignees for the task
          const { data: assignees } = await supabase
            .from("task_assignees")
            .select(`
              *,
              profile:profiles!task_assignees_profile_id_fkey(*)
            `)
            .eq("task_id", taskData.id)

          const taskWithAssignees = {
            ...taskData,
            assignees: assignees || [],
          } as TaskFull

          setSelectedTask(taskWithAssignees)
          setDrawerOpen(true)
          // Clean up URL parameter after opening modal
          const url = new URL(window.location.href)
          url.searchParams.delete('task')
          window.history.replaceState({}, '', url.toString())
        }
      } catch (error) {
        console.error("Error fetching task:", error)
        toast.error("Task not found")
        // Clean up URL parameter on error
        const url = new URL(window.location.href)
        url.searchParams.delete('task')
        window.history.replaceState({}, '', url.toString())
      }
    }
    fetchTaskById()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.toString(), tasks.length, loading, initialLoading])

  // Get enum options
  const [statusOptions, setStatusOptions] = useState<{ label: string; value: string }[]>([])
  const [priorityOptions, setPriorityOptions] = useState<{ label: string; value: string }[]>([])
  const [departmentOptions, setDepartmentOptions] = useState<{ label: string; value: string }[]>([])

  useEffect(() => {
    async function fetchOptions() {
      try {
        // Check for missing environment variables
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
          console.warn('Supabase environment variables not set, using default options')
          // Set default options
          setStatusOptions([
            { label: "Pending", value: "pending" },
            { label: "In Progress", value: "in_progress" },
            { label: "Completed", value: "completed" },
            { label: "Cancelled", value: "cancelled" },
          ])
          setPriorityOptions([
            { label: "Low", value: "low" },
            { label: "Medium", value: "medium" },
            { label: "High", value: "high" },
            { label: "Urgent", value: "urgent" },
          ])
          return
        }

        const supabase = createClient()
        
        // Fetch status and priority from enum_registry
        const { data: enums, error: enumsError } = await supabase
          .from("enum_registry")
          .select("*")
          .in("category", ["task_status", "task_priority"])
          .order("order_no")

        if (enumsError) {
          console.error("Error fetching enums:", enumsError)
          // Log more details about the error
          if (enumsError && typeof enumsError === 'object') {
            console.error("Enum error details:", JSON.stringify(enumsError, null, 2))
          }
          // Use default options on error
          setStatusOptions([
            { label: "Pending", value: "pending" },
            { label: "In Progress", value: "in_progress" },
            { label: "Completed", value: "completed" },
            { label: "Cancelled", value: "cancelled" },
          ])
          setPriorityOptions([
            { label: "Low", value: "low" },
            { label: "Medium", value: "medium" },
            { label: "High", value: "high" },
            { label: "Urgent", value: "urgent" },
          ])
        } else if (enums) {
          const status = enums
            .filter((e) => e.category === "task_status")
            .map((e) => ({ label: e.label, value: e.key }))
          const priority = enums
            .filter((e) => e.category === "task_priority")
            .map((e) => ({ label: e.label, value: e.key }))
          
          setStatusOptions(status)
          setPriorityOptions(priority)
        }

        // Fetch departments
        const { data: departments, error: deptError } = await supabase
          .from("departments")
          .select("id, name")
          .is("deleted_at", null)
          .order("name")

        if (deptError) {
          console.error("Error fetching departments:", deptError)
          // Log more details about the error
          if (deptError && typeof deptError === 'object') {
            console.error("Department error details:", JSON.stringify(deptError, null, 2))
          }
          // Set empty departments on error
          setDepartmentOptions([])
        } else if (departments) {
          setDepartmentOptions(departments.map((d) => ({ label: d.name, value: d.id })))
        }
      } catch (error) {
        console.error("Error in fetchOptions:", error)
        // Set defaults on any error
        setStatusOptions([
          { label: "Pending", value: "pending" },
          { label: "In Progress", value: "in_progress" },
          { label: "Completed", value: "completed" },
          { label: "Cancelled", value: "cancelled" },
        ])
        setPriorityOptions([
          { label: "Low", value: "low" },
          { label: "Medium", value: "medium" },
          { label: "High", value: "high" },
          { label: "Urgent", value: "urgent" },
        ])
        setDepartmentOptions([])
      }
    }

    fetchOptions()
  }, [])

  const handleStatusChange = async (taskId: string, newStatus: string, newPosition?: number) => {
    try {
      // Check for missing environment variables
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        toast.error("Supabase not configured")
        return
      }

      const supabase = createClient()
      
      // Get the current task to find old status
      const { data: currentTask } = await supabase
        .from("tasks")
        .select("status, position")
        .eq("id", taskId)
        .single()

      if (!currentTask) {
        throw new Error("Task not found")
      }

      const oldStatus = currentTask.status
      const oldPosition = currentTask.position ?? 0

      // Calculate new position if not provided
      let calculatedPosition = newPosition
      if (calculatedPosition === undefined) {
        const { data: maxPosData } = await supabase
          .from("tasks")
          .select("position")
          .eq("status", newStatus)
          .is("deleted_at", null)
          .order("position", { ascending: false })
          .limit(1)
          .single()
        
        calculatedPosition = maxPosData?.position !== undefined ? (maxPosData.position + 1) : 0
      }

      // If moving to a different status, we need to:
      // 1. Reorder positions in the old column (decrement tasks after old position)
      // 2. Reorder positions in the new column (increment tasks at/after new position)
      // 3. Update the moved task's status and position

      const updates: Promise<any>[] = []

      if (oldStatus !== newStatus) {
        // Reorder old column: decrement positions of tasks after the moved task
        const { data: oldColumnTasks } = await supabase
          .from("tasks")
          .select("id, position")
          .eq("status", oldStatus)
          .is("deleted_at", null)
          .neq("id", taskId)

        if (oldColumnTasks) {
          oldColumnTasks.forEach(task => {
            const taskPos = task.position ?? 0
            if (taskPos > oldPosition) {
              updates.push(
                supabase
                  .from("tasks")
                  .update({ position: taskPos - 1 })
                  .eq("id", task.id)
              )
            }
          })
        }

        // Reorder new column: increment positions of tasks at/after new position
        const { data: newColumnTasks } = await supabase
          .from("tasks")
          .select("id, position")
          .eq("status", newStatus)
          .is("deleted_at", null)
          .neq("id", taskId)

        if (newColumnTasks) {
          newColumnTasks.forEach(task => {
            const taskPos = task.position ?? 0
            if (taskPos >= calculatedPosition) {
              updates.push(
                supabase
                  .from("tasks")
                  .update({ position: taskPos + 1 })
                  .eq("id", task.id)
              )
            }
          })
        }
      }

      // Update the moved task
      updates.push(
        supabase
          .from("tasks")
          .update({ status: newStatus, position: calculatedPosition })
          .eq("id", taskId)
      )

      await Promise.all(updates)

      // Update local state
      setTasks((prev) =>
        prev.map((task) =>
          task.id === taskId ? { ...task, status: newStatus, position: calculatedPosition } as TaskFull : task
        )
      )

      // Don't refresh immediately - let optimistic update stay
      // fetchTasks() will be called when component re-renders or user navigates
    } catch (error) {
      console.error("Error updating status:", error)
      toast.error("Failed to update task status")
      throw error
    }
  }

  const handlePositionChange = async (taskId: string, newPosition: number, status: string) => {
    try {
      const supabase = createClient()
      
      // Get all tasks in this status, sorted by position
      const { data: tasksInStatus } = await supabase
        .from("tasks")
        .select("id, position")
        .eq("status", status)
        .is("deleted_at", null)
        .order("position", { ascending: true })

      if (!tasksInStatus) return

      // Find the task being moved
      const taskToMove = tasksInStatus.find(t => t.id === taskId)
      if (!taskToMove) return

      const oldPosition = taskToMove.position ?? 0

      // Reorder positions
      const updatedTasks = tasksInStatus
        .filter(t => t.id !== taskId)
        .map((task, idx) => ({
          ...task,
          position: idx >= newPosition ? idx + 1 : idx
        }))

      // Update all affected tasks
      const updates = updatedTasks.map(task => 
        supabase
          .from("tasks")
          .update({ position: task.position })
          .eq("id", task.id)
      )

      // Update the moved task
      updates.push(
        supabase
          .from("tasks")
          .update({ position: newPosition })
          .eq("id", taskId)
      )

      await Promise.all(updates)

      // Refresh tasks
      fetchTasks()
    } catch (error) {
      console.error("Error updating position:", error)
      toast.error("Failed to update task position")
      throw error
    }
  }

  const handleSubmitTask = async (data: TaskFormData) => {
    try {
      // Check for missing environment variables
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        toast.error("Supabase not configured")
        return
      }

      const supabase = createClient()
      
      if (editingTask) {
        // Update existing task
        const { error } = await supabase
          .from("tasks")
          .update({
            title: data.title,
            description: data.description,
            priority: data.priority,
            status: data.status,
            department_id: data.department_id,
            vertical_key: data.vertical_key,
            due_date: data.due_date?.toISOString(),
            estimated_duration: data.estimated_duration,
            important_links: data.important_links || [],
          })
          .eq("id", editingTask.id)

        if (error) throw error

        // Update assignees
        if (data.assignees) {
          // Delete existing assignees
          await supabase
            .from("task_assignees")
            .delete()
            .eq("task_id", editingTask.id)

          // Insert new assignees
          if (data.assignees.length > 0) {
            const { error: assigneeError } = await supabase
              .from("task_assignees")
              .insert(
                data.assignees.map(a => ({
                  task_id: editingTask.id,
                  profile_id: a.profile_id,
                  role: a.role,
                }))
              )

            if (assigneeError) throw assigneeError
          }
        }

        toast.success("Task updated")
      } else {
        // Create new task
        // First check session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError || !session) {
          // Try getUser as fallback
          const { data: { user }, error: userError } = await supabase.auth.getUser()
          if (userError || !user) {
            console.error("Authentication error:", sessionError || userError)
            toast.error("Please log in to create tasks")
            throw new Error("Not authenticated")
          }
          
          // Use user from getUser
          const { data: profile } = await supabase
            .from("profiles")
            .select("id")
            .eq("user_id", user.id)
            .single()

          if (!profile) {
            toast.error("User profile not found")
            throw new Error("Profile not found")
          }

          // Continue with profile
          const { data: newTask, error } = await supabase
            .from("tasks")
            .insert({
              title: data.title,
              description: data.description,
              priority: data.priority,
              status: data.status || "pending",
              department_id: data.department_id,
              vertical_key: data.vertical_key,
              due_date: data.due_date?.toISOString(),
              created_by: profile.id,
              updated_by: profile.id,
            })
            .select()
            .single()

          if (error) throw error

          // Add assignees
          if (newTask && data.assignees && data.assignees.length > 0) {
            const { error: assigneeError } = await supabase
              .from("task_assignees")
              .insert(
                data.assignees.map(a => ({
                  task_id: newTask.id,
                  profile_id: a.profile_id,
                  role: a.role,
                }))
              )

            if (assigneeError) throw assigneeError
          }

          toast.success("Task created")
          setFormOpen(false)
          setEditingTask(null)
          fetchTasks()
          return
        }

        // Use session user
        const user = session.user
        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .eq("user_id", user.id)
          .single()

        if (!profile) {
          toast.error("User profile not found")
          throw new Error("Profile not found")
        }

        const { data: newTask, error } = await supabase
          .from("tasks")
          .insert({
            title: data.title,
            description: data.description,
            priority: data.priority,
            status: data.status || "pending",
            department_id: data.department_id,
            vertical_key: data.vertical_key,
            due_date: data.due_date?.toISOString(),
            estimated_duration: data.estimated_duration,
            important_links: data.important_links || [],
            created_by: profile.id,
            updated_by: profile.id,
          })
          .select()
          .single()

        if (error) throw error

        // Add assignees
        if (newTask && data.assignees && data.assignees.length > 0) {
          const { error: assigneeError } = await supabase
            .from("task_assignees")
            .insert(
              data.assignees.map(a => ({
                task_id: newTask.id,
                profile_id: a.profile_id,
                role: a.role,
              }))
            )

          if (assigneeError) throw assigneeError
        }

        toast.success("Task created")
      }

      setFormOpen(false)
      setEditingTask(null)
      fetchTasks()
    } catch (error) {
      console.error("Error saving task:", error)
      toast.error(editingTask ? "Failed to update task" : "Failed to create task")
      throw error
    }
  }

  const handleDeleteTask = async (task: TaskFull) => {
    if (!confirm("Are you sure you want to delete this task?")) return

    try {
      // Check for missing environment variables
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        toast.error("Supabase not configured")
        return
      }

      const supabase = createClient()
      const { error } = await supabase
        .from("tasks")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", task.id)

      if (error) throw error

      toast.success("Task deleted")
      fetchTasks()
    } catch (error) {
      console.error("Error deleting task:", error)
      toast.error("Failed to delete task")
    }
  }

  const columns = createTaskColumns(
    (task) => {
      setSelectedTask(task)
      setDrawerOpen(true)
    },
    (task) => {
      setEditingTask(task)
      setFormOpen(true)
    },
    handleDeleteTask
  )

  const urgencyOptions = [
    { label: "Overdue", value: "overdue" },
    { label: "Expiring Soon", value: "expiring_soon" },
  ]

  const filterConfig = [
    {
      columnId: "urgency_tag",
      title: "Urgency",
      options: urgencyOptions,
    },
    {
      columnId: "status",
      title: "Status",
      options: statusOptions,
    },
    {
      columnId: "priority",
      title: "Priority",
      options: priorityOptions,
    },
    // Limited to 3 filters to maintain proper alignment
  ]

  const renderCustomView = (viewType: string, data: TaskFull[]) => {
    if (viewType === "kanban") {
      // Apply filters to data for kanban
      let filteredData = data
      if (filters.length > 0) {
        filteredData = data.filter(task => {
          return filters.every(filter => {
            if (filter.id === "priority" && filter.value) {
              const values = Array.isArray(filter.value) ? filter.value : [filter.value]
              return values.includes(task.priority || "")
            }
            if (filter.id === "department" && filter.value) {
              const values = Array.isArray(filter.value) ? filter.value : [filter.value]
              return values.includes(task.department_id || "")
            }
            if (filter.id === "urgency_tag" && filter.value) {
              const values = Array.isArray(filter.value) ? filter.value : [filter.value]
              // Calculate urgency tag for this task
              const tag = task.urgency_tag || calculateUrgencyTag(task)
              return values.includes(tag || "")
            }
            return true
          })
        })
      }
      if (search) {
        filteredData = filteredData.filter(task =>
          task.title.toLowerCase().includes(search.toLowerCase()) ||
          task.description?.toLowerCase().includes(search.toLowerCase())
        )
      }

      return (
        <div className="flex flex-col gap-4 flex-1 min-w-0 h-full overflow-hidden">
          {/* Kanban Board */}
          <div className="flex-1 rounded-md border overflow-hidden min-w-0 h-full flex flex-col">
            {initialLoading ? (
              <TaskKanbanSkeleton />
            ) : (
              <div className="flex-1 overflow-hidden min-w-0">
                <TaskKanban
                  data={filteredData}
                  statusOptions={statusOptions}
                  onEdit={(task) => {
                    setEditingTask(task)
                    setDefaultStatus(undefined)
                    setFormOpen(true)
                  }}
                  onDelete={handleDeleteTask}
                  onView={(task) => {
                    setSelectedTask(task)
                    setDrawerOpen(true)
                  }}
                  onStatusChange={handleStatusChange}
                  onPositionChange={handlePositionChange}
                  onAdd={(status) => {
                    setEditingTask(null)
                    setDefaultStatus(status)
                    setFormOpen(true)
                  }}
                />
              </div>
            )}
          </div>
        </div>
      )
    }
    if (viewType === "list") {
      return (
        <div className="flex-1 flex flex-col rounded-md border overflow-hidden min-h-0">
          <TaskList
            data={data}
            onEdit={(task) => {
              setEditingTask(task)
              setFormOpen(true)
            }}
            onDelete={handleDeleteTask}
            onView={(task) => {
              setSelectedTask(task)
              setDrawerOpen(true)
            }}
          />
        </div>
      )
    }
    return null
  }

  if (roleLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tasks</h1>
          <p className="text-muted-foreground">
            Manage and track your tasks
          </p>
        </div>
      </div>

      {role === "employee" || role === "superadmin" ? (
            // Employee/Superadmin view: Kanban by default
            <DataTable
              columns={columns}
              data={tasks}
              pageCount={pageCount}
              onPaginationChange={(p, s) => {
                setPage(p)
                setPageSize(s)
              }}
              onSortingChange={setSorting}
              onFilterChange={setFilters}
              onSearchChange={setSearch}
              loading={loading}
              initialLoading={initialLoading}
              view={view}
              onViewChange={(v) => setView(v as "table" | "list" | "kanban")}
              onAdd={() => {
                setEditingTask(null)
                setDefaultStatus(undefined)
                setFormOpen(true)
              }}
              onEdit={(task) => {
                setEditingTask(task)
                setFormOpen(true)
              }}
              onDelete={handleDeleteTask}
              onView={(task) => {
                setSelectedTask(task)
                setDrawerOpen(true)
              }}
              filterConfig={filterConfig}
              searchPlaceholder="Search tasks..."
              addButtonText="Create Task"
              addButtonIcon={<Plus className="mr-2 h-4 w-4" />}
              renderCustomView={renderCustomView}
            />
          ) : (
            // Manager/Admin view: Tabs with Kanban and Table
            <TaskTabs
              role={role || "employee"}
              defaultView="table"
              columns={columns}
              data={tasks}
              pageCount={pageCount}
              onPaginationChange={(p, s) => {
                setPage(p)
                setPageSize(s)
              }}
              onSortingChange={setSorting}
              onFilterChange={setFilters}
              onSearchChange={setSearch}
              loading={loading}
              initialLoading={initialLoading}
              onAdd={() => {
                setEditingTask(null)
                setDefaultStatus(undefined)
                setFormOpen(true)
              }}
              onEdit={(task) => {
                setEditingTask(task)
                setDefaultStatus(undefined)
                setFormOpen(true)
              }}
              onDelete={handleDeleteTask}
              onView={(task) => {
                setSelectedTask(task)
                setDrawerOpen(true)
              }}
              onStatusChange={handleStatusChange}
              statusOptions={statusOptions}
              filterConfig={filterConfig}
              searchPlaceholder="Search tasks..."
              addButtonText="Create Task"
              addButtonIcon={<Plus className="mr-2 h-4 w-4" />}
            />
          )}

          <TaskDetailsModal
            task={selectedTask}
            open={drawerOpen}
            onOpenChange={setDrawerOpen}
            onEdit={(task) => {
              setEditingTask(task)
              setDrawerOpen(false)
              setFormOpen(true)
            }}
            onDelete={handleDeleteTask}
            allTasks={tasks}
            onTaskChange={(newTask) => {
              setSelectedTask(newTask)
            }}
          />

          <TaskForm
            task={editingTask}
            open={formOpen}
            defaultStatus={defaultStatus}
            onOpenChange={(open) => {
              setFormOpen(open)
              if (!open) {
                setEditingTask(null)
                setDefaultStatus(undefined)
              }
            }}
            onSubmit={handleSubmitTask}
            statusOptions={statusOptions}
            priorityOptions={priorityOptions}
            departmentOptions={departmentOptions}
          />
    </>
  )
}

export default function TasksPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-screen">
        <p>Loading...</p>
      </div>
    }>
      <TasksPageContent />
    </Suspense>
  )
}
