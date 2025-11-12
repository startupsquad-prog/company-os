'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
// Removed Supabase client import - now using API routes with Drizzle
import type { TicketFull, TicketFormData } from '@/lib/types/tickets'
import type { SortingState, ColumnFiltersState } from '@tanstack/react-table'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'
import { DataTable } from '@/components/data-table/data-table'
import { createTicketColumns } from './components/ticket-columns'
import { TicketForm } from './components/ticket-form'
import { TicketMetrics } from './components/ticket-metrics'
import { TicketKanban } from './components/ticket-kanban'
import { TicketDetailsModal } from './components/ticket-details-modal'
import { useUser } from '@clerk/nextjs'
import { PageLoader } from '@/components/ui/loader'
import { ContactTableSkeleton } from '@/app/crm/contacts/components/contact-table-skeleton'

function TicketsPageContent() {
  const { user: clerkUser } = useUser()
  const [tickets, setTickets] = useState<TicketFull[]>([])
  const [loading, setLoading] = useState(true)
  const [initialLoading, setInitialLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [editingTicket, setEditingTicket] = useState<TicketFull | null>(null)
  const [selectedTicket, setSelectedTicket] = useState<TicketFull | null>(null)
  const [detailsModalOpen, setDetailsModalOpen] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [pageCount, setPageCount] = useState(0)
  const [sorting, setSorting] = useState<SortingState>([])
  const [filters, setFilters] = useState<ColumnFiltersState>([])
  const [search, setSearch] = useState('')
  const [allTickets, setAllTickets] = useState<TicketFull[]>([])
  const [view, setView] = useState<'table' | 'kanban'>('table')

  const fetchTickets = useCallback(async () => {
    // Auth check temporarily removed for testing
    // if (!clerkUser?.id) {
    //   console.log('[Tickets] No clerkUser.id, skipping fetch')
    //   return
    // }

    try {
      console.log('[Tickets] Starting fetchTickets', { page, pageSize, search, filters: filters.length, sorting: sorting.length })
      setLoading(true)

      // Build query parameters
      // For kanban view, fetch all tickets (use large pageSize)
      const isKanbanView = view === 'kanban'
      const params = new URLSearchParams({
        page: isKanbanView ? '1' : page.toString(),
        pageSize: isKanbanView ? '1000' : pageSize.toString(),
        view: view,
        ...(search ? { search } : {}),
      })

      // Add status filter
      const statusFilter = filters.find((f) => f.id === 'status')
      if (statusFilter && statusFilter.value) {
        const values = Array.isArray(statusFilter.value) ? statusFilter.value : [statusFilter.value]
        params.append('status', values.join(','))
      }

      // Add priority filter
      const priorityFilter = filters.find((f) => f.id === 'priority')
      if (priorityFilter && priorityFilter.value) {
        const values = Array.isArray(priorityFilter.value) ? priorityFilter.value : [priorityFilter.value]
        params.append('priority', values.join(','))
      }

      // Add sorting
      if (sorting.length > 0) {
        params.append('sortField', sorting[0].id || 'created_at')
        params.append('sortDirection', sorting[0].desc ? 'desc' : 'asc')
      }

      console.log('[Tickets] Fetching from API:', `/api/unified/tickets?${params.toString()}`)
      const response = await fetch(`/api/unified/tickets?${params.toString()}`)

      console.log('[Tickets] Response status:', response.status, response.statusText)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        console.error('[Tickets] API error response:', errorData)
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      console.log('[Tickets] API response:', {
        dataCount: result.data?.length || 0,
        totalPages: result.totalPages,
        count: result.count
      })

      setTickets(result.data || [])
      // For kanban, also update allTickets
      if (isKanbanView) {
        setAllTickets(result.data || [])
      }
      setPageCount(result.totalPages || 0)
      console.log('[Tickets] Successfully fetched tickets:', result.data?.length || 0)
    } catch (error: any) {
      console.error('[Tickets] Error fetching tickets:', {
        message: error?.message || 'Unknown error',
        code: error?.code,
        details: error?.details,
        hint: error?.hint,
        name: error?.name,
        stack: error?.stack,
        fullError: error ? JSON.stringify(error, Object.getOwnPropertyNames(error), 2) : 'No error object'
      })
      toast.error(`Failed to load tickets: ${error?.message || 'Unknown error'}`)
      setTickets([])
      setPageCount(0)
    } finally {
      setLoading(false)
      setInitialLoading(false)
    }
  }, [page, pageSize, sorting, filters, search, view]) // Removed clerkUser?.id dependency for testing

  // Fetch all tickets for metrics (unpaginated)
  const fetchAllTickets = useCallback(async () => {
    // Auth check temporarily removed for testing
    // if (!clerkUser?.id) {
    //   return
    // }

    try {
      // Build query parameters for all tickets (no pagination)
      const params = new URLSearchParams({
        page: '1',
        pageSize: '1000', // Large number to get all tickets
      })

      const response = await fetch(`/api/unified/tickets?${params.toString()}`)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      setAllTickets(result.data || [])
    } catch (error: any) {
      console.error('[Tickets] Error fetching all tickets for metrics:', error)
      // Set empty array on error so metrics don't break
      setAllTickets([])
    }
  }, []) // Removed clerkUser?.id dependency for testing

  useEffect(() => {
    fetchTickets()
    fetchAllTickets()
  }, [fetchTickets, fetchAllTickets])

  const handleSubmit = async (data: TicketFormData) => {
    if (!clerkUser?.id) return

    try {
      if (editingTicket) {
        // Update existing ticket via API
        const response = await fetch(`/api/unified/tickets/${editingTicket.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...data,
            updated_at: new Date().toISOString(),
          }),
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || 'Failed to update ticket')
        }
        toast.success('Ticket updated successfully')
      } else {
        // Create new ticket via API
        const response = await fetch('/api/unified/tickets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...data,
            created_by: clerkUser.id,
          }),
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || 'Failed to create ticket')
        }
        toast.success('Ticket created successfully')
      }

      await fetchTickets()
      await fetchAllTickets() // Refresh metrics
    } catch (error: any) {
      console.error('Error saving ticket:', error)
      toast.error(error.message || 'Failed to save ticket')
      throw error
    }
  }

  const handleDelete = async (ticket: TicketFull) => {
    if (!clerkUser?.id) return
    if (!confirm(`Are you sure you want to delete ${ticket.ticket_number}?`)) return

    try {
      const response = await fetch(`/api/unified/tickets/${ticket.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to delete ticket')
      }
      toast.success('Ticket deleted successfully')
      await fetchTickets()
      await fetchAllTickets() // Refresh metrics
    } catch (error: any) {
      console.error('Error deleting ticket:', error)
      toast.error('Failed to delete ticket')
    }
  }

  const columns = createTicketColumns({
    onView: (ticket) => {
      setSelectedTicket(ticket)
      setDetailsModalOpen(true)
    },
    onEdit: (ticket) => {
      setEditingTicket(ticket)
      setFormOpen(true)
    },
    onDelete: handleDelete,
  })

  const filterConfig = [
    {
      columnId: 'status',
      title: 'Status',
      options: [
        { label: 'New', value: 'new' },
        { label: 'Open', value: 'open' },
        { label: 'In Progress', value: 'in_progress' },
        { label: 'Waiting', value: 'waiting' },
        { label: 'Resolved', value: 'resolved' },
        { label: 'Closed', value: 'closed' },
        { label: 'Cancelled', value: 'cancelled' },
      ],
    },
    {
      columnId: 'priority',
      title: 'Priority',
      options: [
        { label: 'Low', value: 'low' },
        { label: 'Medium', value: 'medium' },
        { label: 'High', value: 'high' },
        { label: 'Critical', value: 'critical' },
      ],
    },
  ]

  const statusOptions = filterConfig.find((f) => f.columnId === 'status')?.options || []

  const handleStatusChange = async (ticketId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/unified/tickets/${ticketId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          updated_at: new Date().toISOString(),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to update ticket status')
      }

      // Refresh tickets
      await fetchTickets()
      await fetchAllTickets()
    } catch (error: any) {
      console.error('Error updating ticket status:', error)
      toast.error('Failed to update ticket status')
      throw error
    }
  }

  const renderCustomView = (viewType: string, data: TicketFull[]) => {
    if (viewType === 'kanban') {
      // Apply filters to data for kanban
      let filteredData = data
      if (filters.length > 0) {
        filteredData = data.filter((ticket) => {
          return filters.every((filter) => {
            if (filter.id === 'priority' && filter.value) {
              const values = Array.isArray(filter.value) ? filter.value : [filter.value]
              return values.includes(ticket.priority || '')
            }
            return true
          })
        })
      }
      if (search) {
        filteredData = filteredData.filter(
          (ticket) =>
            ticket.title.toLowerCase().includes(search.toLowerCase()) ||
            ticket.ticket_number.toLowerCase().includes(search.toLowerCase()) ||
            ticket.description?.toLowerCase().includes(search.toLowerCase()) ||
            ticket.client_name?.toLowerCase().includes(search.toLowerCase())
        )
      }

      return (
        <div className="flex flex-col gap-4 flex-1 min-w-0 h-full overflow-hidden">
          {/* Kanban Board */}
          <div className="flex-1 rounded-md border overflow-hidden min-w-0 h-full flex flex-col">
            {initialLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-muted-foreground">Loading kanban board...</div>
              </div>
            ) : (
              <div className="flex-1 overflow-hidden min-w-0">
                <TicketKanban
                  data={filteredData}
                  statusOptions={statusOptions}
                  onEdit={(ticket) => {
                    setEditingTicket(ticket)
                    setFormOpen(true)
                  }}
                  onDelete={handleDelete}
                  onView={(ticket) => {
                    setSelectedTicket(ticket)
                    setDetailsModalOpen(true)
                  }}
                  onStatusChange={handleStatusChange}
                  onAdd={() => {
                    setEditingTicket(null)
                    setFormOpen(true)
                  }}
                />
              </div>
            )}
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <>
      <div className="flex flex-1 flex-col min-w-0 h-full overflow-hidden">
        {/* Page Title and Subtitle - Before Metrics */}
        <div className="flex items-center justify-between mb-3 flex-shrink-0">
          <div>
            <h1 className="text-lg font-semibold tracking-tight">Tickets</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Manage support tickets and issues</p>
          </div>
        </div>

        {/* Metrics Section */}
        <TicketMetrics tickets={allTickets} loading={initialLoading} />

        {initialLoading ? (
          <ContactTableSkeleton />
        ) : (
          <DataTable
            columns={columns}
            data={view === 'kanban' ? allTickets : tickets}
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
            onViewChange={(v) => setView(v as 'table' | 'kanban')}
            onAdd={() => {
              setEditingTicket(null)
              setFormOpen(true)
            }}
            onEdit={(ticket) => {
              setEditingTicket(ticket)
              setFormOpen(true)
            }}
            onDelete={handleDelete}
            filterConfig={filterConfig}
            searchPlaceholder="Search tickets..."
            addButtonText="New Ticket"
            addButtonIcon={<Plus className="mr-2 h-4 w-4" />}
            renderCustomView={renderCustomView}
          />
        )}
      </div>

      <TicketForm
        ticket={editingTicket}
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open)
          if (!open) {
            setEditingTicket(null)
          }
        }}
        onSubmit={handleSubmit}
      />

      <TicketDetailsModal
        ticket={selectedTicket}
        open={detailsModalOpen}
        onOpenChange={(open) => {
          setDetailsModalOpen(open)
          if (!open) {
            setSelectedTicket(null)
          }
        }}
        onEdit={(ticket) => {
          setSelectedTicket(null)
          setDetailsModalOpen(false)
          setEditingTicket(ticket)
          setFormOpen(true)
        }}
        onUpdate={async (updatedTicket) => {
          // Update the ticket in the list and refresh, but keep details modal open
          setSelectedTicket(updatedTicket)
          await fetchTickets()
          if (view === 'kanban') {
            await fetchAllTickets()
          }
        }}
        onDelete={handleDelete}
        allTickets={view === 'kanban' ? allTickets : tickets}
        onTicketChange={(ticket) => {
          setSelectedTicket(ticket)
        }}
      />
    </>
  )
}

export default function TicketsPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <TicketsPageContent />
    </Suspense>
  )
}
