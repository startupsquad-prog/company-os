'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import type { CandidateFull, CandidateFormData, CandidateStatus } from '@/lib/types/recruitment'
import type { SortingState, ColumnFiltersState } from '@tanstack/react-table'
import { toast } from 'sonner'
import { Plus, Upload } from 'lucide-react'
import { DataTable } from '@/components/data-table/data-table'
import { createCandidateColumns } from './components/candidate-columns'
import { CandidateForm } from './components/candidate-form'
import { CandidateDetailsModal } from './components/candidate-details-modal'
import { BulkUploadDialog } from './components/bulk-upload-dialog'
import { useUser } from '@clerk/nextjs'
import { PageLoader } from '@/components/ui/loader'
import { ContactTableSkeleton } from '@/app/crm/contacts/components/contact-table-skeleton'
import { PageAccessHeader } from '@/components/page-access/page-access-header'
import { CandidateKanban } from './components/candidate-kanban'
import { useRouter } from 'next/navigation'

function CandidatesPageContent() {
  const { user: clerkUser } = useUser()
  const router = useRouter()
  const [candidates, setCandidates] = useState<CandidateFull[]>([])
  const [allCandidates, setAllCandidates] = useState<CandidateFull[]>([]) // For kanban
  const [loading, setLoading] = useState(true)
  const [initialLoading, setInitialLoading] = useState(true)
  const [view, setView] = useState<'table' | 'kanban'>('table')
  const [formOpen, setFormOpen] = useState(false)
  const [bulkUploadOpen, setBulkUploadOpen] = useState(false)
  const [editingCandidate, setEditingCandidate] = useState<CandidateFull | null>(null)
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateFull | null>(null)
  const [detailsModalOpen, setDetailsModalOpen] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [pageCount, setPageCount] = useState(0)
  const [sorting, setSorting] = useState<SortingState>([])
  const [filters, setFilters] = useState<ColumnFiltersState>([])
  const [search, setSearch] = useState('')

  // Fetch all candidates for kanban (unpaginated)
  const fetchAllCandidates = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        page: '1',
        pageSize: '1000', // Large number to get all candidates
      })

      const statusFilter = filters.find((f) => f.id === 'status')
      if (statusFilter && Array.isArray(statusFilter.value) && statusFilter.value.length > 0) {
        params.append('status', statusFilter.value.join(','))
      }

      const response = await fetch(`/api/hr/candidates?${params.toString()}`)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to fetch candidates')
      }

      const data = await response.json()
      setAllCandidates(data.candidates || [])
    } catch (error) {
      console.error('Error fetching all candidates:', error)
      setAllCandidates([])
    }
  }, [filters])

  // Fetch candidates with pagination
  const fetchCandidates = useCallback(async () => {
    try {
      setLoading(true)

      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
        ...(search ? { search } : {}),
      })

      // Add filters
      const statusFilter = filters.find((f) => f.id === 'status')
      if (statusFilter && Array.isArray(statusFilter.value) && statusFilter.value.length > 0) {
        params.append('status', statusFilter.value.join(','))
      }

      const sourceFilter = filters.find((f) => f.id === 'source')
      if (sourceFilter && Array.isArray(sourceFilter.value) && sourceFilter.value.length > 0) {
        params.append('source', sourceFilter.value.join(','))
      }

      const recruiterFilter = filters.find((f) => f.id === 'recruiter')
      if (recruiterFilter && Array.isArray(recruiterFilter.value) && recruiterFilter.value.length > 0) {
        params.append('recruiter_id', recruiterFilter.value.join(','))
      }

      // Add sorting
      if (sorting.length > 0) {
        params.append('sortField', sorting[0].id || 'created_at')
        params.append('sortDirection', sorting[0].desc ? 'desc' : 'asc')
      }

      const response = await fetch(`/api/hr/candidates?${params.toString()}`)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to fetch candidates')
      }

      const data = await response.json()

      setCandidates(data.candidates || [])
      setPageCount(data.totalPages || 0)
      setInitialLoading(false)
    } catch (error) {
      console.error('Error fetching candidates:', error)
      toast.error('Failed to load candidates')
      setCandidates([])
      setInitialLoading(false)
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, sorting, filters, search])

  useEffect(() => {
    fetchCandidates()
    if (view === 'kanban') {
      fetchAllCandidates()
    }
  }, [fetchCandidates, view, fetchAllCandidates])

  const handleSubmit = async (data: CandidateFormData) => {
    if (!clerkUser?.id) return

    try {
      const response = editingCandidate
        ? await fetch(`/api/hr/candidates/${editingCandidate.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...data,
              updated_at: new Date().toISOString(),
            }),
          })
        : await fetch('/api/hr/candidates', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...data,
              created_by: clerkUser.id,
            }),
          })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to save candidate')
      }

      toast.success(editingCandidate ? 'Candidate updated successfully' : 'Candidate created successfully')
      await fetchCandidates()
      setFormOpen(false)
      setEditingCandidate(null)
    } catch (error: any) {
      console.error('Error saving candidate:', error)
      toast.error(error.message || 'Failed to save candidate')
      throw error
    }
  }

  const handleDelete = async (candidate: CandidateFull) => {
    if (!confirm(`Are you sure you want to delete ${candidate.contact?.name || 'this candidate'}?`)) {
      return
    }

    try {
      const response = await fetch(`/api/hr/candidates/${candidate.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to delete candidate')
      }

      toast.success('Candidate deleted successfully')
      await fetchCandidates()
      if (view === 'kanban') {
        await fetchAllCandidates()
      }
    } catch (error: any) {
      console.error('Error deleting candidate:', error)
      toast.error(error.message || 'Failed to delete candidate')
    }
  }

  const handleStatusChange = async (candidateId: string, newStatus: CandidateStatus) => {
    try {
      const response = await fetch(`/api/hr/candidates/${candidateId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          updated_at: new Date().toISOString(),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to update candidate status')
      }

      await fetchCandidates()
      await fetchAllCandidates()
    } catch (error: any) {
      console.error('Error updating candidate status:', error)
      toast.error(error.message || 'Failed to update candidate status')
    }
  }

  const filterConfig = [
    {
      columnId: 'status',
      title: 'Status',
      options: [
        { label: 'New', value: 'new' },
        { label: 'Screening', value: 'screening' },
        { label: 'Shortlisted', value: 'shortlisted' },
        { label: 'Interviewing', value: 'interviewing' },
        { label: 'Offered', value: 'offered' },
        { label: 'Hired', value: 'hired' },
        { label: 'Rejected', value: 'rejected' },
        { label: 'Withdrawn', value: 'withdrawn' },
      ],
    },
    {
      columnId: 'source',
      title: 'Source',
      options: [
        { label: 'Website', value: 'website' },
        { label: 'Referral', value: 'referral' },
        { label: 'LinkedIn', value: 'linkedin' },
        { label: 'Indeed', value: 'indeed' },
        { label: 'Other', value: 'other' },
      ],
    },
  ]

  const columns = createCandidateColumns({
    onQuickView: (candidate) => {
      setSelectedCandidate(candidate)
      setDetailsModalOpen(true)
    },
    onView: (candidate) => {
      router.push(`/hr/candidates/${candidate.id}`)
    },
    onEdit: (candidate) => {
      setEditingCandidate(candidate)
      setFormOpen(true)
    },
    onDelete: handleDelete,
    onScheduleInterview: (candidate) => {
      router.push(`/hr/interviews?candidate_id=${candidate.id}`)
    },
    onLogCall: (candidate) => {
      router.push(`/hr/calls?candidate_id=${candidate.id}`)
    },
  })

  return (
    <div className="flex flex-1 flex-col min-w-0 h-full overflow-hidden">
      {/* Page Title and Subtitle with PageAccessHeader */}
      <div className="flex items-center justify-between mb-3 flex-shrink-0">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Candidates</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Manage your recruitment candidates</p>
        </div>
        <PageAccessHeader pagePath="/hr/candidates" />
      </div>

      {initialLoading ? (
        <ContactTableSkeleton />
      ) : (
        <DataTable
          columns={columns}
          data={candidates}
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
          searchPlaceholder="Search candidates..."
          page={page}
          pageSize={pageSize}
          view={view}
          onViewChange={setView}
          onAdd={() => {
            setEditingCandidate(null)
            setFormOpen(true)
          }}
          addButtonText="Add Candidate"
          addButtonIcon={<Plus className="h-4 w-4" />}
          secondaryButtons={[
            {
              label: 'Bulk Upload',
              icon: <Upload className="h-4 w-4" />,
              onClick: () => setBulkUploadOpen(true),
              variant: 'outline',
            },
          ]}
          renderCustomView={(viewType, data) => {
            if (viewType === 'kanban') {
              const filteredData = search
                ? allCandidates.filter((c) => {
                    const searchLower = search.toLowerCase()
                    return (
                      c.contact?.name?.toLowerCase().includes(searchLower) ||
                      c.contact?.email?.toLowerCase().includes(searchLower) ||
                      c.contact?.phone?.toLowerCase().includes(searchLower)
                    )
                  })
                : allCandidates

              return (
                <div className="flex-1 rounded-md border overflow-hidden min-w-0">
                  <CandidateKanban
                    data={filteredData}
                    onEdit={(candidate) => {
                      setEditingCandidate(candidate)
                      setFormOpen(true)
                    }}
                    onDelete={handleDelete}
                    onView={(candidate) => {
                      router.push(`/hr/candidates/${candidate.id}`)
                    }}
                    onStatusChange={handleStatusChange}
                    onAdd={() => {
                      setEditingCandidate(null)
                      setFormOpen(true)
                    }}
                  />
                </div>
              )
            }
            return null
          }}
        />
      )}

      <CandidateForm
        candidate={editingCandidate}
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open)
          if (!open) {
            setEditingCandidate(null)
          }
        }}
        onSubmit={handleSubmit}
      />

      <CandidateDetailsModal
        candidate={selectedCandidate}
        open={detailsModalOpen}
        onOpenChange={setDetailsModalOpen}
        onEdit={(candidate) => {
          setSelectedCandidate(null)
          setDetailsModalOpen(false)
          setEditingCandidate(candidate)
          setFormOpen(true)
        }}
        onDelete={handleDelete}
      />

      <BulkUploadDialog
        open={bulkUploadOpen}
        onOpenChange={setBulkUploadOpen}
        onSuccess={() => {
          fetchCandidates()
        }}
      />
    </div>
  )
}

export default function CandidatesPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <CandidatesPageContent />
    </Suspense>
  )
}

