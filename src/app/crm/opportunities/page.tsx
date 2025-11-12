'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { OpportunityFull, OpportunityFormData } from '@/lib/types/opportunities'
import type { SortingState, ColumnFiltersState } from '@tanstack/react-table'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'
import { DataTable } from '@/components/data-table/data-table'
import { createOpportunityColumns } from './components/opportunity-columns'
import { useUser } from '@clerk/nextjs'
import { PageLoader } from '@/components/ui/loader'
import { ContactTableSkeleton } from '@/app/crm/contacts/components/contact-table-skeleton'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

function OpportunitiesPageContent() {
  const { user: clerkUser } = useUser()
  const [opportunities, setOpportunities] = useState<OpportunityFull[]>([])
  const [loading, setLoading] = useState(true)
  const [initialLoading, setInitialLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [editingOpportunity, setEditingOpportunity] = useState<OpportunityFull | null>(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [pageCount, setPageCount] = useState(0)
  const [sorting, setSorting] = useState<SortingState>([])
  const [filters, setFilters] = useState<ColumnFiltersState>([])
  const [search, setSearch] = useState('')
  const [leads, setLeads] = useState<Array<{ id: string; contact: { name: string } | null }>>([])
  const [pipelines, setPipelines] = useState<Array<{ id: string; name: string }>>([])
  const [stages, setStages] = useState<Array<{ id: string; name: string; pipeline_id: string }>>([])
  const [formData, setFormData] = useState<OpportunityFormData>({
    lead_id: '',
    pipeline_id: '',
    stage_id: '',
  })

  const fetchOpportunities = useCallback(async () => {
    if (!clerkUser?.id) return

    try {
      setLoading(true)
      const supabase = createClient()

      // Use schema-aware query - opportunities is in crm schema
      // Note: Foreign key references across schemas may not work, so we fetch separately if needed
      let query = (supabase as any)
        .schema('crm')
        .from('opportunities')
        .select('*', { count: 'exact' })
        .is('deleted_at', null)

      // Search will be handled client-side after fetching related data

      if (sorting.length > 0) {
        const sort = sorting[0]
        query = query.order(sort.id, { ascending: sort.desc !== true })
      } else {
        query = query.order('created_at', { ascending: false })
      }

      const from = (page - 1) * pageSize
      const to = from + pageSize - 1
      query = query.range(from, to)

      const { data: opportunities, error, count } = await query

      if (error) throw error

      // Fetch related data separately (cross-schema joins don't work reliably)
      const leadIds = [...new Set((opportunities || []).map((o: any) => o.lead_id).filter(Boolean))]
      const pipelineIds = [...new Set((opportunities || []).map((o: any) => o.pipeline_id).filter(Boolean))]
      const stageIds = [...new Set((opportunities || []).map((o: any) => o.stage_id).filter(Boolean))]

      // Fetch leads with contacts and companies
      const { data: leads } = leadIds.length > 0
        ? await (supabase as any)
            .schema('crm')
            .from('leads')
            .select('id, status, value, contact_id, company_id')
            .in('id', leadIds)
        : { data: [] }

      const contactIds = [...new Set((leads || []).map((l: any) => l.contact_id).filter(Boolean))]
      const companyIds = [...new Set((leads || []).map((l: any) => l.company_id).filter(Boolean))]

      const { data: contacts } = contactIds.length > 0
        ? await (supabase as any)
            .schema('core')
            .from('contacts')
            .select('id, name, email')
            .in('id', contactIds)
        : { data: [] }

      const { data: companies } = companyIds.length > 0
        ? await (supabase as any)
            .schema('core')
            .from('companies')
            .select('id, name')
            .in('id', companyIds)
        : { data: [] }

      // Fetch pipelines and stages
      const { data: pipelines } = pipelineIds.length > 0
        ? await (supabase as any)
            .schema('crm')
            .from('pipelines')
            .select('id, name')
            .in('id', pipelineIds)
        : { data: [] }

      const { data: stages } = stageIds.length > 0
        ? await (supabase as any)
            .schema('crm')
            .from('stages')
            .select('id, name, pipeline_id, order_no')
            .in('id', stageIds)
        : { data: [] }

      // Create lookup maps
      const leadsMap = new Map((leads || []).map((l: any) => [l.id, l]))
      const contactsMap = new Map((contacts || []).map((c: any) => [c.id, c]))
      const companiesMap = new Map((companies || []).map((c: any) => [c.id, c]))
      const pipelinesMap = new Map((pipelines || []).map((p: any) => [p.id, p]))
      const stagesMap = new Map((stages || []).map((s: any) => [s.id, s]))

      // Combine opportunities with relations
      const opportunitiesWithRelations = (opportunities || []).map((opp: any) => {
        const lead = opp.lead_id ? leadsMap.get(opp.lead_id) : null
        const contact = lead?.contact_id ? contactsMap.get(lead.contact_id) : null
        const company = lead?.company_id ? companiesMap.get(lead.company_id) : null
        const pipeline = opp.pipeline_id ? pipelinesMap.get(opp.pipeline_id) : null
        const stage = opp.stage_id ? stagesMap.get(opp.stage_id) : null

        return {
          ...opp,
          lead: lead ? { ...lead, contact, company } : null,
          pipeline,
          stage,
        }
      })

      // Apply client-side search if needed
      let filteredOpportunities = opportunitiesWithRelations
      if (search) {
        const searchLower = search.toLowerCase()
        filteredOpportunities = opportunitiesWithRelations.filter((opp: any) => {
          const leadName = opp.lead?.contact?.name || ''
          const companyName = opp.lead?.company?.name || ''
          return leadName.toLowerCase().includes(searchLower) || companyName.toLowerCase().includes(searchLower)
        })
      }

      setOpportunities(filteredOpportunities)
      setPageCount(count ? Math.ceil(count / pageSize) : 0)
    } catch (error: any) {
      console.error('Error fetching opportunities:', error)
      toast.error('Failed to load opportunities')
    } finally {
      setLoading(false)
      setInitialLoading(false)
    }
  }, [clerkUser?.id, page, pageSize, sorting, search])

  useEffect(() => {
    fetchOpportunities()
    const fetchOptions = async () => {
      const supabase = createClient()
      const [leadsRes, pipelinesRes, stagesRes] = await Promise.all([
        (supabase as any).schema('crm').from('leads').select('id, contact_id').is('deleted_at', null).limit(100),
        (supabase as any).schema('crm').from('pipelines').select('id, name').is('deleted_at', null),
        (supabase as any).schema('crm').from('stages').select('id, name, pipeline_id').is('deleted_at', null),
      ])
      
      // Fetch contacts separately for leads
      const contactIds = [...new Set((leadsRes.data || []).map((l: any) => l.contact_id).filter(Boolean))]
      const { data: contacts } = contactIds.length > 0
        ? await (supabase as any)
            .schema('core')
            .from('contacts')
            .select('id, name')
            .in('id', contactIds)
        : { data: [] }
      
      const contactsMap = new Map((contacts || []).map((c: any) => [c.id, c]))
      const leadsWithContacts = (leadsRes.data || []).map((l: any) => ({
        id: l.id,
        contact: l.contact_id ? contactsMap.get(l.contact_id) : null,
      }))
      setLeads(leadsWithContacts)
      setPipelines(pipelinesRes.data || [])
      setStages(stagesRes.data || [])
    }
    fetchOptions()
  }, [fetchOpportunities])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!clerkUser?.id || !formData.lead_id) return

    try {
      const supabase = createClient()

      if (editingOpportunity) {
        const { error } = await (supabase as any)
          .from('opportunities')
          .update({
            ...formData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingOpportunity.id)

        if (error) throw error
        toast.success('Opportunity updated successfully')
      } else {
        const { error } = await (supabase as any).from('opportunities').insert({
          ...formData,
          created_by: clerkUser.id,
        })

        if (error) throw error
        toast.success('Opportunity created successfully')
      }

      setFormOpen(false)
      setEditingOpportunity(null)
      await fetchOpportunities()
    } catch (error: any) {
      console.error('Error saving opportunity:', error)
      toast.error(error.message || 'Failed to save opportunity')
    }
  }

  const handleDelete = async (opportunity: OpportunityFull) => {
    if (!clerkUser?.id) return
    if (!confirm('Are you sure you want to delete this opportunity?')) return

    try {
      const supabase = createClient()
      const { error } = await (supabase as any)
        .from('opportunities')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', opportunity.id)

      if (error) throw error
      toast.success('Opportunity deleted successfully')
      await fetchOpportunities()
    } catch (error: any) {
      console.error('Error deleting opportunity:', error)
      toast.error('Failed to delete opportunity')
    }
  }

  useEffect(() => {
    if (editingOpportunity) {
      setFormData({
        lead_id: editingOpportunity.lead_id,
        pipeline_id: editingOpportunity.pipeline_id || '',
        stage_id: editingOpportunity.stage_id || '',
      })
    } else {
      setFormData({
        lead_id: '',
        pipeline_id: '',
        stage_id: '',
      })
    }
  }, [editingOpportunity, formOpen])

  const columns = createOpportunityColumns({
    onView: () => {},
    onEdit: (opportunity) => {
      setEditingOpportunity(opportunity)
      setFormOpen(true)
    },
    onDelete: handleDelete,
  })

  const filteredStages = formData.pipeline_id
    ? stages.filter((s) => s.pipeline_id === formData.pipeline_id)
    : []

  return (
    <>
      <div className="flex flex-1 flex-col min-w-0 h-full overflow-hidden">
        <div className="flex items-center justify-between mb-4 flex-shrink-0">
          <div>
            <h1 className="text-lg font-semibold tracking-tight">Opportunities</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Manage your sales opportunities</p>
          </div>
        </div>

        {initialLoading ? (
          <ContactTableSkeleton />
        ) : (
          <DataTable
            columns={columns}
            data={opportunities}
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
              setEditingOpportunity(null)
              setFormOpen(true)
            }}
            onEdit={(opportunity) => {
              setEditingOpportunity(opportunity)
              setFormOpen(true)
            }}
            onDelete={handleDelete}
            searchPlaceholder="Search opportunities..."
            addButtonText="Create Opportunity"
            addButtonIcon={<Plus className="mr-2 h-4 w-4" />}
          />
        )}
      </div>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{editingOpportunity ? 'Edit Opportunity' : 'Create Opportunity'}</DialogTitle>
              <DialogDescription>
                {editingOpportunity ? 'Update opportunity information.' : 'Create a new opportunity from a lead.'}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="lead_id">
                  Lead <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.lead_id}
                  onValueChange={(value) => setFormData({ ...formData, lead_id: value, stage_id: '' })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select lead" />
                  </SelectTrigger>
                  <SelectContent>
                    {leads.map((lead) => (
                      <SelectItem key={lead.id} value={lead.id}>
                        {lead.contact?.name || `Lead ${lead.id.slice(0, 8)}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="pipeline_id">Pipeline</Label>
                <Select
                  value={formData.pipeline_id || '__none__'}
                  onValueChange={(value) => setFormData({ ...formData, pipeline_id: value === '__none__' ? undefined : value, stage_id: '__none__' })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select pipeline" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">None</SelectItem>
                    {pipelines.map((pipeline) => (
                      <SelectItem key={pipeline.id} value={pipeline.id}>
                        {pipeline.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="stage_id">Stage</Label>
                <Select
                  value={formData.stage_id || '__none__'}
                  onValueChange={(value) => setFormData({ ...formData, stage_id: value === '__none__' ? undefined : value })}
                  disabled={!formData.pipeline_id}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={formData.pipeline_id ? 'Select stage' : 'Select pipeline first'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">None</SelectItem>
                    {filteredStages.map((stage) => (
                      <SelectItem key={stage.id} value={stage.id}>
                        {stage.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={!formData.lead_id}>
                {editingOpportunity ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default function OpportunitiesPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <OpportunitiesPageContent />
    </Suspense>
  )
}
