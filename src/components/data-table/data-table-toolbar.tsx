'use client'

import { Table } from '@tanstack/react-table'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { DataTableViewOptions } from './data-table-view-options'
import { DataTableFacetedFilter } from './data-table-faceted-filter'
import { DataTableViewToggle } from './data-table-view-toggle'
import { DataTableExportMenu } from './data-table-export-menu'
import { DataTableDateRangePicker } from './data-table-date-range-picker'
import { X, Plus } from 'lucide-react'

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
  view = 'table',
  onViewChange,
  data = [],
  onAdd,
  onDateRangeChange,
  searchPlaceholder = 'Search...',
  addButtonText = 'Add Item',
  addButtonIcon = <Plus className="mr-2 h-4 w-4" />,
  filterConfig = [],
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-1.5 overflow-x-auto pb-1">
      {/* Search and Filters Row */}
      <div className="flex items-center gap-1.5 flex-1 min-w-0">
      <Input
        placeholder={searchPlaceholder}
        onChange={(e) => onSearchChange(e.target.value)}
          className="h-8 w-full sm:w-[140px] flex-shrink-0 text-sm"
      />
        <div className="flex items-center gap-1.5 flex-shrink-0 overflow-x-auto">
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
      </div>
      {/* Right-aligned section: View Toggles, View, Export, Create Task */}
      <div className="flex items-center gap-1.5 flex-shrink-0 sm:ml-auto">
        {onDateRangeChange && (
          <div className="flex-shrink-0 hidden sm:block">
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
          <div className="hidden sm:block">
          <DataTableExportMenu data={data} />
          </div>
        </div>
        {onAdd && (
          <Button 
            type="button" 
            onClick={onAdd} 
            size="sm" 
            className="h-8 px-2 sm:px-3 flex-shrink-0 transition-all duration-200 hover:shadow-[inset_0_0_30px_rgba(255,255,255,0.4)]"
          >
            <span className="hidden sm:inline">{addButtonIcon}</span>
            <span className="text-sm hidden sm:inline">{addButtonText}</span>
            <Plus className="h-4 w-4 sm:hidden" />
          </Button>
        )}
      </div>
    </div>
  )
}
