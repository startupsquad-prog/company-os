"use client"

import { Table } from "@tanstack/react-table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { DataTableViewOptions } from "./data-table-view-options"
import { DataTableFacetedFilter } from "./data-table-faceted-filter"
import { DataTableViewToggle } from "./data-table-view-toggle"
import { DataTableExportMenu } from "./data-table-export-menu"
import { DataTableDateRangePicker } from "./data-table-date-range-picker"
import { X, Plus } from "lucide-react"

interface DataTableToolbarProps<TData> {
  table: Table<TData>
  onSearchChange: (value: string) => void
  view?: string
  onViewChange?: (view: string) => void
  data?: TData[]
  onAdd?: () => void
  onDateRangeChange?: (dateRange: { from: Date | undefined; to: Date | undefined }) => void
  searchPlaceholder?: string
  addButtonText?: string
  addButtonIcon?: React.ReactNode
  filterConfig?: {
    columnId: string
    title: string
    options: { label: string; value: string; icon?: React.ComponentType<{ className?: string }> }[]
  }[]
}

export function DataTableToolbar<TData>({
  table,
  onSearchChange,
  view = "table",
  onViewChange,
  data = [],
  onAdd,
  onDateRangeChange,
  searchPlaceholder = "Search...",
  addButtonText = "Add Item",
  addButtonIcon = <Plus className="mr-2 h-4 w-4" />,
  filterConfig = [],
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
      <Input
        placeholder={searchPlaceholder}
        onChange={(e) => onSearchChange(e.target.value)}
        className="h-8 w-[140px] flex-shrink-0 text-sm"
      />
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {filterConfig.map((filter) => {
          const column = table.getColumn(filter.columnId)
          if (!column) return null
          return (
            <DataTableFacetedFilter
              key={filter.columnId}
              column={column}
              title={filter.title}
              options={filter.options}
            />
          )
        })}
      </div>
      {isFiltered && (
        <Button
          variant="ghost"
          onClick={() => table.resetColumnFilters()}
          className="h-8 px-2 flex-shrink-0"
          size="sm"
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      )}
      {/* Right-aligned section: View Toggles, View, Export, Create Task */}
      <div className="flex items-center gap-1.5 flex-shrink-0 ml-auto">
        {onDateRangeChange && (
          <div className="flex-shrink-0">
            <DataTableDateRangePicker onDateRangeChange={onDateRangeChange} />
          </div>
        )}
        {onViewChange && (
          <div className="flex-shrink-0">
            <DataTableViewToggle view={view} onViewChange={onViewChange} />
          </div>
        )}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <DataTableViewOptions table={table} />
          <DataTableExportMenu data={data} />
        </div>
        {onAdd && (
          <Button onClick={onAdd} size="sm" className="h-8 px-3 flex-shrink-0">
            {addButtonIcon}
            <span className="text-sm">{addButtonText}</span>
          </Button>
        )}
      </div>
    </div>
  )
}

