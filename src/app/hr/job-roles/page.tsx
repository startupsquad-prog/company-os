'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import type { JobRoleFull, JobRoleFormData } from '@/lib/types/recruitment'
import type { SortingState, ColumnFiltersState } from '@tanstack/react-table'
import { toast } from 'sonner'
import { Plus, Sparkles } from 'lucide-react'
import { DataTable } from '@/components/data-table/data-table'
import { createJobRoleColumns } from './components/job-role-columns'
import { JobRoleForm } from './components/job-role-form'
import { JobRoleDetailsModal } from './components/job-role-details-modal'
import { useUser } from '@clerk/nextjs'
import { PageLoader } from '@/components/ui/loader'
import { ContactTableSkeleton } from '@/app/crm/contacts/components/contact-table-skeleton'
import { PageAccessHeader } from '@/components/page-access/page-access-header'

function JobRolesPageContent() {
  const { user: clerkUser } = useUser()
  const [roles, setRoles] = useState<JobRoleFull[]>([])
  const [loading, setLoading] = useState(true)
  const [initialLoading, setInitialLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [editingRole, setEditingRole] = useState<JobRoleFull | null>(null)
  const [selectedRole, setSelectedRole] = useState<JobRoleFull | null>(null)
  const [detailsModalOpen, setDetailsModalOpen] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [pageCount, setPageCount] = useState(0)
  const [sorting, setSorting] = useState<SortingState>([])
  const [filters, setFilters] = useState<ColumnFiltersState>([])
  const [search, setSearch] = useState('')

  const fetchRoles = useCallback(async () => {
    try {
      setLoading(true)

      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
        ...(search ? { search } : {}),
      })

      const statusFilter = filters.find((f) => f.id === 'status')
      if (statusFilter && Array.isArray(statusFilter.value) && statusFilter.value.length > 0) {
        params.append('status', statusFilter.value.join(','))
      }

      const departmentFilter = filters.find((f) => f.id === 'department')
      if (departmentFilter && Array.isArray(departmentFilter.value) && departmentFilter.value.length > 0) {
        params.append('department', departmentFilter.value.join(','))
      }

      if (sorting.length > 0) {
        params.append('sortField', sorting[0].id || 'created_at')
        params.append('sortDirection', sorting[0].desc ? 'desc' : 'asc')
      }

      const response = await fetch(`/api/hr/job-roles?${params.toString()}`)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to fetch job roles')
      }

      const data = await response.json()

      setRoles(data.roles || [])
      setPageCount(data.totalPages || 0)
      setInitialLoading(false)
    } catch (error) {
      console.error('Error fetching job roles:', error)
      toast.error('Failed to load job roles')
      setRoles([])
      setInitialLoading(false)
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, sorting, filters, search])

  useEffect(() => {
    fetchRoles()
  }, [fetchRoles])

  const handleSubmit = async (data: JobRoleFormData) => {
    if (!clerkUser?.id) return

    try {
      const response = editingRole
        ? await fetch(`/api/hr/job-roles/${editingRole.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...data,
              updated_at: new Date().toISOString(),
            }),
          })
        : await fetch('/api/hr/job-roles', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...data,
              created_by: clerkUser.id,
            }),
          })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to save job role')
      }

      toast.success(editingRole ? 'Job role updated successfully' : 'Job role created successfully')
      await fetchRoles()
      setFormOpen(false)
      setEditingRole(null)
    } catch (error: any) {
      console.error('Error saving job role:', error)
      toast.error(error.message || 'Failed to save job role')
      throw error
    }
  }

  const handleDelete = async (role: JobRoleFull) => {
    if (!confirm(`Are you sure you want to delete "${role.title}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/hr/job-roles/${role.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to delete job role')
      }

      toast.success('Job role deleted successfully')
      await fetchRoles()
    } catch (error: any) {
      console.error('Error deleting job role:', error)
      toast.error(error.message || 'Failed to delete job role')
    }
  }

  const filterConfig = [
    {
      columnId: 'status',
      title: 'Status',
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Inactive', value: 'inactive' },
        { label: 'Archived', value: 'archived' },
      ],
    },
  ]

  const columns = createJobRoleColumns({
    onView: (role) => {
      setSelectedRole(role)
      setDetailsModalOpen(true)
    },
    onEdit: (role) => {
      setEditingRole(role)
      setFormOpen(true)
    },
    onDelete: handleDelete,
  })

  const handleAiGenerateJobDescription = () => {
    toast.info('AI Generate Job Description - Coming soon!')
    // TODO: Implement AI job description generation
  }

  return (
    <div className="flex flex-1 flex-col min-w-0 h-full overflow-hidden">
      {/* Page Title and Subtitle with PageAccessHeader */}
      <div className="flex items-center justify-between mb-3 flex-shrink-0">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Job Roles</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Manage job roles and positions</p>
        </div>
        <PageAccessHeader pagePath="/hr/job-roles" />
      </div>

      {initialLoading ? (
        <ContactTableSkeleton />
      ) : (
        <DataTable
          columns={columns}
          data={roles}
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
          filterConfig={filterConfig}
          searchPlaceholder="Search job roles..."
          page={page}
          pageSize={pageSize}
          onAdd={() => {
            setEditingRole(null)
            setFormOpen(true)
          }}
          addButtonText="Add Role"
          addButtonIcon={<Plus className="h-4 w-4" />}
          aiGenerateButton={{
            label: 'AI Generate Job Description',
            icon: <Sparkles className="h-4 w-4" />,
            onClick: handleAiGenerateJobDescription,
          }}
        />
      )}

      <JobRoleForm
        role={editingRole}
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open)
          if (!open) {
            setEditingRole(null)
          }
        }}
        onSubmit={handleSubmit}
      />

      <JobRoleDetailsModal
        role={selectedRole}
        open={detailsModalOpen}
        onOpenChange={setDetailsModalOpen}
        onEdit={(role) => {
          setSelectedRole(null)
          setDetailsModalOpen(false)
          setEditingRole(role)
          setFormOpen(true)
        }}
        onDelete={handleDelete}
      />
    </div>
  )
}

export default function JobRolesPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <JobRolesPageContent />
    </Suspense>
  )
}

