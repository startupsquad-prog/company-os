'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import type { RecruitmentCallFull } from '@/lib/types/recruitment'
import type { SortingState, ColumnFiltersState } from '@tanstack/react-table'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'
import { DataTable } from '@/components/data-table/data-table'
import { createRecruitmentCallColumns } from './components/recruitment-call-columns'
import { RecruitmentCallForm } from './components/recruitment-call-form'
import { useUser } from '@clerk/nextjs'
import { PageLoader } from '@/components/ui/loader'
import { ContactTableSkeleton } from '@/app/crm/contacts/components/contact-table-skeleton'
import { PageAccessHeader } from '@/components/page-access/page-access-header'

function RecruitmentCallsPageContent() {
  const { user: clerkUser } = useUser()
  const [calls, setCalls] = useState<RecruitmentCallFull[]>([])
  const [loading, setLoading] = useState(true)
  const [initialLoading, setInitialLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [editingCall, setEditingCall] = useState<RecruitmentCallFull | null>(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [pageCount, setPageCount] = useState(0)
  const [sorting, setSorting] = useState<SortingState>([])
  const [filters, setFilters] = useState<ColumnFiltersState>([])
  const [search, setSearch] = useState('')

  const fetchCalls = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
        ...(search ? { search } : {}),
      })

      if (sorting.length > 0) {
        params.append('sortField', sorting[0].id || 'created_at')
        params.append('sortDirection', sorting[0].desc ? 'desc' : 'asc')
      }

      const response = await fetch(`/api/hr/calls?${params.toString()}`)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to fetch calls')
      }

      const data = await response.json()
      setCalls(data.calls || [])
      setPageCount(data.totalPages || 0)
      setInitialLoading(false)
    } catch (error) {
      console.error('Error fetching calls:', error)
      toast.error('Failed to load calls')
      setCalls([])
      setInitialLoading(false)
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, sorting, filters, search])

  useEffect(() => {
    fetchCalls()
  }, [fetchCalls])

  const handleSubmit = async (data: any) => {
    if (!clerkUser?.id) return

    try {
      const response = editingCall
        ? await fetch(`/api/hr/calls/${editingCall.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...data, updated_at: new Date().toISOString() }),
          })
        : await fetch('/api/hr/calls', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...data, created_by: clerkUser.id }),
          })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to save call')
      }

      toast.success(editingCall ? 'Call updated successfully' : 'Call created successfully')
      await fetchCalls()
      setFormOpen(false)
      setEditingCall(null)
    } catch (error: any) {
      toast.error(error.message || 'Failed to save call')
    }
  }

  const columns = createRecruitmentCallColumns({
    onEdit: (call) => {
      setEditingCall(call)
      setFormOpen(true)
    },
    onDelete: async (call) => {
      if (!confirm('Delete this call?')) return
      try {
        const response = await fetch(`/api/hr/calls/${call.id}`, { method: 'DELETE' })
        if (!response.ok) throw new Error('Failed to delete')
        toast.success('Call deleted')
        await fetchCalls()
      } catch (error: any) {
        toast.error(error.message)
      }
    },
  })

  return (
    <div className="flex flex-1 flex-col min-w-0 h-full overflow-hidden">
      <div className="flex items-center justify-between mb-3 flex-shrink-0">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Recruitment Calls</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Track calls with candidates</p>
        </div>
        <PageAccessHeader pagePath="/hr/calls" />
      </div>

      {initialLoading ? (
        <ContactTableSkeleton />
      ) : (
        <DataTable
          columns={columns}
          data={calls}
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
          searchPlaceholder="Search calls..."
          page={page}
          pageSize={pageSize}
          onAdd={() => {
            setEditingCall(null)
            setFormOpen(true)
          }}
          addButtonText="Log Call"
          addButtonIcon={<Plus className="h-4 w-4" />}
        />
      )}

      <RecruitmentCallForm
        call={editingCall}
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open)
          if (!open) setEditingCall(null)
        }}
        onSubmit={handleSubmit}
      />
    </div>
  )
}

export default function RecruitmentCallsPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <RecruitmentCallsPageContent />
    </Suspense>
  )
}


