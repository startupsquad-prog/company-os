'use client'

import { useState, useEffect, useCallback, useRef, Suspense } from 'react'
import { DataTable } from '@/components/data-table/data-table'
import { EmployeeKanbanView } from './employee-kanban-view'
import { EmployeeDetailsModal } from './employee-details-modal'
import { EmployeeForm } from './employee-form'
import { EmployeeStatisticsCards } from './employee-statistics-cards'
import { createEmployeeColumns } from './employee-columns'
import { useUserRole } from '@/lib/hooks/useUserRole'
import type { Employee } from './types'
import type { SortingState, ColumnFiltersState } from '@tanstack/react-table'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'
import { useUser } from '@clerk/nextjs'
import { PageLoader } from '@/components/ui/loader'

function EmployeesPageContent() {
  const { user: clerkUser } = useUser()
  const { role, isLoading: roleLoading } = useUserRole()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [initialLoading, setInitialLoading] = useState(true)
  const [view, setView] = useState<'table' | 'grid' | 'kanban'>('table')
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [detailsModalOpen, setDetailsModalOpen] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [pageCount, setPageCount] = useState(0)
  const [sorting, setSorting] = useState<SortingState>([])
  const [filters, setFilters] = useState<ColumnFiltersState>([])
  const [search, setSearch] = useState('')
  const fetchingRef = useRef(false)

  // Calculate statistics
  const stats = {
    total: employees.length,
    active: employees.filter((emp) => emp.status === 'active').length,
    onboarding: employees.filter((emp) => emp.status === 'onboarding').length,
    resigned: employees.filter((emp) => emp.status === 'resigned').length,
  }

  // Fetch employees
  const fetchEmployees = useCallback(async () => {
    if (roleLoading || !role) return

    // Prevent duplicate concurrent requests
    if (fetchingRef.current) {
      console.log('⏭️ [Employees] Skipping duplicate fetch request')
      return
    }

    fetchingRef.current = true

    try {
      setLoading(true)

      // Build query parameters
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
        view: view,
        ...(search ? { search } : {}),
      })

      // Add status filter
      const statusFilter = filters.find((f) => f.id === 'status')
      if (statusFilter && statusFilter.value) {
        const values = Array.isArray(statusFilter.value) ? statusFilter.value : [statusFilter.value]
        params.append('status', values.join(','))
      }

      // Add sorting
      if (sorting.length > 0) {
        params.append('sortField', sorting[0].id || 'created_at')
        params.append('sortDirection', sorting[0].desc ? 'desc' : 'asc')
      }

      // Fetch from unified API
      const response = await fetch(`/api/unified/employees?${params.toString()}`)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to fetch employees')
      }

      const result = await response.json()

      // Apply client-side filters for department
      let filteredEmployees = result.data || []
      if (filters && filters.length > 0) {
        for (const filter of filters) {
          const values = Array.isArray(filter.value) ? filter.value : filter.value ? [filter.value] : []
          if (!values.length) continue

          if (filter.id === 'department') {
            filteredEmployees = filteredEmployees.filter(
              (emp: Employee) => emp.department && values.includes(emp.department.id)
            )
          }
        }
      }

      // Apply client-side sorting for name/email
      if (sorting && sorting.length > 0) {
        const first = sorting[0]
        if (first.id === 'name') {
          filteredEmployees = [...filteredEmployees].sort((a, b) => {
            const aName = `${a.first_name} ${a.last_name}`.toLowerCase()
            const bName = `${b.first_name} ${b.last_name}`.toLowerCase()
            return first.desc ? bName.localeCompare(aName) : aName.localeCompare(bName)
          })
        } else if (first.id === 'email') {
          filteredEmployees = [...filteredEmployees].sort((a, b) => {
            return first.desc
              ? b.email.localeCompare(a.email)
              : a.email.localeCompare(b.email)
          })
        }
      }

      // Apply pagination
      const totalCount = filteredEmployees.length
      const from = (page - 1) * pageSize
      const to = from + pageSize
      const paginatedEmployees = filteredEmployees.slice(from, to)

      setEmployees(paginatedEmployees)
      setPageCount(Math.ceil(totalCount / pageSize))
      setInitialLoading(false)
    } catch (error: any) {
      console.error('Error in fetchEmployees:', error)
      toast.error('Failed to load employees')
      setEmployees([])
      setInitialLoading(false)
    } finally {
      setLoading(false)
      fetchingRef.current = false
    }
  }, [role, roleLoading, search, page, pageSize, sorting, filters, view])

  useEffect(() => {
    fetchEmployees()
  }, [fetchEmployees])

  const handleSaveEmployee = useCallback(
    async (data: any) => {
      try {
        if (editingEmployee) {
          // Update existing employee via unified API
          const response = await fetch(`/api/unified/employees/${editingEmployee.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              employee_id: data.employee_id,
              status: data.status,
              hire_date: data.hire_date,
              termination_date: data.termination_date,
              // Profile update will be handled separately or via a profile API
            }),
          })

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}))
            throw new Error(errorData.error || 'Failed to update employee')
          }

          // Update profile via unified users API
          const profileResponse = await fetch(`/api/unified/users/${editingEmployee.profile_id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              first_name: data.first_name,
              last_name: data.last_name,
              email: data.email,
              phone: data.phone,
              department_id: data.department_id || null,
              avatar_url: data.avatar_url || null,
            }),
          })

          if (!profileResponse.ok) {
            const errorData = await profileResponse.json().catch(() => ({}))
            throw new Error(errorData.error || 'Failed to update profile')
          }

          toast.success('Employee updated successfully')
        } else {
          toast.error('Creating new employees requires user account creation. Please use User Management.')
          return
        }

        setFormOpen(false)
        setEditingEmployee(null)
        fetchEmployees()
      } catch (error: any) {
        console.error('Error saving employee:', error)
        toast.error(editingEmployee ? 'Failed to update employee' : 'Failed to create employee')
      }
    },
    [editingEmployee, fetchEmployees]
  )

  const handleDeleteEmployee = async (employee: Employee) => {
    if (!confirm(`Are you sure you want to delete ${employee.first_name} ${employee.last_name}?`)) {
      return
    }

    try {
      // Delete via unified API
      const response = await fetch(`/api/unified/employees/${employee.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to delete employee')
      }

      toast.success('Employee deleted successfully')
      fetchEmployees()
    } catch (error: any) {
      console.error('Error deleting employee:', error)
      toast.error('Failed to delete employee')
    }
  }

  const handleStatusChange = async (employeeId: string, newStatus: string) => {
    try {
      // Update status via unified API
      const response = await fetch(`/api/unified/employees/${employeeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to update employee status')
      }

      toast.success(`Employee status updated to ${newStatus}`)
      fetchEmployees()
    } catch (error: any) {
      console.error('Error updating employee status:', error)
      toast.error('Failed to update employee status')
    }
  }

  const columns = createEmployeeColumns(
    (employee) => {
      setSelectedEmployee(employee)
      setDetailsModalOpen(true)
    },
    (employee) => {
      setEditingEmployee(employee)
      setFormOpen(true)
    },
    handleDeleteEmployee
  )

  // Get unique departments for filter
  const departments = Array.from(
    new Set(employees.map((emp) => emp.department?.id).filter(Boolean) as string[])
  )
      const departmentMap = new Map(
    employees
      .filter((emp: Employee) => emp.department)
      .map((emp: Employee) => [emp.department!.id, emp.department!.name])
  )

  const filterConfig = [
    {
      columnId: 'status',
      title: 'Status',
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Onboarding', value: 'onboarding' },
        { label: 'Resigned', value: 'resigned' },
      ],
    },
    ...(departments.length > 0
      ? [
          {
            columnId: 'department',
            title: 'Department',
            options: departments.map((deptId) => ({
              label: departmentMap.get(deptId) || 'Unknown',
              value: deptId,
            })),
          },
        ]
      : []),
  ]

  const renderCustomView = (viewType: string, data: Employee[]) => {
    if (viewType === 'kanban') {
      return (
        <EmployeeKanbanView
          data={data}
          onView={(emp) => {
            setSelectedEmployee(emp)
            setDetailsModalOpen(true)
          }}
          onEdit={(emp) => {
            setEditingEmployee(emp)
            setFormOpen(true)
          }}
          onDelete={handleDeleteEmployee}
          onStatusChange={handleStatusChange}
        />
      )
    }
    return null
  }

  if (initialLoading) {
    return <PageLoader />
  }

  return (
    <>
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Employee Management</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Manage and track your employees</p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="mb-3">
        <EmployeeStatisticsCards stats={stats} />
      </div>

      <DataTable
        columns={columns}
        data={employees}
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
        onViewChange={(v) => setView(v as 'table' | 'grid' | 'kanban')}
        onAdd={() => {
          setEditingEmployee(null)
          setFormOpen(true)
        }}
        onEdit={(employee) => {
          setEditingEmployee(employee)
          setFormOpen(true)
        }}
        onDelete={handleDeleteEmployee}
        onView={(employee) => {
          setSelectedEmployee(employee)
          setDetailsModalOpen(true)
        }}
        filterConfig={filterConfig}
        searchPlaceholder="Search employees..."
        addButtonText="Add Employee"
        addButtonIcon={<Plus className="mr-2 h-4 w-4" />}
        renderCustomView={renderCustomView}
      />

      {/* Modals */}
      <EmployeeForm
        isOpen={formOpen}
        onClose={() => {
          setFormOpen(false)
          setEditingEmployee(null)
        }}
        employee={editingEmployee}
        isEditing={!!editingEmployee}
        onSubmit={handleSaveEmployee}
      />

      <EmployeeDetailsModal
        employee={selectedEmployee}
        open={detailsModalOpen}
        onClose={() => {
          setDetailsModalOpen(false)
          setSelectedEmployee(null)
        }}
      />
    </>
  )
}

export default EmployeesPageContent
