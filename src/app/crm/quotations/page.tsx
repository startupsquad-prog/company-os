'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { QuotationFull, QuotationFormData } from '@/lib/types/quotations'
import type { SortingState, ColumnFiltersState } from '@tanstack/react-table'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'
import { DataTable } from '@/components/data-table/data-table'
import { createQuotationColumns } from './components/quotation-columns'
import { QuotationForm } from './components/quotation-form'
import { useUser } from '@clerk/nextjs'
import { PageLoader } from '@/components/ui/loader'
import { ContactTableSkeleton } from '@/app/crm/contacts/components/contact-table-skeleton'

function QuotationsPageContent() {
  const { user: clerkUser } = useUser()
  const [quotations, setQuotations] = useState<QuotationFull[]>([])
  const [loading, setLoading] = useState(true)
  const [initialLoading, setInitialLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [editingQuotation, setEditingQuotation] = useState<QuotationFull | null>(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [pageCount, setPageCount] = useState(0)
  const [sorting, setSorting] = useState<SortingState>([])
  const [filters, setFilters] = useState<ColumnFiltersState>([])
  const [search, setSearch] = useState('')

  const fetchQuotations = useCallback(async () => {
    if (!clerkUser?.id) return

    try {
      setLoading(true)
      const supabase = createClient()

      let query = supabase
        .from('quotations')
        .select('*, lead:leads(id, contact:contacts(id, name, email))', { count: 'exact' })
        .is('deleted_at', null)

      if (search) {
        query = query.or(`quote_number.ilike.%${search}%,title.ilike.%${search}%`)
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

      const { data, error, count } = await query

      if (error) throw error

      setQuotations(data || [])
      setPageCount(count ? Math.ceil(count / pageSize) : 0)
    } catch (error: any) {
      console.error('Error fetching quotations:', error)
      toast.error('Failed to load quotations')
    } finally {
      setLoading(false)
      setInitialLoading(false)
    }
  }, [clerkUser?.id, page, pageSize, sorting, filters, search])

  useEffect(() => {
    fetchQuotations()
  }, [fetchQuotations])

  const handleSubmit = async (data: QuotationFormData) => {
    if (!clerkUser?.id) return

    try {
      const supabase = createClient()

      if (editingQuotation) {
        const { error } = await supabase
          .from('quotations')
          .update({
            ...data,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingQuotation.id)

        if (error) throw error
        toast.success('Quotation updated successfully')
      } else {
        const { error } = await supabase.from('quotations').insert({
          ...data,
          created_by: clerkUser.id,
        })

        if (error) throw error
        toast.success('Quotation created successfully')
      }

      await fetchQuotations()
    } catch (error: any) {
      console.error('Error saving quotation:', error)
      toast.error(error.message || 'Failed to save quotation')
      throw error
    }
  }

  const handleDelete = async (quotation: QuotationFull) => {
    if (!clerkUser?.id) return
    if (!confirm(`Are you sure you want to delete ${quotation.quote_number}?`)) return

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('quotations')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', quotation.id)

      if (error) throw error
      toast.success('Quotation deleted successfully')
      await fetchQuotations()
    } catch (error: any) {
      console.error('Error deleting quotation:', error)
      toast.error('Failed to delete quotation')
    }
  }

  const columns = createQuotationColumns({
    onView: () => {},
    onEdit: (quotation) => {
      setEditingQuotation(quotation)
      setFormOpen(true)
    },
    onDelete: handleDelete,
  })

  const filterConfig = [
    {
      columnId: 'status',
      title: 'Status',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Sent', value: 'sent' },
        { label: 'Viewed', value: 'viewed' },
        { label: 'Accepted', value: 'accepted' },
        { label: 'Rejected', value: 'rejected' },
        { label: 'Expired', value: 'expired' },
        { label: 'Cancelled', value: 'cancelled' },
      ],
    },
  ]

  return (
    <>
      <div className="flex flex-1 flex-col min-w-0 h-full overflow-hidden">
        <div className="flex items-center justify-between mb-4 flex-shrink-0">
          <div>
            <h1 className="text-lg font-semibold tracking-tight">Quotations</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Manage your quotations and proposals</p>
          </div>
        </div>

        {initialLoading ? (
          <ContactTableSkeleton />
        ) : (
          <DataTable
            columns={columns}
            data={quotations}
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
              setEditingQuotation(null)
              setFormOpen(true)
            }}
            onEdit={(quotation) => {
              setEditingQuotation(quotation)
              setFormOpen(true)
            }}
            onDelete={handleDelete}
            filterConfig={filterConfig}
            searchPlaceholder="Search quotations..."
            addButtonText="Create Quotation"
            addButtonIcon={<Plus className="mr-2 h-4 w-4" />}
          />
        )}
      </div>

      <QuotationForm
        quotation={editingQuotation}
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open)
          if (!open) {
            setEditingQuotation(null)
          }
        }}
        onSubmit={handleSubmit}
      />
    </>
  )
}

export default function QuotationsPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <QuotationsPageContent />
    </Suspense>
  )
}
