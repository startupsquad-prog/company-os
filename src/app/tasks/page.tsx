'use client'

import { useState, useEffect, useCallback, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { DataTable } from '@/components/data-table/data-table'
import { TaskKanban } from './components/task-kanban'
import { TaskKanbanSkeleton } from './components/task-kanban-skeleton'
import { TaskTableSkeleton } from './components/task-table-skeleton'
import { TaskList } from './components/task-list'
import { TaskDetailsModal } from './components/task-details-modal'
import { TaskForm } from './components/task-form'
import { TaskFormMultiStep } from './components/task-form-multistep'
import { TaskTabs } from './components/task-tabs'
import { createTaskColumns } from './components/task-columns'
import { useUserRole } from '@/lib/hooks/useUserRole'
import { createClient } from '@/lib/supabase/client'
import type { TaskFull, TaskFormData } from '@/lib/types/tasks'
import type { SortingState, ColumnFiltersState } from '@tanstack/react-table'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'
import { calculateUrgencyTag } from '@/lib/utils/task-utils'
import { useUser } from '@clerk/nextjs'
import { useVerticalScope } from '@/lib/state/use-vertical-scope'
import { PageLoader } from '@/components/ui/loader'

function TasksPageContent() {
  const searchParams = useSearchParams()
  const { verticalScope } = useVerticalScope()
  const { role, isLoading: roleLoading } = useUserRole()
  const { user: clerkUser } = useUser()
  const [tasks, setTasks] = useState<TaskFull[]>([])
  const [loading, setLoading] = useState(true)
  const [initialLoading, setInitialLoading] = useState(true)
  const [view, setView] = useState<'table' | 'list' | 'kanban'>('kanban')
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
  const [search, setSearch] = useState('')
  const fetchingRef = useRef(false)

  // Set default view based on role
  useEffect(() => {
    if (role === 'employee' || role === 'superadmin') {
      setView('kanban')
    } else {
      setView('table')
    }
  }, [role])

  // Fetch tasks
  const fetchTasks = useCallback(async () => {
    if (roleLoading || !role) return
    
    // Prevent duplicate concurrent requests
    if (fetchingRef.current) {
      console.log('⏭️ [Tasks] Skipping duplicate fetch request')
      return
    }
    
    fetchingRef.current = true

    try {
      setLoading(true)
      const isKanbanView = view === 'kanban'

      // Build query parameters
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
        view: view,
        ...(search ? { search } : {}),
        ...(verticalScope && verticalScope !== 'all' ? { verticalId: verticalScope } : {}),
      })

      // Add status filter
      const statusFilter = filters.find((f) => f.id === 'status')
      if (statusFilter && statusFilter.value) {
        const values = Array.isArray(statusFilter.value) ? statusFilter.value : [statusFilter.value]
        params.append('status', values.join(','))
      }

      // Add priority filter
      const priorityFilter = filters.find((f) => f.id === 'priority')
      if (priorityFilter && priorityFilter.value) {
        const values = Array.isArray(priorityFilter.value) ? priorityFilter.value : [priorityFilter.value]
        params.append('priority', values.join(','))
      }

      // Add department filter
      const departmentFilter = filters.find((f) => f.id === 'department')
      if (departmentFilter && departmentFilter.value) {
        const values = Array.isArray(departmentFilter.value) ? departmentFilter.value : [departmentFilter.value]
        if (values.length > 0) {
          params.append('department_id', values[0])
        }
      }

      // Add sorting
      if (sorting.length > 0) {
        params.append('sortField', sorting[0].id || 'created_at')
        params.append('sortDirection', sorting[0].desc ? 'desc' : 'asc')
      }

      // Fetch from unified API
      const response = await fetch(`/api/unified/tasks?${params.toString()}`)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to fetch tasks')
      }

      const result = await response.json()

      // Apply client-side filters (urgency_tag is computed)
      let filteredTasks = result.data || []
      
      // Calculate urgency tag for each task
      filteredTasks = filteredTasks.map((task: any) => ({
        ...task,
        urgency_tag: calculateUrgencyTag(task),
      }))

      // Apply urgency_tag filter client-side
      const urgencyFilter = filters.find((f) => f.id === 'urgency_tag')
      if (urgencyFilter && urgencyFilter.value) {
        const values = Array.isArray(urgencyFilter.value) ? urgencyFilter.value : [urgencyFilter.value]
        filteredTasks = filteredTasks.filter((task: any) => values.includes(task.urgency_tag || ''))
      }

      setTasks(filteredTasks)
      
      // Set page count
      if (!isKanbanView) {
        setPageCount(result.totalPages || 1)
      } else {
        setPageCount(1)
      }
      setInitialLoading(false)
    } catch (error) {
      console.error('Error fetching tasks:', error)
      toast.error('Failed to load tasks')
      setTasks([])
      setPageCount(0)
      setInitialLoading(false)
    } finally {
      setLoading(false)
      fetchingRef.current = false
    }
  }, [role, roleLoading, searchParams, search, page, pageSize, sorting, filters, view, verticalScope])

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
        const response = await fetch(`/api/unified/tasks/${taskId}`)

        if (!response.ok) {
          throw new Error('Task not found')
        }

        const result = await response.json()
        if (result.data) {
          setSelectedTask(result.data as TaskFull)
          setDrawerOpen(true)
          // Clean up URL parameter after opening modal
          const url = new URL(window.location.href)
          url.searchParams.delete('task')
          window.history.replaceState({}, '', url.toString())
        }
      } catch (error) {
        console.error('Error fetching task:', error)
        toast.error('Task not found')
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
            { label: 'Pending', value: 'pending' },
            { label: 'In Progress', value: 'in_progress' },
            { label: 'Completed', value: 'completed' },
            { label: 'Cancelled', value: 'cancelled' },
          ])
          setPriorityOptions([
            { label: 'Low', value: 'low' },
            { label: 'Medium', value: 'medium' },
            { label: 'High', value: 'high' },
            { label: 'Urgent', value: 'urgent' },
          ])
          return
        }

        const supabase = createClient()

        // Fetch status and priority from enum_registry
        const { data: enums, error: enumsError } = await (supabase as any)
          .from('enum_registry')
          .select('*')
          .in('category', ['task_status', 'task_priority'])
          .order('order_no')

        if (enumsError) {
          console.error('Error fetching enums:', enumsError)
          // Log more details about the error
          if (enumsError && typeof enumsError === 'object') {
            console.error('Enum error details:', JSON.stringify(enumsError, null, 2))
          }
          // Use default options on error
          setStatusOptions([
            { label: 'Pending', value: 'pending' },
            { label: 'In Progress', value: 'in_progress' },
            { label: 'Completed', value: 'completed' },
            { label: 'Cancelled', value: 'cancelled' },
          ])
          setPriorityOptions([
            { label: 'Low', value: 'low' },
            { label: 'Medium', value: 'medium' },
            { label: 'High', value: 'high' },
            { label: 'Urgent', value: 'urgent' },
          ])
        } else if (enums) {
          const enumsTyped = enums as any[]
          const status = enumsTyped
            .filter((e) => e.category === 'task_status')
            .map((e) => ({ label: e.label, value: e.key }))
          const priority = enumsTyped
            .filter((e) => e.category === 'task_priority')
            .map((e) => ({ label: e.label, value: e.key }))

          setStatusOptions(status)
          setPriorityOptions(priority)
        }

        // Fetch departments
        const { data: departments, error: deptError } = await (supabase as any)
          .from('departments')
          .select('id, name')
          .is('deleted_at', null)
          .order('name')

        if (deptError) {
          console.error('Error fetching departments:', deptError)
          // Log more details about the error
          if (deptError && typeof deptError === 'object') {
            console.error('Department error details:', JSON.stringify(deptError, null, 2))
          }
          // Set empty departments on error
          setDepartmentOptions([])
        } else if (departments) {
          const departmentsTyped = departments as any[]
          setDepartmentOptions(departmentsTyped.map((d) => ({ label: d.name, value: d.id })))
        }
      } catch (error) {
        console.error('Error in fetchOptions:', error)
        // Set defaults on any error
        setStatusOptions([
          { label: 'Pending', value: 'pending' },
          { label: 'In Progress', value: 'in_progress' },
          { label: 'Completed', value: 'completed' },
          { label: 'Cancelled', value: 'cancelled' },
        ])
        setPriorityOptions([
          { label: 'Low', value: 'low' },
          { label: 'Medium', value: 'medium' },
          { label: 'High', value: 'high' },
          { label: 'Urgent', value: 'urgent' },
        ])
        setDepartmentOptions([])
      }
    }

    fetchOptions()
  }, [])

  const handleStatusChange = async (taskId: string, newStatus: string, newPosition?: number) => {
    try {
      // Update task status and position via unified API
      const response = await fetch(`/api/unified/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          position: newPosition,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to update task status')
      }

      // Update local state optimistically
      setTasks((prev) =>
        prev.map((task) =>
          task.id === taskId
            ? ({ ...task, status: newStatus, position: newPosition ?? (task as any).position } as TaskFull)
            : task
        )
      )

      // Refresh to get latest data
      fetchTasks()
    } catch (error) {
      console.error('Error updating status:', error)
      toast.error('Failed to update task status')
      throw error
    }
  }

  const handlePositionChange = async (taskId: string, newPosition: number, status: string) => {
    try {
      // Update task position via unified API
      const response = await fetch(`/api/unified/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          position: newPosition,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to update task position')
      }

      // Refresh tasks to get updated positions
      fetchTasks()
    } catch (error) {
      console.error('Error updating position:', error)
      toast.error('Failed to update task position')
      throw error
    }
  }

  const handleSubmitTask = useCallback(async (data: TaskFormData) => {
    try {
      if (editingTask) {
        // Update existing task
        const response = await fetch(`/api/unified/tasks/${editingTask.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: data.title,
            description: data.description,
            priority: data.priority,
            status: data.status,
            department_id: data.department_id,
            vertical_key: data.vertical_key,
            project_id: data.project_id,
            vertical_id: verticalScope && verticalScope !== 'all' ? verticalScope : undefined,
            due_date: data.due_date?.toISOString(),
            estimated_duration: data.estimated_duration,
            important_links: data.important_links || [],
            assignees: data.assignees,
          }),
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || 'Failed to update task')
        }

        toast.success('Task updated')
      } else {
        // Create new task
        if (!clerkUser?.id) {
          toast.error('Please log in to create tasks')
          throw new Error('Not authenticated')
        }

        // Get profile for Clerk user
        const profileResponse = await fetch(`/api/unified/users?search=${encodeURIComponent(clerkUser.emailAddresses[0]?.emailAddress || '')}`)
        const profileData = await profileResponse.json()
        const profile = profileData.data?.find((u: any) => u.email === clerkUser.emailAddresses[0]?.emailAddress)

        if (!profile) {
          toast.error('User profile not found. Please contact support.')
          throw new Error('Profile not found')
        }

        const response = await fetch('/api/unified/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: data.title,
            description: data.description,
            priority: data.priority,
            status: data.status || 'pending',
            department_id: data.department_id,
            vertical_key: data.vertical_key,
            project_id: data.project_id,
            vertical_id: verticalScope && verticalScope !== 'all' ? verticalScope : undefined,
            due_date: data.due_date?.toISOString(),
            estimated_duration: data.estimated_duration,
            important_links: data.important_links || [],
            created_by: profile.id,
            updated_by: profile.id,
            assignees: data.assignees,
          }),
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || 'Failed to create task')
        }

        toast.success('Task created')
      }

      setFormOpen(false)
      setEditingTask(null)
      fetchTasks()
    } catch (error) {
      console.error('Error saving task:', error)
      toast.error(editingTask ? 'Failed to update task' : 'Failed to create task')
      throw error
    }
  }, [editingTask, fetchTasks, clerkUser?.id, verticalScope])

  const handleDeleteTask = async (task: TaskFull) => {
    if (!confirm('Are you sure you want to delete this task?')) return

    try {
      const response = await fetch(`/api/unified/tasks/${task.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to delete task')
      }

      toast.success('Task deleted')
      fetchTasks()
    } catch (error) {
      console.error('Error deleting task:', error)
      toast.error('Failed to delete task')
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
    { label: 'Overdue', value: 'overdue' },
    { label: 'Expiring Soon', value: 'expiring_soon' },
  ]

  const filterConfig = [
    {
      columnId: 'urgency_tag',
      title: 'Urgency',
      options: urgencyOptions,
    },
    {
      columnId: 'status',
      title: 'Status',
      options: statusOptions,
    },
    {
      columnId: 'priority',
      title: 'Priority',
      options: priorityOptions,
    },
    // Limited to 3 filters to maintain proper alignment
  ]

  const renderCustomView = (viewType: string, data: TaskFull[]) => {
    if (viewType === 'kanban') {
      // Apply filters to data for kanban
      let filteredData = data
      if (filters.length > 0) {
        filteredData = data.filter((task) => {
          return filters.every((filter) => {
            if (filter.id === 'priority' && filter.value) {
              const values = Array.isArray(filter.value) ? filter.value : [filter.value]
              return values.includes(task.priority || '')
            }
            if (filter.id === 'department' && filter.value) {
              const values = Array.isArray(filter.value) ? filter.value : [filter.value]
              return values.includes(task.department_id || '')
            }
            if (filter.id === 'urgency_tag' && filter.value) {
              const values = Array.isArray(filter.value) ? filter.value : [filter.value]
              // Calculate urgency tag for this task
              const tag = task.urgency_tag || calculateUrgencyTag(task)
              return values.includes(tag || '')
            }
            return true
          })
        })
      }
      if (search) {
        filteredData = filteredData.filter(
          (task) =>
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
    if (viewType === 'list') {
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
    return <PageLoader />
  }

  return (
    <>
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Tasks</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Manage and track your tasks</p>
        </div>
      </div>

      {role === 'employee' || role === 'superadmin' ? (
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
          onViewChange={(v) => setView(v as 'table' | 'list' | 'kanban')}
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
          role={role || 'employee'}
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

      {editingTask ? (
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
      ) : (
        <TaskFormMultiStep
          open={formOpen}
          defaultStatus={defaultStatus}
          onOpenChange={(open) => {
            setFormOpen(open)
            if (!open) {
              setEditingTask(null)
              setDefaultStatus(undefined)
            }
          }}
          onSubmit={async (data) => {
            // Extract subtasks and deliverables, then call handleSubmitTask with TaskFormData
            const { subtasks, deliverables, ...taskFormData } = data
            await handleSubmitTask(taskFormData)
            // TODO: Handle subtasks and deliverables separately if needed
            // For now, they're included in the data but not processed
          }}
          statusOptions={statusOptions}
          priorityOptions={priorityOptions}
          departmentOptions={departmentOptions}
        />
      )}
    </>
  )
}

export default function TasksPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <TasksPageContent />
    </Suspense>
  )
}
