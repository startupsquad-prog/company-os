'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import type { SortingState, ColumnFiltersState } from '@tanstack/react-table'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'
import { DataTable } from '@/components/data-table/data-table'
import { createEmployeeColumns } from './components/employee-columns'
import { EmployeeForm } from './components/employee-form'
import { useUser } from '@clerk/nextjs'
import { PageLoader } from '@/components/ui/loader'
import { ContactTableSkeleton } from '@/app/crm/contacts/components/contact-table-skeleton'
import { PageAccessHeader } from '@/components/page-access/page-access-header'

interface Employee {
  id: string
  profile_id: string
  employee_id: string
  department_id: string | null
  team_id: string | null
  position: string | null
  hire_date: string | null
  status: string
  created_at: string
  updated_at: string
  profile?: {
    id: string
    first_name: string | null
    last_name: string | null
    email: string | null
  }
}

function EmployeesPageContent() {
  const { user: clerkUser } = useUser()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [initialLoading, setInitialLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [pageCount, setPageCount] = useState(0)
  const [sorting, setSorting] = useState<SortingState>([])
  const [filters, setFilters] = useState<ColumnFiltersState>([])
  const [search, setSearch] = useState('')

  const fetchEmployees = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/employees?page=${page}&pageSize=${pageSize}&search=${search}`)

      if (!response.ok) {
        throw new Error('Failed to fetch employees')
      }

      const data = await response.json()
      setEmployees(data.employees || [])
      setPageCount(data.totalPages || 0)
      setInitialLoading(false)
    } catch (error) {
      console.error('Error fetching employees:', error)
      toast.error('Failed to load employees')
      setEmployees([])
      setInitialLoading(false)
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, search])

  useEffect(() => {
    fetchEmployees()
  }, [fetchEmployees])

  const handleSubmit = async (data: any) => {
    try {
      const response = editingEmployee
        ? await fetch(`/api/employees/${editingEmployee.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
          })
        : await fetch('/api/employees', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
          })

      if (!response.ok) throw new Error('Failed to save employee')
      toast.success(editingEmployee ? 'Employee updated' : 'Employee created')
      await fetchEmployees()
      setFormOpen(false)
      setEditingEmployee(null)
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  const columns = createEmployeeColumns({
    onView: (emp) => {
      window.location.href = `/hr/employees/${emp.id}`
    },
    onEdit: (emp) => {
      setEditingEmployee(emp)
      setFormOpen(true)
    },
    onDelete: async (emp) => {
      if (!confirm('Delete this employee?')) return
      try {
        const response = await fetch(`/api/employees/${emp.id}`, { method: 'DELETE' })
        if (!response.ok) throw new Error('Failed to delete')
        toast.success('Employee deleted')
        await fetchEmployees()
      } catch (error: any) {
        toast.error(error.message)
      }
    },
  })

  return (
    <div className="flex flex-1 flex-col min-w-0 h-full overflow-hidden">
      <div className="flex items-center justify-between mb-3 flex-shrink-0">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Employees</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Manage employee records</p>
        </div>
        <PageAccessHeader pagePath="/hr/employees" />
      </div>

      {initialLoading ? (
        <ContactTableSkeleton />
      ) : (
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
          searchPlaceholder="Search employees..."
          page={page}
          pageSize={pageSize}
          onAdd={() => {
            setEditingEmployee(null)
            setFormOpen(true)
          }}
          addButtonText="Add Employee"
          addButtonIcon={<Plus className="h-4 w-4" />}
        />
      )}

      <EmployeeForm
        employee={editingEmployee}
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open)
          if (!open) setEditingEmployee(null)
        }}
        onSubmit={handleSubmit}
      />
    </div>
  )
}

export default function EmployeesPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <EmployeesPageContent />
    </Suspense>
  )
}


