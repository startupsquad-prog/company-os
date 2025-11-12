'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import type { EvaluationFull } from '@/lib/types/recruitment'
import type { SortingState, ColumnFiltersState } from '@tanstack/react-table'
import { toast } from 'sonner'
import { DataTable } from '@/components/data-table/data-table'
import { createEvaluationColumns } from './components/evaluation-columns'
import { useUser } from '@clerk/nextjs'
import { PageLoader } from '@/components/ui/loader'
import { ContactTableSkeleton } from '@/app/crm/contacts/components/contact-table-skeleton'
import { PageAccessHeader } from '@/components/page-access/page-access-header'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

function EvaluationsPageContent() {
  const { user: clerkUser } = useUser()
  const [evaluations, setEvaluations] = useState<EvaluationFull[]>([])
  const [allEvaluations, setAllEvaluations] = useState<EvaluationFull[]>([]) // For counts
  const [loading, setLoading] = useState(true)
  const [initialLoading, setInitialLoading] = useState(true)
  const [quickFilter, setQuickFilter] = useState<string>('all')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [pageCount, setPageCount] = useState(0)
  const [sorting, setSorting] = useState<SortingState>([])
  const [filters, setFilters] = useState<ColumnFiltersState>([])
  const [search, setSearch] = useState('')

  const fetchEvaluations = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
        ...(search ? { search } : {}),
        ...(quickFilter !== 'all' ? { recommendation: quickFilter } : {}),
      })

      if (sorting.length > 0) {
        params.append('sortField', sorting[0].id || 'created_at')
        params.append('sortDirection', sorting[0].desc ? 'desc' : 'asc')
      }

      const response = await fetch(`/api/recruitment/evaluations?${params.toString()}`)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to fetch evaluations')
      }

      const data = await response.json()
      setEvaluations(data.evaluations || [])
      setPageCount(data.totalPages || 0)
      setInitialLoading(false)
    } catch (error) {
      console.error('Error fetching evaluations:', error)
      toast.error('Failed to load evaluations')
      setEvaluations([])
      setInitialLoading(false)
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, sorting, filters, search, quickFilter])

  // Fetch all evaluations for counts (unpaginated)
  const fetchAllEvaluations = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        page: '1',
        pageSize: '1000', // Large number to get all evaluations
      })

      const response = await fetch(`/api/recruitment/evaluations?${params.toString()}`)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to fetch evaluations')
      }

      const data = await response.json()
      setAllEvaluations(data.evaluations || [])
    } catch (error) {
      console.error('Error fetching all evaluations:', error)
      setAllEvaluations([])
    }
  }, [])

  useEffect(() => {
    fetchEvaluations()
    fetchAllEvaluations()
  }, [fetchEvaluations, fetchAllEvaluations])

  const columns = createEvaluationColumns()

  const quickFilters = [
    { label: 'All', value: 'all' },
    { label: 'Shortlisted', value: 'shortlisted' },
    { label: 'Offered', value: 'offered' },
    { label: 'Selected', value: 'selected' },
    { label: 'Hired', value: 'hired' },
  ]

  // Count evaluations by recommendation for tabs
  const getRecommendationCount = (recommendation: string) => {
    if (recommendation === 'all') return allEvaluations.length
    return allEvaluations.filter((evaluation) => evaluation.recommendation === recommendation).length
  }

  return (
    <div className="flex flex-1 flex-col min-w-0 h-full overflow-hidden">
      <div className="flex items-center justify-between mb-3 flex-shrink-0">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Evaluations</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Review interview evaluations</p>
        </div>
        <PageAccessHeader pagePath="/hr/evaluations" />
      </div>

      {/* Status Tabs */}
      <Tabs value={quickFilter} onValueChange={setQuickFilter} className="w-full mb-4 flex-shrink-0">
        <TabsList>
          {quickFilters.map((filter) => (
            <TabsTrigger key={filter.value} value={filter.value}>
              {filter.label} ({getRecommendationCount(filter.value)})
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {initialLoading ? (
        <ContactTableSkeleton />
      ) : (
        <DataTable
          columns={columns}
          data={evaluations}
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
          searchPlaceholder="Search evaluations..."
          page={page}
          pageSize={pageSize}
        />
      )}
    </div>
  )
}

export default function EvaluationsPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <EvaluationsPageContent />
    </Suspense>
  )
}


