'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import type { InterviewFull, InterviewFormData } from '@/lib/types/recruitment'
import type { SortingState, ColumnFiltersState } from '@tanstack/react-table'
import { toast } from 'sonner'
import { Plus, Sparkles } from 'lucide-react'
import { DataTable } from '@/components/data-table/data-table'
import { createInterviewColumns } from './components/interview-columns'
import { InterviewForm } from './components/interview-form'
import { InterviewDetailsModal } from './components/interview-details-modal'
import { useUser } from '@clerk/nextjs'
import { PageLoader } from '@/components/ui/loader'
import { ContactTableSkeleton } from '@/app/crm/contacts/components/contact-table-skeleton'
import { PageAccessHeader } from '@/components/page-access/page-access-header'

function InterviewsPageContent() {
  const { user: clerkUser } = useUser()
  const [interviews, setInterviews] = useState<InterviewFull[]>([])
  const [loading, setLoading] = useState(true)
  const [initialLoading, setInitialLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [editingInterview, setEditingInterview] = useState<InterviewFull | null>(null)
  const [selectedInterview, setSelectedInterview] = useState<InterviewFull | null>(null)
  const [detailsModalOpen, setDetailsModalOpen] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [pageCount, setPageCount] = useState(0)
  const [sorting, setSorting] = useState<SortingState>([])
  const [filters, setFilters] = useState<ColumnFiltersState>([])
  const [search, setSearch] = useState('')

  const fetchInterviews = useCallback(async () => {
    try {
      setLoading(true)

      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
        ...(search ? { search } : {}),
      })

      const typeFilter = filters.find((f) => f.id === 'interview_type')
      if (typeFilter && Array.isArray(typeFilter.value) && typeFilter.value.length > 0) {
        params.append('type', typeFilter.value.join(','))
      }

      const statusFilter = filters.find((f) => f.id === 'status')
      if (statusFilter && Array.isArray(statusFilter.value) && statusFilter.value.length > 0) {
        params.append('status', statusFilter.value.join(','))
      }

      if (sorting.length > 0) {
        params.append('sortField', sorting[0].id || 'scheduled_at')
        params.append('sortDirection', sorting[0].desc ? 'desc' : 'asc')
      }

      const response = await fetch(`/api/recruitment/interviews?${params.toString()}`)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to fetch interviews')
      }

      const data = await response.json()

      setInterviews(data.interviews || [])
      setPageCount(data.totalPages || 0)
      setInitialLoading(false)
    } catch (error) {
      console.error('Error fetching interviews:', error)
      toast.error('Failed to load interviews')
      setInterviews([])
      setInitialLoading(false)
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, sorting, filters, search])

  useEffect(() => {
    fetchInterviews()
  }, [fetchInterviews])

  const handleSubmit = async (data: InterviewFormData) => {
    if (!clerkUser?.id) return

    try {
      const response = editingInterview
        ? await fetch(`/api/recruitment/interviews/${editingInterview.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...data,
              updated_at: new Date().toISOString(),
            }),
          })
        : await fetch('/api/recruitment/interviews', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...data,
              created_by: clerkUser.id,
            }),
          })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to save interview')
      }

      toast.success(editingInterview ? 'Interview updated successfully' : 'Interview scheduled successfully')
      await fetchInterviews()
      setFormOpen(false)
      setEditingInterview(null)
    } catch (error: any) {
      console.error('Error saving interview:', error)
      toast.error(error.message || 'Failed to save interview')
      throw error
    }
  }

  const handleDelete = async (interview: InterviewFull) => {
    if (!confirm(`Are you sure you want to delete this interview?`)) {
      return
    }

    try {
      const response = await fetch(`/api/recruitment/interviews/${interview.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to delete interview')
      }

      toast.success('Interview deleted successfully')
      await fetchInterviews()
    } catch (error: any) {
      console.error('Error deleting interview:', error)
      toast.error(error.message || 'Failed to delete interview')
    }
  }

  const filterConfig = [
    {
      columnId: 'interview_type',
      title: 'Type',
      options: [
        { label: 'Phone Screen', value: 'phone_screen' },
        { label: 'Technical', value: 'technical' },
        { label: 'Behavioral', value: 'behavioral' },
        { label: 'Panel', value: 'panel' },
        { label: 'Final', value: 'final' },
        { label: 'Other', value: 'other' },
      ],
    },
    {
      columnId: 'status',
      title: 'Status',
      options: [
        { label: 'Scheduled', value: 'scheduled' },
        { label: 'In Progress', value: 'in_progress' },
        { label: 'Completed', value: 'completed' },
        { label: 'Cancelled', value: 'cancelled' },
        { label: 'No Show', value: 'no_show' },
      ],
    },
  ]

  const columns = createInterviewColumns({
    onView: (interview) => {
      setSelectedInterview(interview)
      setDetailsModalOpen(true)
    },
    onEdit: (interview) => {
      setEditingInterview(interview)
      setFormOpen(true)
    },
    onDelete: handleDelete,
  })

  const handleAiGenerateFollowUpEmail = () => {
    toast.info('AI Generate Follow-up Email - Coming soon!')
    // TODO: Implement AI follow-up email generation
  }

  return (
    <div className="flex flex-1 flex-col min-w-0 h-full overflow-hidden">
      {/* Page Title and Subtitle with PageAccessHeader */}
      <div className="flex items-center justify-between mb-3 flex-shrink-0">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Interviews</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Manage interview schedules and evaluations</p>
        </div>
        <PageAccessHeader pagePath="/hr/interviews" />
      </div>

      {initialLoading ? (
        <ContactTableSkeleton />
      ) : (
        <DataTable
          columns={columns}
          data={interviews}
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
          searchPlaceholder="Search interviews..."
          page={page}
          pageSize={pageSize}
          onAdd={() => {
            setEditingInterview(null)
            setFormOpen(true)
          }}
          addButtonText="Schedule Interview"
          addButtonIcon={<Plus className="h-4 w-4" />}
          aiGenerateButton={{
            label: 'AI Generate Follow-up Email',
            icon: <Sparkles className="h-4 w-4" />,
            onClick: handleAiGenerateFollowUpEmail,
          }}
        />
      )}

      <InterviewForm
        interview={editingInterview}
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open)
          if (!open) {
            setEditingInterview(null)
          }
        }}
        onSubmit={handleSubmit}
      />

      <InterviewDetailsModal
        interview={selectedInterview}
        open={detailsModalOpen}
        onOpenChange={setDetailsModalOpen}
        onEdit={(interview) => {
          setSelectedInterview(null)
          setDetailsModalOpen(false)
          setEditingInterview(interview)
          setFormOpen(true)
        }}
        onDelete={handleDelete}
      />
    </div>
  )
}

export default function InterviewsPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <InterviewsPageContent />
    </Suspense>
  )
}

