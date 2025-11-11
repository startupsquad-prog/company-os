'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { CompanyFull, CompanyFormData } from '@/lib/types/companies'
import type { SortingState, ColumnFiltersState } from '@tanstack/react-table'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'
import { DataTable } from '@/components/data-table/data-table'
import { createCompanyColumns } from './components/company-columns'
import { CompanyForm } from './components/company-form'
import { useUser } from '@clerk/nextjs'
import { PageLoader } from '@/components/ui/loader'
import { CompanyTableSkeleton } from './components/company-table-skeleton'

function CompaniesPageContent() {
  const { user: clerkUser } = useUser()
  const [companies, setCompanies] = useState<CompanyFull[]>([])
  const [loading, setLoading] = useState(true)
  const [initialLoading, setInitialLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [editingCompany, setEditingCompany] = useState<CompanyFull | null>(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [pageCount, setPageCount] = useState(0)
  const [sorting, setSorting] = useState<SortingState>([])
  const [filters, setFilters] = useState<ColumnFiltersState>([])
  const [search, setSearch] = useState('')

  // Fetch companies
  const fetchCompanies = useCallback(async () => {
    if (!clerkUser?.id) return

    try {
      setLoading(true)
      const supabase = createClient()

      // Build query using schema-aware helper
      // Note: Foreign key references across schemas may not work, so we fetch separately if needed
      let query = (supabase as any)
        .schema('core')
        .from('companies')
        .select('*', { count: 'exact' })
        .is('deleted_at', null)

      // Apply search
      if (search) {
        query = query.or(`name.ilike.%${search}%,legal_name.ilike.%${search}%,industry.ilike.%${search}%`)
      }

      // Apply filters
      const industryFilter = filters.find((f) => f.id === 'industry')
      if (industryFilter && industryFilter.value) {
        const values = Array.isArray(industryFilter.value) ? industryFilter.value : [industryFilter.value]
        query = query.in('industry', values)
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

      const { data: companies, error, count } = await query

      if (error) throw error

      // Fetch company_contacts separately
      const companyIds = [...new Set((companies || []).map((c: any) => c.id))]
      const { data: companyContacts } = companyIds.length > 0
        ? await (supabase as any)
            .schema('core')
            .from('company_contacts')
            .select('company_id, contact_id')
            .in('company_id', companyIds)
        : { data: [] }

      const contactIds = [...new Set((companyContacts || []).map((cc: any) => cc.contact_id).filter(Boolean))]
      const { data: contacts } = contactIds.length > 0
        ? await (supabase as any)
            .schema('core')
            .from('contacts')
            .select('id, name, email, phone')
            .in('id', contactIds)
        : { data: [] }

      // Create lookup maps
      const contactsMap = new Map((contacts || []).map((c: any) => [c.id, c]))
      const companyContactsMap = new Map<string, any[]>()
      ;(companyContacts || []).forEach((cc: any) => {
        if (!companyContactsMap.has(cc.company_id)) {
          companyContactsMap.set(cc.company_id, [])
        }
        const contact = contactsMap.get(cc.contact_id)
        if (contact) {
          companyContactsMap.get(cc.company_id)!.push(contact)
        }
      })

      // Transform data to include contacts
      const transformedData: CompanyFull[] = (companies || []).map((company: any) => ({
        ...company,
        contacts: companyContactsMap.get(company.id) || [],
      }))

      setCompanies(transformedData)
      setPageCount(count ? Math.ceil(count / pageSize) : 0)
    } catch (error: any) {
      console.error('Error fetching companies:', error)
      toast.error('Failed to load companies')
    } finally {
      setLoading(false)
      setInitialLoading(false)
    }
  }, [clerkUser?.id, page, pageSize, sorting, filters, search])

  useEffect(() => {
    fetchCompanies()
  }, [fetchCompanies])

  // Handle create/update
  const handleSubmit = async (data: CompanyFormData) => {
    if (!clerkUser?.id) return

    try {
      const supabase = createClient()

      if (editingCompany) {
        const { error } = await (supabase as any)
          .from('companies')
          .update({
            ...data,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingCompany.id)

        if (error) throw error
        toast.success('Company updated successfully')
      } else {
        const { error } = await (supabase as any).from('companies').insert({
          ...data,
          created_by: clerkUser.id,
        })

        if (error) throw error
        toast.success('Company created successfully')
      }

      await fetchCompanies()
    } catch (error: any) {
      console.error('Error saving company:', error)
      toast.error(error.message || 'Failed to save company')
      throw error
    }
  }

  // Handle delete
  const handleDelete = async (company: CompanyFull) => {
    if (!clerkUser?.id) return

    if (!confirm(`Are you sure you want to delete ${company.name}?`)) return

    try {
      const supabase = createClient()
      const { error } = await (supabase as any)
        .from('companies')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', company.id)

      if (error) throw error
      toast.success('Company deleted successfully')
      await fetchCompanies()
    } catch (error: any) {
      console.error('Error deleting company:', error)
      toast.error('Failed to delete company')
    }
  }

  // Create columns
  const columns = createCompanyColumns({
    onView: (company) => {
      // TODO: Open view modal
    },
    onEdit: (company) => {
      setEditingCompany(company)
      setFormOpen(true)
    },
    onDelete: handleDelete,
  })

  return (
    <>
      <div className="flex flex-1 flex-col min-w-0 h-full overflow-hidden">
        <div className="flex items-center justify-between mb-4 flex-shrink-0">
          <div>
            <h1 className="text-lg font-semibold tracking-tight">Companies</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Manage your company records</p>
          </div>
        </div>

        {initialLoading ? (
          <CompanyTableSkeleton />
        ) : (
          <DataTable
            columns={columns}
            data={companies}
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
              setEditingCompany(null)
              setFormOpen(true)
            }}
            onEdit={(company) => {
              setEditingCompany(company)
              setFormOpen(true)
            }}
            onDelete={handleDelete}
            searchPlaceholder="Search companies..."
            addButtonText="Create Company"
            addButtonIcon={<Plus className="mr-2 h-4 w-4" />}
          />
        )}
      </div>

      <CompanyForm
        company={editingCompany}
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open)
          if (!open) {
            setEditingCompany(null)
          }
        }}
        onSubmit={handleSubmit}
      />
    </>
  )
}

export default function CompaniesPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <CompaniesPageContent />
    </Suspense>
  )
}
