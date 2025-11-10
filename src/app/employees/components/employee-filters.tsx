'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Search, ChevronDown, List, Grid, LayoutGrid, X } from 'lucide-react'
import type { Employee } from './types'

interface EmployeeFiltersProps {
  searchTerm: string
  setSearchTerm: (term: string) => void
  statusFilter: string[]
  setStatusFilter: (filters: string[]) => void
  departmentFilter: string[]
  setDepartmentFilter: (filters: string[]) => void
  view: 'list' | 'grid' | 'kanban'
  setView: (view: 'list' | 'grid' | 'kanban') => void
  employees: Employee[]
  onClearFilters: () => void
}

export function EmployeeFilters({
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  departmentFilter,
  setDepartmentFilter,
  view,
  setView,
  employees,
  onClearFilters,
}: EmployeeFiltersProps) {
  const toggleFilter = (currentFilters: string[], setFilters: (filters: string[]) => void, value: string) => {
    if (currentFilters.includes(value)) {
      setFilters(currentFilters.filter((f) => f !== value))
    } else {
      setFilters([...currentFilters, value])
    }
  }

  const statuses = ['active', 'onboarding', 'resigned']
  const departments = Array.from(
    new Set(employees.map((emp) => emp.department?.id).filter(Boolean) as string[])
  )
  const departmentMap = new Map(
    employees
      .filter((emp) => emp.department)
      .map((emp) => [emp.department!.id, emp.department!.name])
  )

  const hasActiveFilters = searchTerm || statusFilter.length > 0 || departmentFilter.length > 0

  return (
    <div className="flex-shrink-0 bg-card rounded-t-lg border border-b-0 shadow-sm">
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center space-x-4 w-full">
          <div className="relative flex-grow max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search employees..."
              className="pl-10 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-[150px] justify-between">
                {statusFilter.length === 0 ? 'All Status' : `${statusFilter.length} selected`}
                <ChevronDown className="h-4 w-4 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0">
              <div className="max-h-60 overflow-auto">
                <div className="p-2 border-b">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="select-all-status"
                      checked={statusFilter.length === statuses.length}
                      onCheckedChange={() => {
                        if (statusFilter.length === statuses.length) {
                          setStatusFilter([])
                        } else {
                          setStatusFilter(statuses)
                        }
                      }}
                    />
                    <label htmlFor="select-all-status" className="text-sm font-medium">
                      Select All
                    </label>
                  </div>
                </div>
                <div className="p-1">
                  {statuses.map((status) => (
                    <div
                      key={status}
                      className="flex items-center space-x-2 p-2 hover:bg-muted rounded transition-colors"
                    >
                      <Checkbox
                        id={`status-${status}`}
                        checked={statusFilter.includes(status)}
                        onCheckedChange={() => toggleFilter(statusFilter, setStatusFilter, status)}
                      />
                      <label htmlFor={`status-${status}`} className="text-sm capitalize">
                        {status}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {departments.length > 0 && (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-[150px] justify-between">
                  {departmentFilter.length === 0
                    ? 'All Departments'
                    : `${departmentFilter.length} selected`}
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[200px] p-0">
                <div className="max-h-60 overflow-auto">
                  <div className="p-2 border-b">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="select-all-dept"
                        checked={departmentFilter.length === departments.length}
                        onCheckedChange={() => {
                          if (departmentFilter.length === departments.length) {
                            setDepartmentFilter([])
                          } else {
                            setDepartmentFilter(departments)
                          }
                        }}
                      />
                      <label htmlFor="select-all-dept" className="text-sm font-medium">
                        Select All
                      </label>
                    </div>
                  </div>
                  <div className="p-1">
                    {departments.map((deptId) => (
                      <div
                        key={deptId}
                        className="flex items-center space-x-2 p-2 hover:bg-muted rounded transition-colors"
                      >
                        <Checkbox
                          id={`dept-${deptId}`}
                          checked={departmentFilter.includes(deptId)}
                          onCheckedChange={() => toggleFilter(departmentFilter, setDepartmentFilter, deptId)}
                        />
                        <label htmlFor={`dept-${deptId}`} className="text-sm">
                          {departmentMap.get(deptId) || 'Unknown'}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          )}

          {hasActiveFilters && (
            <Button variant="outline" onClick={onClearFilters} className="whitespace-nowrap">
              <X className="mr-2 h-4 w-4" />
              Clear Filters
            </Button>
          )}

          <div className="flex items-center border rounded-md">
            <Button
              variant={view === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setView('list')}
              className="rounded-r-none"
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant={view === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setView('grid')}
              className="rounded-none border-x"
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={view === 'kanban' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setView('kanban')}
              className="rounded-l-none"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

