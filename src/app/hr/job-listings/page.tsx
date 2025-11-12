'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import type { JobListingFull, JobListingFormData } from '@/lib/types/recruitment'
import type { SortingState, ColumnFiltersState } from '@tanstack/react-table'
import { toast } from 'sonner'
import { Plus, Sparkles } from 'lucide-react'
import { DataTable } from '@/components/data-table/data-table'
import { createJobListingColumns } from './components/job-listing-columns'
import { JobListingForm } from './components/job-listing-form'
import { JobListingDetailsModal } from './components/job-listing-details-modal'
import { useUser } from '@clerk/nextjs'
import { PageLoader } from '@/components/ui/loader'
import { ContactTableSkeleton } from '@/app/crm/contacts/components/contact-table-skeleton'
import { PageAccessHeader } from '@/components/page-access/page-access-header'

function JobListingsPageContent() {
  const { user: clerkUser } = useUser()
  const [listings, setListings] = useState<JobListingFull[]>([])
  const [loading, setLoading] = useState(true)
  const [initialLoading, setInitialLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [editingListing, setEditingListing] = useState<JobListingFull | null>(null)
  const [selectedListing, setSelectedListing] = useState<JobListingFull | null>(null)
  const [detailsModalOpen, setDetailsModalOpen] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [pageCount, setPageCount] = useState(0)
  const [sorting, setSorting] = useState<SortingState>([])
  const [filters, setFilters] = useState<ColumnFiltersState>([])
  const [search, setSearch] = useState('')

  const fetchListings = useCallback(async () => {
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

      if (sorting.length > 0) {
        params.append('sortField', sorting[0].id || 'created_at')
        params.append('sortDirection', sorting[0].desc ? 'desc' : 'asc')
      }

      const response = await fetch(`/api/hr/job-listings?${params.toString()}`)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to fetch job listings')
      }

      const data = await response.json()

      setListings(data.listings || [])
      setPageCount(data.totalPages || 0)
      setInitialLoading(false)
    } catch (error) {
      console.error('Error fetching job listings:', error)
      toast.error('Failed to load job listings')
      setListings([])
      setInitialLoading(false)
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, sorting, filters, search])

  useEffect(() => {
    fetchListings()
  }, [fetchListings])

  const handleSubmit = async (data: JobListingFormData) => {
    if (!clerkUser?.id) return

    try {
      const response = editingListing
        ? await fetch(`/api/hr/job-listings/${editingListing.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...data,
              updated_at: new Date().toISOString(),
            }),
          })
        : await fetch('/api/hr/job-listings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...data,
              created_by: clerkUser.id,
            }),
          })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to save job listing')
      }

      toast.success(editingListing ? 'Job listing updated successfully' : 'Job listing created successfully')
      await fetchListings()
      setFormOpen(false)
      setEditingListing(null)
    } catch (error: any) {
      console.error('Error saving job listing:', error)
      toast.error(error.message || 'Failed to save job listing')
      throw error
    }
  }

  const handleDelete = async (listing: JobListingFull) => {
    if (!confirm(`Are you sure you want to delete this job listing?`)) {
      return
    }

    try {
      const response = await fetch(`/api/hr/job-listings/${listing.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to delete job listing')
      }

      toast.success('Job listing deleted successfully')
      await fetchListings()
    } catch (error: any) {
      console.error('Error deleting job listing:', error)
      toast.error(error.message || 'Failed to delete job listing')
    }
  }

  const filterConfig = [
    {
      columnId: 'status',
      title: 'Status',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Active', value: 'active' },
        { label: 'Paused', value: 'paused' },
        { label: 'Closed', value: 'closed' },
        { label: 'Expired', value: 'expired' },
      ],
    },
  ]

  const columns = createJobListingColumns({
    onView: (listing) => {
      setSelectedListing(listing)
      setDetailsModalOpen(true)
    },
    onEdit: (listing) => {
      setEditingListing(listing)
      setFormOpen(true)
    },
    onDelete: handleDelete,
  })

  const handleAiGenerateJobPosting = () => {
    toast.info('AI Generate Job Posting - Coming soon!')
    // TODO: Implement AI job posting generation
  }

  return (
    <div className="flex flex-1 flex-col min-w-0 h-full overflow-hidden">
      {/* Page Title and Subtitle with PageAccessHeader */}
      <div className="flex items-center justify-between mb-3 flex-shrink-0">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Job Listings</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Manage active job postings across portals</p>
        </div>
        <PageAccessHeader pagePath="/hr/job-listings" />
      </div>

      {initialLoading ? (
        <ContactTableSkeleton />
      ) : (
        <DataTable
          columns={columns}
          data={listings}
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
          searchPlaceholder="Search job listings..."
          page={page}
          pageSize={pageSize}
          onAdd={() => {
            setEditingListing(null)
            setFormOpen(true)
          }}
          addButtonText="Create Listing"
          addButtonIcon={<Plus className="h-4 w-4" />}
          aiGenerateButton={{
            label: 'AI Generate Job Posting',
            icon: <Sparkles className="h-4 w-4" />,
            onClick: handleAiGenerateJobPosting,
          }}
        />
      )}

      <JobListingForm
        listing={editingListing}
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open)
          if (!open) {
            setEditingListing(null)
          }
        }}
        onSubmit={handleSubmit}
      />

      <JobListingDetailsModal
        listing={selectedListing}
        open={detailsModalOpen}
        onOpenChange={setDetailsModalOpen}
        onEdit={(listing) => {
          setSelectedListing(null)
          setDetailsModalOpen(false)
          setEditingListing(listing)
          setFormOpen(true)
        }}
        onDelete={handleDelete}
      />
    </div>
  )
}

export default function JobListingsPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <JobListingsPageContent />
    </Suspense>
  )
}

