'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import type { LeadFull, LeadFilters, LeadSort, LeadStatus } from '@/lib/types/leads'
import type { SortingState, ColumnFiltersState } from '@tanstack/react-table'
import { toast } from 'sonner'
import { Plus, Sparkles } from 'lucide-react'
import { DataTable } from '@/components/data-table/data-table'
import { LeadKanban } from './components/lead-kanban'
import { LeadList } from './components/lead-list'
import { LeadMetrics } from './components/lead-metrics'
import { useVerticalScope } from '@/lib/state/use-vertical-scope'
import { createLeadColumns } from './components/lead-columns'
import { LeadForm } from './components/lead-form'
import { LeadTableSkeleton } from './components/lead-table-skeleton'
import { CloseLeadDialog } from './components/close-lead-dialog'
import { PageLoader } from '@/components/ui/loader'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { createClient } from '@/lib/supabase/client'

function LeadsPageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { verticalScope } = useVerticalScope()
  const [leads, setLeads] = useState<LeadFull[]>([])
  const [allLeads, setAllLeads] = useState<LeadFull[]>([]) // For metrics
  const [loading, setLoading] = useState(true)
  const [initialLoading, setInitialLoading] = useState(true)
  const [view, setView] = useState<'table' | 'list' | 'kanban'>('table')
  const [formOpen, setFormOpen] = useState(false)
  const [editingLead, setEditingLead] = useState<LeadFull | null>(null)
  const [closeDialogOpen, setCloseDialogOpen] = useState(false)
  const [pendingCloseLead, setPendingCloseLead] = useState<{ lead: LeadFull; status: 'won' | 'lost' } | null>(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [pageCount, setPageCount] = useState(0)
  const [total, setTotal] = useState(0)
  const [sorting, setSorting] = useState<SortingState>([])
  const [filters, setFilters] = useState<ColumnFiltersState>([])
  const [search, setSearch] = useState('')
  const [leadFilters, setLeadFilters] = useState<LeadFilters>({})
  const [statusFilter, setStatusFilter] = useState<string>('all')

  // Update leadFilters when status tab changes
  useEffect(() => {
    if (statusFilter === 'all') {
      setLeadFilters((prev) => ({
        ...prev,
        status: undefined,
      }))
    } else {
      setLeadFilters((prev) => ({
        ...prev,
        status: [statusFilter as LeadStatus],
      }))
    }
  }, [statusFilter])

  // Update leadFilters when column filters change (for other filters)
  useEffect(() => {
    const ownerFilter = filters.find((f) => f.id === 'owner')
    const sourceFilter = filters.find((f) => f.id === 'source')
    setLeadFilters((prev) => ({
      ...prev,
      owner_id: ownerFilter
        ? Array.isArray(ownerFilter.value)
          ? (ownerFilter.value as string[])
          : [ownerFilter.value as string]
        : undefined,
      source: sourceFilter
        ? Array.isArray(sourceFilter.value)
          ? (sourceFilter.value as string[])
          : [sourceFilter.value as string]
        : undefined,
    }))
  }, [filters])

  // Fetch all leads for metrics (unpaginated)
  const fetchAllLeads = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        page: '1',
        pageSize: '1000', // Large number to get all leads
        ...(verticalScope && verticalScope !== 'all' ? { verticalId: verticalScope } : {}),
      })

      const response = await fetch(`/api/unified/leads?${params.toString()}`)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to fetch leads')
      }

      const data = await response.json()
      setAllLeads(data.leads || [])
    } catch (error) {
      console.error('Error fetching all leads:', error)
      setAllLeads([])
    }
  }, [verticalScope])

  // Fetch leads with pagination
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
    fetchAllLeads()
  }, [fetchLeads, fetchAllLeads])

  // Handle lead status change
  const handleStatusChange = async (leadId: string, newStatus: string) => {
    console.log('handleStatusChange called:', { leadId, newStatus })
    
    // If changing to won or lost, show the close dialog
    if (newStatus === 'won' || newStatus === 'lost') {
      console.log('Intercepting won/lost status change, showing dialog')
      
      // Try to find lead in current arrays
      let lead = [...leads, ...allLeads].find((l) => l.id === leadId)
      console.log('Lead found in arrays:', !!lead)
      
      // If not found, fetch it from API
      if (!lead) {
        console.log('Lead not in arrays, fetching from API...')
        try {
          const response = await fetch(`/api/unified/leads/${leadId}`)
          if (response.ok) {
            const data = await response.json()
            lead = data.data
            console.log('Lead fetched from API:', !!lead)
          }
        } catch (error) {
          console.error('Error fetching lead:', error)
        }
      }

      // If we have the lead, show dialog
      if (lead) {
        console.log('Setting pending close lead and opening dialog')
        setPendingCloseLead({ lead, status: newStatus as 'won' | 'lost' })
        setCloseDialogOpen(true)
        return
      } else {
        console.error('Could not find lead, showing error')
        toast.error('Could not find lead details')
        return
      }
    }

    // For other status changes, update directly
    try {
      const response = await fetch(`/api/unified/leads/${leadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) throw new Error('Failed to update status')

      toast.success('Lead status updated')
      fetchLeads()
      fetchAllLeads() // Refresh metrics
    } catch (error) {
      console.error('Error updating status:', error)
      toast.error('Failed to update lead status')
    }
  }

  // Handle close lead confirmation
  const handleCloseLeadConfirm = async (data: {
    amount?: number
    service?: string
    screenshot?: File
  }) => {
    if (!pendingCloseLead) return

    try {
      const supabase = createClient()
      let screenshotUrl: string | null = null

      // Upload screenshot if provided
      if (data.screenshot) {
        const fileExt = data.screenshot.name.split('.').pop()
        const fileName = `${Date.now()}.${fileExt}`
        const filePath = `${pendingCloseLead.lead.id}/${fileName}`

        const { error: uploadError, data: uploadData } = await supabase.storage
          .from('lead-screenshots')
          .upload(filePath, data.screenshot)

        if (uploadError) {
          // If bucket doesn't exist, try to create it or use a fallback
          if (uploadError.message?.includes('Bucket not found')) {
            toast.error('Storage bucket not found. Please contact administrator.')
            throw uploadError
          }
          throw uploadError
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('lead-screenshots')
          .getPublicUrl(filePath)
        
        screenshotUrl = urlData.publicUrl
      }

      // Update lead with status and additional data
      const updateData: any = {
        status: pendingCloseLead.status,
        value: data.amount || pendingCloseLead.lead.value,
        meta: {
          ...(pendingCloseLead.lead.meta || {}),
          closed_amount: data.amount,
          closed_service: data.service,
          closed_screenshot: screenshotUrl,
          closed_at: new Date().toISOString(),
        },
      }

      const response = await fetch(`/api/unified/leads/${pendingCloseLead.lead.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      })

      if (!response.ok) throw new Error('Failed to update lead')

      toast.success(`Lead marked as ${pendingCloseLead.status === 'won' ? 'Won' : 'Lost'}`)
      fetchLeads()
      fetchAllLeads() // Refresh metrics
    } catch (error) {
      console.error('Error closing lead:', error)
      toast.error('Failed to close lead')
      throw error
    }
  }

  // Handle delete
  const handleDelete = async (lead: LeadFull) => {
    if (!confirm(`Are you sure you want to delete this lead?`)) return

    try {
      const response = await fetch(`/api/unified/leads/${lead.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to delete lead')

      toast.success('Lead deleted')
      fetchLeads()
      fetchAllLeads() // Refresh metrics
    } catch (error) {
      console.error('Error deleting lead:', error)
      toast.error('Failed to delete lead')
    }
  }

  const columns = createLeadColumns({
    onView: (lead) => {
      router.push(`/crm/leads/${lead.id}`)
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

  // Count leads by status for status tabs
  const getStatusCount = (status: string) => {
    if (status === 'all') return allLeads.length
    return allLeads.filter((lead) => lead.status === status).length
  }

  const handleAiGenerateProposal = () => {
    toast.info('AI Generate Proposal - Coming soon!')
    // TODO: Implement AI proposal generation
  }

  const filterConfig = [
    {
      columnId: 'owner',
      title: 'Owner',
      options: [], // Will be populated if needed
    },
    {
      columnId: 'source',
      title: 'Source',
      options: [], // Will be populated if needed
    },
  ]

  // Filter leads based on status filter for kanban/list views
  const getFilteredLeads = useCallback(() => {
    if (view === 'table') {
      return leads
    }
    
    // For kanban and list views, use allLeads and filter by status
    let filtered = allLeads
    
    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((lead) => lead.status === statusFilter)
    }
    
    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase()
      filtered = filtered.filter(
        (lead) =>
          lead.contact?.name?.toLowerCase().includes(searchLower) ||
          lead.contact?.email?.toLowerCase().includes(searchLower) ||
          lead.contact?.phone?.toLowerCase().includes(searchLower) ||
          lead.company?.name?.toLowerCase().includes(searchLower) ||
          lead.notes?.toLowerCase().includes(searchLower)
      )
    }
    
    return filtered
  }, [view, allLeads, leads, statusFilter, search])

  // Render custom views (kanban, list)
  const renderCustomView = (view: string, data: LeadFull[]) => {
    // Use filtered data instead of passed data
    const filteredData = getFilteredLeads()
    
    if (view === 'kanban') {
      return (
        <div className="flex-1 rounded-md border overflow-hidden min-w-0">
          <LeadKanban
            data={filteredData}
            statusOptions={statusOptions}
            onEdit={(lead) => {
              setEditingLead(lead)
              setFormOpen(true)
            }}
            onDelete={handleDelete}
            onView={(lead) => {
              router.push(`/crm/leads/${lead.id}`)
            }}
            onStatusChange={handleStatusChange}
            onAdd={() => {
              setEditingLead(null)
              setFormOpen(true)
            }}
          />
        </div>
      )
    }

    if (view === 'list') {
      return (
        <div className="flex-1 rounded-md border overflow-hidden min-w-0">
          <LeadList
            data={filteredData}
            onEdit={(lead) => {
              setEditingLead(lead)
              setFormOpen(true)
            }}
            onDelete={handleDelete}
            onView={(lead) => {
              router.push(`/crm/leads/${lead.id}`)
            }}
            onStatusChange={handleStatusChange}
            onAdd={() => {
              setEditingLead(null)
              setFormOpen(true)
            }}
          />
        </div>
      )
    }

    return null
  }

  return (
    <div className="flex flex-1 flex-col min-w-0 h-full overflow-hidden">
      {/* Page Title and Subtitle */}
      <div className="flex items-center justify-between mb-3 flex-shrink-0">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Leads</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Manage and track your sales leads</p>
        </div>
      </div>

      {/* Metrics */}
      <LeadMetrics leads={allLeads} loading={initialLoading} />

      {/* Status Tabs */}
      <Tabs value={statusFilter} onValueChange={setStatusFilter} className="w-full mb-4 flex-shrink-0">
        <TabsList>
          <TabsTrigger value="all">
            All ({getStatusCount('all')})
          </TabsTrigger>
          {statusOptions.map((option) => (
            <TabsTrigger key={option.value} value={option.value}>
              {option.label} ({getStatusCount(option.value)})
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Data Table with view toggle in toolbar */}
      {initialLoading ? (
        <LeadTableSkeleton />
      ) : (
        <div className="flex-1 overflow-hidden min-h-0">
          <DataTable
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
            view={view}
            onViewChange={(v) => setView(v as 'table' | 'list' | 'kanban')}
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
              router.push(`/crm/leads/${lead.id}`)
            }}
            filterConfig={filterConfig}
            searchPlaceholder="Search leads..."
            addButtonText="Create Lead"
            addButtonIcon={<Plus className="mr-2 h-4 w-4" />}
            aiGenerateButton={{
              label: 'AI Generate Proposal',
              icon: <Sparkles className="h-4 w-4" />,
              onClick: handleAiGenerateProposal,
            }}
            renderCustomView={renderCustomView}
          />
        </div>
      )}

      {/* Form */}
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
          fetchAllLeads() // Refresh metrics
        }}
      />

      <CloseLeadDialog
        open={closeDialogOpen}
        onOpenChange={(open) => {
          setCloseDialogOpen(open)
          if (!open) {
            setPendingCloseLead(null)
          }
        }}
        lead={pendingCloseLead?.lead || null}
        status={pendingCloseLead?.status || 'won'}
        onConfirm={handleCloseLeadConfirm}
      />
    </div>
  )
}

export default function LeadsPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <LeadsPageContent />
    </Suspense>
  )
}
