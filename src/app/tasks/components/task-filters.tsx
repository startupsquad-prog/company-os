"use client"

import { DataTableFacetedFilter } from "@/components/data-table/data-table-faceted-filter"
import type { Table } from "@tanstack/react-table"
import type { TaskFull } from "@/lib/types/tasks"

interface TaskFiltersProps {
  table: Table<TaskFull>
  statusOptions: { label: string; value: string }[]
  priorityOptions: { label: string; value: string }[]
  departmentOptions: { label: string; value: string }[]
}

const urgencyOptions = [
  { label: "Overdue", value: "overdue" },
  { label: "Expiring Soon", value: "expiring_soon" },
]

export function TaskFilters({ 
  table, 
  statusOptions, 
  priorityOptions, 
  departmentOptions 
}: TaskFiltersProps) {
  return (
    <>
      {table.getColumn("urgency_tag") && (
        <DataTableFacetedFilter
          column={table.getColumn("urgency_tag")}
          title="Urgency"
          options={urgencyOptions}
        />
      )}
      {table.getColumn("status") && (
        <DataTableFacetedFilter
          column={table.getColumn("status")}
          title="Status"
          options={statusOptions}
        />
      )}
      {table.getColumn("priority") && (
        <DataTableFacetedFilter
          column={table.getColumn("priority")}
          title="Priority"
          options={priorityOptions}
        />
      )}
      {table.getColumn("department") && (
        <DataTableFacetedFilter
          column={table.getColumn("department")}
          title="Department"
          options={departmentOptions}
        />
      )}
    </>
  )
}

