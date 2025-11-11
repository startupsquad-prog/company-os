'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { ContactFull, ContactFormData } from '@/lib/types/contacts'
import type { SortingState, ColumnFiltersState } from '@tanstack/react-table'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'
import { DataTable } from '@/components/data-table/data-table'
import { createContactColumns } from './components/contact-columns'
import { ContactForm } from './components/contact-form'
import { useUser } from '@clerk/nextjs'
import { PageLoader } from '@/components/ui/loader'
import { ContactTableSkeleton } from './components/contact-table-skeleton'

function ContactsPageContent() {
  const searchParams = useSearchParams()
  const { user: clerkUser } = useUser()
  const [contacts, setContacts] = useState<ContactFull[]>([])
  const [loading, setLoading] = useState(true)
  const [initialLoading, setInitialLoading] = useState(true)
  const [selectedContact, setSelectedContact] = useState<ContactFull | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editingContact, setEditingContact] = useState<ContactFull | null>(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [pageCount, setPageCount] = useState(0)
  const [sorting, setSorting] = useState<SortingState>([])
  const [filters, setFilters] = useState<ColumnFiltersState>([])
  const [search, setSearch] = useState('')

  // Fetch contacts
  const fetchContacts = useCallback(async () => {
    if (!clerkUser?.id) return

    try {
      setLoading(true)
      const supabase = createClient()

      // Build query using schema-aware helper
      // Note: Foreign key references across schemas may not work, so we fetch separately if needed
      let query = (supabase as any)
        .schema('core')
        .from('contacts')
        .select('*', { count: 'exact' })
        .is('deleted_at', null)

      // Apply search
      if (search) {
        query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`)
      }

      // Apply filters
      const contactTypeFilter = filters.find((f) => f.id === 'contact_type')
      if (contactTypeFilter && contactTypeFilter.value) {
        const values = Array.isArray(contactTypeFilter.value) ? contactTypeFilter.value : [contactTypeFilter.value]
        query = query.in('contact_type', values)
      }

      // Apply sorting
      if (sorting.length > 0) {
        const sort = sorting[0]
        query = query.order(sort.id, { ascending: sort.desc !== true })
      } else {
        query = query.order('created_at', { ascending: false })
      }

      // Apply pagination
      const from = (page - 1) * pageSize
      const to = from + pageSize - 1
      query = query.range(from, to)

      const { data: contacts, error, count } = await query

      if (error) throw error

      // Fetch company_contacts separately
      const contactIds = [...new Set((contacts || []).map((c: any) => c.id))]
      const { data: companyContacts } = contactIds.length > 0
        ? await (supabase as any)
            .schema('core')
            .from('company_contacts')
            .select('contact_id, company_id')
            .in('contact_id', contactIds)
        : { data: [] }

      const companyIds = [...new Set((companyContacts || []).map((cc: any) => cc.company_id).filter(Boolean))]
      const { data: companies } = companyIds.length > 0
        ? await (supabase as any)
            .schema('core')
            .from('companies')
            .select('id, name, industry')
            .in('id', companyIds)
        : { data: [] }

      // Create lookup maps
      const companiesMap = new Map((companies || []).map((c: any) => [c.id, c]))
      const contactCompaniesMap = new Map<string, any[]>()
      ;(companyContacts || []).forEach((cc: any) => {
        if (!contactCompaniesMap.has(cc.contact_id)) {
          contactCompaniesMap.set(cc.contact_id, [])
        }
        const company = companiesMap.get(cc.company_id)
        if (company) {
          contactCompaniesMap.get(cc.contact_id)!.push(company)
        }
      })

      // Transform data to include companies
      const transformedData: ContactFull[] = (contacts || []).map((contact: any) => ({
        ...contact,
        companies: contactCompaniesMap.get(contact.id) || [],
      }))

      setContacts(transformedData)
      setPageCount(count ? Math.ceil(count / pageSize) : 0)
    } catch (error: any) {
      console.error('Error fetching contacts:', error)
      toast.error('Failed to load contacts')
    } finally {
      setLoading(false)
      setInitialLoading(false)
    }
  }, [clerkUser?.id, page, pageSize, sorting, filters, search])

  useEffect(() => {
    fetchContacts()
  }, [fetchContacts])

  // Handle create/update
  const handleSubmit = async (data: ContactFormData) => {
    if (!clerkUser?.id) return

    try {
      const supabase = createClient()

      if (editingContact) {
        const { error } = await (supabase as any)
          .from('contacts')
          .update({
            ...data,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingContact.id)

        if (error) throw error
        toast.success('Contact updated successfully')
      } else {
        const { error } = await (supabase as any).from('contacts').insert({
          ...data,
          created_by: clerkUser.id,
        })

        if (error) throw error
        toast.success('Contact created successfully')
      }

      await fetchContacts()
    } catch (error: any) {
      console.error('Error saving contact:', error)
      toast.error(error.message || 'Failed to save contact')
      throw error
    }
  }

  // Handle delete
  const handleDelete = async (contact: ContactFull) => {
    if (!clerkUser?.id) return

    if (!confirm(`Are you sure you want to delete ${contact.name}?`)) return

    try {
      const supabase = createClient()
      const { error } = await (supabase as any)
        .from('contacts')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', contact.id)

      if (error) throw error
      toast.success('Contact deleted successfully')
      await fetchContacts()
    } catch (error: any) {
      console.error('Error deleting contact:', error)
      toast.error('Failed to delete contact')
    }
  }

  // Create columns
  const columns = createContactColumns({
    onView: (contact) => {
      setSelectedContact(contact)
      // TODO: Open view modal
    },
    onEdit: (contact) => {
      setEditingContact(contact)
      setFormOpen(true)
    },
    onDelete: handleDelete,
  })

  // Filter config
  const filterConfig = [
    {
      columnId: 'contact_type',
      title: 'Type',
      options: [
        { label: 'Person', value: 'person' },
        { label: 'Organization', value: 'organization' },
      ],
    },
  ]

  return (
    <>
      <div className="flex flex-1 flex-col min-w-0 h-full overflow-hidden">
        <div className="flex items-center justify-between mb-4 flex-shrink-0">
          <div>
            <h1 className="text-lg font-semibold tracking-tight">Contacts</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Manage your contacts and organizations</p>
          </div>
        </div>

        {initialLoading ? (
          <ContactTableSkeleton />
        ) : (
          <DataTable
            columns={columns}
            data={contacts}
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
              setEditingContact(null)
              setFormOpen(true)
            }}
            onEdit={(contact) => {
              setEditingContact(contact)
              setFormOpen(true)
            }}
            onDelete={handleDelete}
            filterConfig={filterConfig}
            searchPlaceholder="Search contacts..."
            addButtonText="Create Contact"
            addButtonIcon={<Plus className="mr-2 h-4 w-4" />}
          />
        )}
      </div>

      <ContactForm
        contact={editingContact}
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open)
          if (!open) {
            setEditingContact(null)
          }
        }}
        onSubmit={handleSubmit}
      />
    </>
  )
}

export default function ContactsPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <ContactsPageContent />
    </Suspense>
  )
}
