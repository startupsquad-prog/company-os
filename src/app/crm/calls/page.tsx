'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { CallFull, CallFormData } from '@/lib/types/calls'
import type { SortingState, ColumnFiltersState } from '@tanstack/react-table'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'
import { DataTable } from '@/components/data-table/data-table'
import { createCallColumns } from './components/call-columns'
import { CallForm } from './components/call-form'
import { useUser } from '@clerk/nextjs'
import { PageLoader } from '@/components/ui/loader'
import { ContactTableSkeleton } from '@/app/crm/contacts/components/contact-table-skeleton'

function CallsPageContent() {
  const { user: clerkUser } = useUser()
  const [calls, setCalls] = useState<CallFull[]>([])
  const [loading, setLoading] = useState(true)
  const [initialLoading, setInitialLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [editingCall, setEditingCall] = useState<CallFull | null>(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [pageCount, setPageCount] = useState(0)
  const [sorting, setSorting] = useState<SortingState>([])
  const [filters, setFilters] = useState<ColumnFiltersState>([])
  const [search, setSearch] = useState('')

  const fetchCalls = useCallback(async () => {
    if (!clerkUser?.id) return

    try {
      setLoading(true)
      const supabase = createClient()

      // Use schema-aware query - calls is in crm schema
      // Note: Foreign key references across schemas may not work, so we fetch separately if needed
      let query = (supabase as any)
        .schema('crm')
        .from('calls')
        .select('*', { count: 'exact' })
        .is('deleted_at', null)

      if (search) {
        query = query.or(`phone_number.ilike.%${search}%,subject.ilike.%${search}%,notes.ilike.%${search}%`)
      }

      const callTypeFilter = filters.find((f) => f.id === 'call_type')
      if (callTypeFilter && callTypeFilter.value) {
        const values = Array.isArray(callTypeFilter.value) ? callTypeFilter.value : [callTypeFilter.value]
        query = query.in('call_type', values)
      }

      const statusFilter = filters.find((f) => f.id === 'status')
      if (statusFilter && statusFilter.value) {
        const values = Array.isArray(statusFilter.value) ? statusFilter.value : [statusFilter.value]
        query = query.in('status', values)
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

      const { data: calls, error, count } = await query

      if (error) throw error

      // Fetch related data separately
      const contactIds = [...new Set((calls || []).map((c: any) => c.contact_id).filter(Boolean))]
      const leadIds = [...new Set((calls || []).map((c: any) => c.lead_id).filter(Boolean))]
      const callerIds = [...new Set((calls || []).map((c: any) => c.caller_id).filter(Boolean))]

      // Fetch contacts
      const { data: contacts } = contactIds.length > 0
        ? await (supabase as any)
            .schema('core')
            .from('contacts')
            .select('id, name, phone')
            .in('id', contactIds)
        : { data: [] }

      // Fetch leads with their contacts
      const { data: leads } = leadIds.length > 0
        ? await (supabase as any)
            .schema('crm')
            .from('leads')
            .select('id, contact_id')
            .in('id', leadIds)
        : { data: [] }

      const leadContactIds = [...new Set((leads || []).map((l: any) => l.contact_id).filter(Boolean))]
      const { data: leadContacts } = leadContactIds.length > 0
        ? await (supabase as any)
            .schema('core')
            .from('contacts')
            .select('id, name')
            .in('id', leadContactIds)
        : { data: [] }

      // Fetch caller profiles
      const { data: profiles } = callerIds.length > 0
        ? await (supabase as any)
            .schema('core')
            .from('profiles')
            .select('id, first_name, last_name')
            .in('id', callerIds)
        : { data: [] }

      // Create lookup maps
      const contactsMap = new Map((contacts || []).map((c: any) => [c.id, c]))
      const leadsMap = new Map((leads || []).map((l: any) => [l.id, l]))
      const leadContactsMap = new Map((leadContacts || []).map((c: any) => [c.id, c]))
      const profilesMap = new Map((profiles || []).map((p: any) => [p.id, p]))

      // Combine calls with relations
      const callsWithRelations = (calls || []).map((call: any) => {
        const contact = call.contact_id ? contactsMap.get(call.contact_id) : null
        const lead = call.lead_id ? leadsMap.get(call.lead_id) : null
        const leadContact = lead?.contact_id ? leadContactsMap.get(lead.contact_id) : null
        const caller = call.caller_id ? profilesMap.get(call.caller_id) : null

        return {
          ...call,
          contact,
          lead: lead ? { ...lead, contact: leadContact } : null,
          caller,
        }
      })

      setCalls(callsWithRelations)
      setPageCount(count ? Math.ceil(count / pageSize) : 0)
    } catch (error: any) {
      console.error('Error fetching calls:', error)
      toast.error('Failed to load calls')
    } finally {
      setLoading(false)
      setInitialLoading(false)
    }
  }, [clerkUser?.id, page, pageSize, sorting, filters, search])

  useEffect(() => {
    fetchCalls()
  }, [fetchCalls])

  const handleSubmit = async (data: CallFormData) => {
    if (!clerkUser?.id) return

    try {
      const supabase = createClient()

      if (editingCall) {
        const { error } = await (supabase as any)
          .from('calls')
          .update({
            ...data,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingCall.id)

        if (error) throw error
        toast.success('Call updated successfully')
      } else {
        const { error } = await (supabase as any).from('calls').insert({
          ...data,
          caller_id: clerkUser.id,
          created_by: clerkUser.id,
        })

        if (error) throw error
        toast.success('Call logged successfully')
      }

      await fetchCalls()
    } catch (error: any) {
      console.error('Error saving call:', error)
      toast.error(error.message || 'Failed to save call')
      throw error
    }
  }

  const handleDelete = async (call: CallFull) => {
    if (!clerkUser?.id) return
    if (!confirm('Are you sure you want to delete this call?')) return

    try {
      const supabase = createClient()
      const { error } = await (supabase as any)
        .from('calls')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', call.id)

      if (error) throw error
      toast.success('Call deleted successfully')
      await fetchCalls()
    } catch (error: any) {
      console.error('Error deleting call:', error)
      toast.error('Failed to delete call')
    }
  }

  const columns = createCallColumns({
    onView: () => {},
    onEdit: (call) => {
      setEditingCall(call)
      setFormOpen(true)
    },
    onDelete: handleDelete,
  })

  const filterConfig = [
    {
      columnId: 'call_type',
      title: 'Type',
      options: [
        { label: 'Inbound', value: 'inbound' },
        { label: 'Outbound', value: 'outbound' },
        { label: 'Missed', value: 'missed' },
      ],
    },
    {
      columnId: 'status',
      title: 'Status',
      options: [
        { label: 'Completed', value: 'completed' },
        { label: 'No Answer', value: 'no_answer' },
        { label: 'Busy', value: 'busy' },
        { label: 'Failed', value: 'failed' },
        { label: 'Cancelled', value: 'cancelled' },
      ],
    },
  ]

  return (
    <>
      <div className="flex flex-1 flex-col min-w-0 h-full overflow-hidden">
        <div className="flex items-center justify-between mb-4 flex-shrink-0">
          <div>
            <h1 className="text-lg font-semibold tracking-tight">Calls</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Manage and track your call logs</p>
          </div>
          <button
            onClick={() => {
              setEditingCall(null)
              setFormOpen(true)
            }}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
          >
            <Plus className="mr-2 h-4 w-4" />
            Log Call
          </button>
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
            onAdd={() => {
              setEditingCall(null)
              setFormOpen(true)
            }}
            onEdit={(call) => {
              setEditingCall(call)
              setFormOpen(true)
            }}
            onDelete={handleDelete}
            filterConfig={filterConfig}
            searchPlaceholder="Search calls..."
            addButtonText="Log Call"
            addButtonIcon={<Plus className="mr-2 h-4 w-4" />}
          />
        )}
      </div>

      <CallForm
        call={editingCall}
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open)
          if (!open) {
            setEditingCall(null)
          }
        }}
        onSubmit={handleSubmit}
      />
    </>
  )
}

export default function CallsPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <CallsPageContent />
    </Suspense>
  )
}
