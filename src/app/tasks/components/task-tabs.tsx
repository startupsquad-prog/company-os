"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TaskKanban } from "./task-kanban"
import { DataTable } from "@/components/data-table/data-table"
import type { TaskFull } from "@/lib/types/tasks"
import type { ColumnDef, SortingState, ColumnFiltersState } from "@tanstack/react-table"

interface TaskTabsProps {
  role: 'employee' | 'manager' | 'admin' | 'superadmin'
  defaultView?: 'kanban' | 'table'
  columns: ColumnDef<TaskFull>[]
  data: TaskFull[]
  pageCount: number
  onPaginationChange: (page: number, pageSize: number) => void
  onSortingChange: (sorting: SortingState) => void
  onFilterChange: (filters: ColumnFiltersState) => void
  onSearchChange: (search: string) => void
  loading?: boolean
  initialLoading?: boolean
  onAdd?: () => void
  onEdit?: (task: TaskFull) => void
  onDelete?: (task: TaskFull) => void
  onView?: (task: TaskFull) => void
  onStatusChange?: (taskId: string, newStatus: string) => Promise<void>
  statusOptions?: Array<{ label: string; value: string }>
  filterConfig?: {
    columnId: string
    title: string
    options: { label: string; value: string; icon?: React.ComponentType<{ className?: string }> }[]
  }[]
  searchPlaceholder?: string
  addButtonText?: string
  addButtonIcon?: React.ReactNode
}

export function TaskTabs({
  role,
  defaultView = 'table',
  columns,
  data,
  pageCount,
  onPaginationChange,
  onSortingChange,
  onFilterChange,
  onSearchChange,
  loading = false,
  initialLoading = false,
  onAdd,
  onEdit,
  onDelete,
  onView,
  onStatusChange,
  statusOptions = [],
  filterConfig,
  searchPlaceholder,
  addButtonText,
  addButtonIcon,
}: TaskTabsProps) {
  return (
    <Tabs defaultValue={defaultView} className="w-full">
      <TabsList>
        <TabsTrigger value="kanban">Kanban</TabsTrigger>
        <TabsTrigger value="table">Table</TabsTrigger>
      </TabsList>
      <TabsContent value="kanban" className="mt-4">
        <div className="flex-1 rounded-md border overflow-hidden min-w-0">
          <TaskKanban
            data={data}
            statusOptions={statusOptions}
            onEdit={onEdit}
            onDelete={onDelete}
            onView={onView}
            onStatusChange={onStatusChange}
            onAdd={onAdd}
          />
        </div>
      </TabsContent>
      <TabsContent value="table" className="mt-4">
        <DataTable
          columns={columns}
          data={data}
          pageCount={pageCount}
          onPaginationChange={onPaginationChange}
          onSortingChange={onSortingChange}
          onFilterChange={onFilterChange}
          onSearchChange={onSearchChange}
          loading={loading}
          initialLoading={initialLoading}
          view="table"
          onAdd={onAdd}
          onEdit={onEdit}
          onDelete={onDelete}
          onView={onView}
          filterConfig={filterConfig}
          searchPlaceholder={searchPlaceholder}
          addButtonText={addButtonText}
          addButtonIcon={addButtonIcon}
        />
      </TabsContent>
    </Tabs>
  )
}

