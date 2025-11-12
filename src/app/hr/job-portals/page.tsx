'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import type { JobPortalFull, JobPortalFormData } from '@/lib/types/recruitment'
import type { SortingState, ColumnFiltersState } from '@tanstack/react-table'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'
import { DataTable } from '@/components/data-table/data-table'
import { createJobPortalColumns } from './components/job-portal-columns'
import { JobPortalForm } from './components/job-portal-form'
import { JobPortalDetailsModal } from './components/job-portal-details-modal'
import { useUser } from '@clerk/nextjs'
import { PageLoader } from '@/components/ui/loader'
import { ContactTableSkeleton } from '@/app/crm/contacts/components/contact-table-skeleton'
import { PageAccessHeader } from '@/components/page-access/page-access-header'

function JobPortalsPageContent() {
  const { user: clerkUser } = useUser()
  const [portals, setPortals] = useState<JobPortalFull[]>([])
  const [loading, setLoading] = useState(true)
  const [initialLoading, setInitialLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [editingPortal, setEditingPortal] = useState<JobPortalFull | null>(null)
  const [selectedPortal, setSelectedPortal] = useState<JobPortalFull | null>(null)
  const [detailsModalOpen, setDetailsModalOpen] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [pageCount, setPageCount] = useState(0)
  const [sorting, setSorting] = useState<SortingState>([])
  const [filters, setFilters] = useState<ColumnFiltersState>([])
  const [search, setSearch] = useState('')

  const fetchPortals = useCallback(async () => {
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

      const typeFilter = filters.find((f) => f.id === 'portal_type')
      if (typeFilter && Array.isArray(typeFilter.value) && typeFilter.value.length > 0) {
        params.append('portal_type', typeFilter.value.join(','))
      }

      if (sorting.length > 0) {
        params.append('sortField', sorting[0].id || 'created_at')
        params.append('sortDirection', sorting[0].desc ? 'desc' : 'asc')
      }

      const response = await fetch(`/api/hr/job-portals?${params.toString()}`)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to fetch job portals')
      }

      const data = await response.json()

      setPortals(data.portals || [])
      setPageCount(data.totalPages || 0)
      setInitialLoading(false)
    } catch (error) {
      console.error('Error fetching job portals:', error)
      toast.error('Failed to load job portals')
      setPortals([])
      setInitialLoading(false)
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, sorting, filters, search])

  useEffect(() => {
    fetchPortals()
  }, [fetchPortals])

  const handleSubmit = async (data: JobPortalFormData) => {
    if (!clerkUser?.id) return

    try {
      const response = editingPortal
        ? await fetch(`/api/hr/job-portals/${editingPortal.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...data,
              updated_at: new Date().toISOString(),
            }),
          })
        : await fetch('/api/hr/job-portals', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...data,
              created_by: clerkUser.id,
            }),
          })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to save job portal')
      }

      toast.success(editingPortal ? 'Job portal updated successfully' : 'Job portal created successfully')
      await fetchPortals()
      setFormOpen(false)
      setEditingPortal(null)
    } catch (error: any) {
      console.error('Error saving job portal:', error)
      toast.error(error.message || 'Failed to save job portal')
      throw error
    }
  }

  const handleDelete = async (portal: JobPortalFull) => {
    if (!confirm(`Are you sure you want to delete "${portal.name}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/hr/job-portals/${portal.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to delete job portal')
      }

      toast.success('Job portal deleted successfully')
      await fetchPortals()
    } catch (error: any) {
      console.error('Error deleting job portal:', error)
      toast.error(error.message || 'Failed to delete job portal')
    }
  }

  const filterConfig = [
    {
      columnId: 'status',
      title: 'Status',
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Inactive', value: 'inactive' },
        { label: 'Expired', value: 'expired' },
      ],
    },
    {
      columnId: 'portal_type',
      title: 'Type',
      options: [
        { label: 'Job Board', value: 'job_board' },
        { label: 'LinkedIn', value: 'linkedin' },
        { label: 'Indeed', value: 'indeed' },
        { label: 'Naukri', value: 'naukri' },
        { label: 'Monster', value: 'monster' },
        { label: 'Glassdoor', value: 'glassdoor' },
        { label: 'Other', value: 'other' },
      ],
    },
  ]

  const columns = createJobPortalColumns({
    onView: (portal) => {
      setSelectedPortal(portal)
      setDetailsModalOpen(true)
    },
    onEdit: (portal) => {
      setEditingPortal(portal)
      setFormOpen(true)
    },
    onDelete: handleDelete,
  })

  return (
    <div className="flex flex-1 flex-col min-w-0 h-full overflow-hidden">
      {/* Page Title and Subtitle with PageAccessHeader */}
      <div className="flex items-center justify-between mb-3 flex-shrink-0">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Job Portals</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Manage active job portals and subscriptions</p>
        </div>
        <PageAccessHeader pagePath="/hr/job-portals" />
      </div>

      {initialLoading ? (
        <ContactTableSkeleton />
      ) : (
        <DataTable
          columns={columns}
          data={portals}
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
          searchPlaceholder="Search job portals..."
          page={page}
          pageSize={pageSize}
          onAdd={() => {
            setEditingPortal(null)
            setFormOpen(true)
          }}
          addButtonText="Add Portal"
          addButtonIcon={<Plus className="h-4 w-4" />}
        />
      )}

      <JobPortalForm
        portal={editingPortal}
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open)
          if (!open) {
            setEditingPortal(null)
          }
        }}
        onSubmit={handleSubmit}
      />

      <JobPortalDetailsModal
        portal={selectedPortal}
        open={detailsModalOpen}
        onOpenChange={setDetailsModalOpen}
        onEdit={(portal) => {
          setSelectedPortal(null)
          setDetailsModalOpen(false)
          setEditingPortal(portal)
          setFormOpen(true)
        }}
        onDelete={handleDelete}
      />
    </div>
  )
}

export default function JobPortalsPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <JobPortalsPageContent />
    </Suspense>
  )
}

