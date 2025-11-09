"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DataTable } from "@/components/data-table/data-table"
import { LeadKanban } from "./lead-kanban"
import { LeadList } from "./lead-list"
import type { LeadFull } from "@/lib/types/leads"
import type { ColumnDef, SortingState, ColumnFiltersState } from "@tanstack/react-table"

interface LeadTabsProps {
  defaultView?: 'kanban' | 'table' | 'list'
  columns: ColumnDef<LeadFull>[]
  data: LeadFull[]
  pageCount: number
  onPaginationChange: (page: number, pageSize: number) => void
  onSortingChange: (sorting: SortingState) => void
  onFilterChange: (filters: ColumnFiltersState) => void
  onSearchChange: (search: string) => void
  loading?: boolean
  initialLoading?: boolean
  onAdd?: () => void
  onEdit?: (lead: LeadFull) => void
  onDelete?: (lead: LeadFull) => void
  onView?: (lead: LeadFull) => void
  onStatusChange?: (leadId: string, newStatus: string) => Promise<void>
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

export function LeadTabs({
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
}: LeadTabsProps) {
  return (
    <Tabs defaultValue={defaultView} className="w-full">
      <TabsList>
        <TabsTrigger value="table">Table</TabsTrigger>
        <TabsTrigger value="kanban">Kanban</TabsTrigger>
        <TabsTrigger value="list">List</TabsTrigger>
      </TabsList>
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
      <TabsContent value="kanban" className="mt-4">
        <div className="flex-1 rounded-md border overflow-hidden min-w-0">
          <LeadKanban
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
      <TabsContent value="list" className="mt-4">
        <div className="flex-1 rounded-md border overflow-hidden min-w-0">
          <LeadList
            data={data}
            onEdit={onEdit}
            onDelete={onDelete}
            onView={onView}
            onStatusChange={onStatusChange}
            onAdd={onAdd}
          />
        </div>
      </TabsContent>
    </Tabs>
  )
}

