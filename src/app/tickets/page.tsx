'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { TicketFull, TicketFormData } from '@/lib/types/tickets'
import type { SortingState, ColumnFiltersState } from '@tanstack/react-table'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'
import { DataTable } from '@/components/data-table/data-table'
import { createTicketColumns } from './components/ticket-columns'
import { TicketForm } from './components/ticket-form'
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
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [pageCount, setPageCount] = useState(0)
  const [sorting, setSorting] = useState<SortingState>([])
  const [filters, setFilters] = useState<ColumnFiltersState>([])
  const [search, setSearch] = useState('')

  const fetchTickets = useCallback(async () => {
    if (!clerkUser?.id) return

    try {
      setLoading(true)
      const supabase = createClient()

      let query = supabase
        .from('tickets')
        .select('*, client:contacts(id, name, email), assignee:profiles(id, first_name, last_name)', { count: 'exact' })
        .is('deleted_at', null)

      if (search) {
        query = query.or(`ticket_number.ilike.%${search}%,title.ilike.%${search}%,description.ilike.%${search}%,client_name.ilike.%${search}%`)
      }

      const statusFilter = filters.find((f) => f.id === 'status')
      if (statusFilter && statusFilter.value) {
        const values = Array.isArray(statusFilter.value) ? statusFilter.value : [statusFilter.value]
        query = query.in('status', values)
      }

      const priorityFilter = filters.find((f) => f.id === 'priority')
      if (priorityFilter && priorityFilter.value) {
        const values = Array.isArray(priorityFilter.value) ? priorityFilter.value : [priorityFilter.value]
        query = query.in('priority', values)
      }

      if (sorting.length > 0) {
        const sort = sorting[0]
        query = query.order(sort.id, { ascending: sort.desc !== true })
      } else {
        query = query.order('created_at', { ascending: false })
      }

      const from = (page - 1) * pageSize
      const to = from + pageSize - 1
      query = query.range(from, to)

      const { data, error, count } = await query

      if (error) throw error

      setTickets(data || [])
      setPageCount(count ? Math.ceil(count / pageSize) : 0)
    } catch (error: any) {
      console.error('Error fetching tickets:', error)
      toast.error('Failed to load tickets')
    } finally {
      setLoading(false)
      setInitialLoading(false)
    }
  }, [clerkUser?.id, page, pageSize, sorting, filters, search])

  useEffect(() => {
    fetchTickets()
  }, [fetchTickets])

  const handleSubmit = async (data: TicketFormData) => {
    if (!clerkUser?.id) return

    try {
      const supabase = createClient()

      if (editingTicket) {
        const { error } = await supabase
          .from('tickets')
          .update({
            ...data,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingTicket.id)

        if (error) throw error
        toast.success('Ticket updated successfully')
      } else {
        // Generate ticket number
        const ticketNum = `TKT-${Date.now().toString().slice(-6)}`
        const { error } = await supabase.from('tickets').insert({
          ...data,
          ticket_number: ticketNum,
          created_by: clerkUser.id,
        })

        if (error) throw error
        toast.success('Ticket created successfully')
      }

      await fetchTickets()
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
      const supabase = createClient()
      const { error } = await supabase
        .from('tickets')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', ticket.id)

      if (error) throw error
      toast.success('Ticket deleted successfully')
      await fetchTickets()
    } catch (error: any) {
      console.error('Error deleting ticket:', error)
      toast.error('Failed to delete ticket')
    }
  }

  const columns = createTicketColumns({
    onView: () => {},
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

  return (
    <>
      <div className="flex flex-1 flex-col min-w-0 h-full overflow-hidden">
        <div className="flex items-center justify-between mb-4 flex-shrink-0">
          <div>
            <h1 className="text-lg font-semibold tracking-tight">Tickets</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Manage support tickets and issues</p>
          </div>
        </div>

        {initialLoading ? (
          <ContactTableSkeleton />
        ) : (
          <DataTable
            columns={columns}
            data={tickets}
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
