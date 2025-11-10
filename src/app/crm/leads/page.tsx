'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { LeadFull, LeadFilters, LeadSort, LeadStatus } from '@/lib/types/leads'
import type { SortingState, ColumnFiltersState } from '@tanstack/react-table'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'
import { LeadTabs } from './components/lead-tabs'
import { useVerticalScope } from '@/lib/state/use-vertical-scope'
import { createLeadColumns } from './components/lead-columns'
import { LeadDetailsModal } from './components/lead-details-modal'
import { LeadForm } from './components/lead-form'
import { LeadQuickViewModal } from './components/lead-quick-view-modal'
import { LeadTableSkeleton } from './components/lead-table-skeleton'
import { PageLoader } from '@/components/ui/loader'

function LeadsPageContent() {
  const searchParams = useSearchParams()
  const { verticalScope } = useVerticalScope()
  const [leads, setLeads] = useState<LeadFull[]>([])
  const [loading, setLoading] = useState(true)
  const [initialLoading, setInitialLoading] = useState(true)
  const [view, setView] = useState<'table' | 'list' | 'kanban'>('table')
  const [selectedLead, setSelectedLead] = useState<LeadFull | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [quickViewOpen, setQuickViewOpen] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [editingLead, setEditingLead] = useState<LeadFull | null>(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [pageCount, setPageCount] = useState(0)
  const [total, setTotal] = useState(0)
  const [sorting, setSorting] = useState<SortingState>([])
  const [filters, setFilters] = useState<ColumnFiltersState>([])
  const [search, setSearch] = useState('')
  const [leadFilters, setLeadFilters] = useState<LeadFilters>({})

  // Update leadFilters when column filters change
  useEffect(() => {
    const statusFilter = filters.find((f) => f.id === 'status')
    setLeadFilters((prev) => ({
      ...prev,
      status: statusFilter
        ? Array.isArray(statusFilter.value)
          ? (statusFilter.value as LeadStatus[])
          : [statusFilter.value as LeadStatus]
        : undefined,
    }))
  }, [filters])

  // Fetch leads
  const fetchLeads = useCallback(async () => {
    try {
      setLoading(true)

      // Build query parameters
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
        ...(search ? { search } : {}),
        ...(verticalScope && verticalScope !== 'all' ? { verticalId: verticalScope } : {}),
      })

      // Add status filter
      if (leadFilters.status && leadFilters.status.length > 0) {
        params.append('status', leadFilters.status.join(','))
      }

      // Add owner filter
      if (leadFilters.owner_id && leadFilters.owner_id.length > 0) {
        params.append('owner_id', leadFilters.owner_id.join(','))
      }

      // Add source filter
      if (leadFilters.source && leadFilters.source.length > 0) {
        params.append('source', leadFilters.source.join(','))
      }

      // Add sorting
      if (sorting.length > 0) {
        params.append('sortField', sorting[0].id || 'created_at')
        params.append('sortDirection', sorting[0].desc ? 'desc' : 'asc')
      }

      // Fetch from unified API
      const response = await fetch(`/api/unified/leads?${params.toString()}`)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to fetch leads')
      }

      const data = await response.json()

      setLeads(data.leads || [])
      setTotal(data.total || 0)
      setPageCount(data.totalPages || 0)
      setInitialLoading(false)
    } catch (error) {
      console.error('Error fetching leads:', error)
      toast.error('Failed to load leads')
      setLeads([])
      setInitialLoading(false)
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, sorting, leadFilters, search, verticalScope])

  useEffect(() => {
    fetchLeads()
  }, [fetchLeads])

  // Handle lead status change
  const handleStatusChange = async (leadId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/crm/leads/${leadId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) throw new Error('Failed to update status')

      toast.success('Lead status updated')
      fetchLeads()

      // Update selected lead if it's the one being updated
      if (selectedLead?.id === leadId) {
        const updatedLead = await fetch(`/api/crm/leads/${leadId}`).then((r) => r.json())
        setSelectedLead(updatedLead)
      }
    } catch (error) {
      console.error('Error updating status:', error)
      toast.error('Failed to update lead status')
    }
  }

  // Handle delete
  const handleDelete = async (lead: LeadFull) => {
    if (!confirm(`Are you sure you want to delete this lead?`)) return

    try {
      const response = await fetch(`/api/crm/leads/${lead.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to delete lead')

      toast.success('Lead deleted')
      fetchLeads()

      if (selectedLead?.id === lead.id) {
        setSelectedLead(null)
        setModalOpen(false)
      }
    } catch (error) {
      console.error('Error deleting lead:', error)
      toast.error('Failed to delete lead')
    }
  }

  const columns = createLeadColumns({
    onView: (lead) => {
      setSelectedLead(lead)
      setModalOpen(true)
    },
    onEdit: (lead) => {
      setEditingLead(lead)
      setFormOpen(true)
    },
    onDelete: handleDelete,
    onStatusChange: handleStatusChange,
  })

  const statusOptions = [
    { label: 'New', value: 'new' },
    { label: 'Contacted', value: 'contacted' },
    { label: 'Qualified', value: 'qualified' },
    { label: 'Proposal', value: 'proposal' },
    { label: 'Negotiation', value: 'negotiation' },
    { label: 'Won', value: 'won' },
    { label: 'Lost', value: 'lost' },
  ]

  const filterConfig = [
    {
      columnId: 'status',
      title: 'Status',
      options: statusOptions,
    },
  ]

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Leads</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Manage and track your sales leads</p>
        </div>
        <button
          onClick={() => {
            setEditingLead(null)
            setFormOpen(true)
          }}
          className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
        >
          <Plus className="mr-2 h-4 w-4" />
          Create Lead
        </button>
      </div>

      {initialLoading ? (
        <LeadTableSkeleton />
      ) : (
        <LeadTabs
          defaultView="table"
          columns={columns}
          data={leads}
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
          onAdd={() => {
            setEditingLead(null)
            setFormOpen(true)
          }}
          onEdit={(lead) => {
            setEditingLead(lead)
            setFormOpen(true)
          }}
          onDelete={handleDelete}
          onView={(lead) => {
            setSelectedLead(lead)
            setModalOpen(true)
          }}
          onStatusChange={handleStatusChange}
          statusOptions={statusOptions}
          filterConfig={filterConfig}
          searchPlaceholder="Search leads..."
          addButtonText="Create Lead"
          addButtonIcon={<Plus className="mr-2 h-4 w-4" />}
        />
      )}

      <LeadDetailsModal
        lead={selectedLead}
        open={modalOpen}
        onOpenChange={setModalOpen}
        onEdit={(lead) => {
          setEditingLead(lead)
          setModalOpen(false)
          setFormOpen(true)
        }}
        onDelete={handleDelete}
        allLeads={leads}
        onLeadChange={(newLead) => {
          setSelectedLead(newLead)
        }}
      />

      <LeadQuickViewModal
        lead={selectedLead}
        open={quickViewOpen}
        onOpenChange={setQuickViewOpen}
        onStatusChange={handleStatusChange}
      />

      <LeadForm
        lead={editingLead}
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open)
          if (!open) {
            setEditingLead(null)
          }
        }}
        onSuccess={() => {
          setFormOpen(false)
          setEditingLead(null)
          fetchLeads()
        }}
      />
    </>
  )
}

export default function LeadsPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <LeadsPageContent />
    </Suspense>
  )
}
