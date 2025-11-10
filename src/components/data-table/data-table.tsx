'use client'

import { useState } from 'react'
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  SortingState,
  VisibilityState,
  ColumnFiltersState,
  RowSelectionState,
} from '@tanstack/react-table'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { DataTableToolbar } from './data-table-toolbar'
import { TaskTableSkeleton } from '@/app/tasks/components/task-table-skeleton'
import { DataTablePagination } from './data-table-pagination'

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  pageCount: number
  onPaginationChange: (page: number, pageSize: number) => void
  onSortingChange: (sorting: SortingState) => void
  onFilterChange: (filters: ColumnFiltersState) => void
  onSearchChange: (search: string) => void
  loading?: boolean
  initialLoading?: boolean
  view?: string
  onViewChange?: (view: string) => void
  onAdd?: () => void
  onEdit?: (item: TData) => void
  onDelete?: (item: TData) => void
  onView?: (item: TData) => void
  onDateRangeChange?: (dateRange: { from: Date | undefined; to: Date | undefined }) => void
  searchPlaceholder?: string
  addButtonText?: string
  addButtonIcon?: React.ReactNode
  renderCustomView?: (view: string, data: TData[]) => React.ReactNode
  filterConfig?: {
    columnId: string
    title: string
    options: { label: string; value: string; icon?: React.ComponentType<{ className?: string }> }[]
  }[]
}

export function DataTable<TData, TValue>({
  columns,
  data,
  pageCount,
  onPaginationChange,
  onSortingChange,
  onFilterChange,
  onSearchChange,
  loading = false,
  initialLoading = false,
  view = 'table',
  onViewChange,
  onAdd,
  onEdit,
  onDelete,
  onView,
  onDateRangeChange,
  searchPlaceholder,
  addButtonText,
  addButtonIcon,
  renderCustomView,
  filterConfig = [],
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 })

  const table = useReactTable({
    data,
    columns,
    pageCount,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      pagination,
    },
    onSortingChange: (updater) => {
      setSorting(updater)
      const newSorting = typeof updater === 'function' ? updater(sorting) : updater
      onSortingChange(newSorting)
    },
    onColumnFiltersChange: (updater) => {
      setColumnFilters(updater)
      const newFilters = typeof updater === 'function' ? updater(columnFilters) : updater
      onFilterChange(newFilters)
    },
    onPaginationChange: (updater) => {
      setPagination(updater)
      const newPagination = typeof updater === 'function' ? updater(pagination) : updater
      onPaginationChange(newPagination.pageIndex + 1, newPagination.pageSize)
    },
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
  })

  const renderView = () => {
    if (initialLoading && view === 'table') {
      return <TaskTableSkeleton columns={columns.length} />
    }

    if (view !== 'table' && renderCustomView) {
      return renderCustomView(view, data)
    }

    // Default table view
    return (
      <div className="flex-1 overflow-x-auto overflow-y-auto rounded-md border min-h-0 overscroll-x-contain">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="text-sm">
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} className="py-2 px-2 sm:px-3 whitespace-nowrap">
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={`loading-${index}`}>
                  {columns.map((_, colIndex) => (
                    <TableCell key={colIndex} className="py-2 px-2 sm:px-3">
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                  className="text-sm"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-2 px-2 sm:px-3 whitespace-nowrap">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    )
  }

  return (
    <div className="flex flex-col space-y-4 min-h-0 flex-1 min-w-0 overflow-x-hidden">
      <DataTableToolbar
        table={table}
        onSearchChange={onSearchChange}
        view={view}
        onViewChange={onViewChange}
        data={data}
        onAdd={onAdd}
        onDateRangeChange={onDateRangeChange}
        searchPlaceholder={searchPlaceholder}
        addButtonText={addButtonText}
        addButtonIcon={addButtonIcon}
        filterConfig={filterConfig}
      />
      <div className="flex-1 min-h-0 flex flex-col min-w-0">{renderView()}</div>
      {(view === 'table' || view === 'list') && (
        <div className="flex-shrink-0 bg-background border-t">
          <DataTablePagination table={table} />
        </div>
      )}
    </div>
  )
}
