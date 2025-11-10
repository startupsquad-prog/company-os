import { createServerClient, createServiceRoleClient } from '@/lib/supabase/server'
import { getClerkUserId } from '@/lib/auth/clerk'
import type {
  Lead,
  LeadFull,
  LeadFilters,
  LeadSort,
  CreateLeadInput,
  UpdateLeadInput,
  UpdateLeadStatusInput,
  Interaction,
  CreateInteractionInput,
  StatusHistoryEntry,
} from '@/lib/types/leads'

/**
 * Get current user's profile ID using Clerk user ID
 */
async function getCurrentProfileId(supabase: Awaited<ReturnType<typeof createServerClient>>) {
  const userId = await getClerkUserId()

  if (!userId) {
    throw new Error('Unauthorized')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('user_id', userId)
    .single()

  if (!profile) {
    throw new Error('Profile not found')
  }

  return profile.id
}

/**
 * Get current user's Clerk user ID
 */
async function getCurrentUserId() {
  const userId = await getClerkUserId()

  if (!userId) {
    throw new Error('Unauthorized')
  }

  return userId
}

/**
 * Get leads with filters, pagination, and sorting
 */
export async function getLeads(
  filters: LeadFilters = {},
  sort: LeadSort = { field: 'created_at', direction: 'desc' },
  page: number = 1,
  pageSize: number = 10,
  verticalId?: string | 'all'
) {
  // Use service role client to access public view (PostgREST only exposes public schema)
  const supabase = createServiceRoleClient()

  // Fetch leads from public view (which maps to crm.leads)
  let query = supabase.from('leads').select('*', { count: 'exact' }).is('deleted_at', null)

  // Apply vertical filter if provided
  if (verticalId && verticalId !== 'all') {
    query = query.eq('vertical_id', verticalId)
  }

  // Apply filters
  if (filters.status && filters.status.length > 0) {
    query = query.in('status', filters.status)
  }

  if (filters.owner_id && filters.owner_id.length > 0) {
    query = query.in('owner_id', filters.owner_id)
  }

  if (filters.source && filters.source.length > 0) {
    query = query.in('source', filters.source)
  }

  if (filters.date_from) {
    query = query.gte('created_at', filters.date_from)
  }

  if (filters.date_to) {
    query = query.lte('created_at', filters.date_to)
  }

  if (filters.value_min !== undefined) {
    query = query.gte('value', filters.value_min)
  }

  if (filters.value_max !== undefined) {
    query = query.lte('value', filters.value_max)
  }

  if (filters.tags && filters.tags.length > 0) {
    query = query.overlaps('tags', filters.tags)
  }

  // Search filter (searches in contact name, company name, notes)
  if (filters.search) {
    const searchTerm = `%${filters.search}%`
    // Note: Full-text search would require a different approach
    // For now, we'll filter in memory after fetching
  }

  // Apply sorting
  query = query.order(sort.field, { ascending: sort.direction === 'asc' })

  // Apply pagination
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1
  query = query.range(from, to)

  const { data: leads, error, count } = await query

  if (error) {
    throw new Error(`Failed to fetch leads: ${error.message}`)
  }

  // Fetch related data separately (PostgREST doesn't support cross-schema joins)
  const contactIds = [
    ...new Set((leads || []).map((l) => l.contact_id).filter(Boolean) as string[]),
  ]
  const companyIds = [
    ...new Set((leads || []).map((l) => l.company_id).filter(Boolean) as string[]),
  ]
  const ownerIds = [...new Set((leads || []).map((l) => l.owner_id).filter(Boolean) as string[])]

  // Fetch contacts
  const { data: contacts } =
    contactIds.length > 0
      ? await supabase
          .schema('core')
          .from('contacts')
          .select('id, name, email, phone')
          .in('id', contactIds)
      : { data: [] }

  // Fetch companies
  const { data: companies } =
    companyIds.length > 0
      ? await supabase
          .schema('core')
          .from('companies')
          .select('id, name, website, industry')
          .in('id', companyIds)
      : { data: [] }

  // Fetch profiles (owners)
  const { data: profiles } =
    ownerIds.length > 0
      ? await supabase
          .schema('core')
          .from('profiles')
          .select('id, first_name, last_name, email, avatar_url')
          .in('id', ownerIds)
      : { data: [] }

  // Create lookup maps
  const contactsMap = new Map((contacts || []).map((c) => [c.id, c]))
  const companiesMap = new Map((companies || []).map((c) => [c.id, c]))
  const profilesMap = new Map((profiles || []).map((p) => [p.id, p]))

  // Combine leads with relations
  let leadsWithRelations = (leads || []).map((lead) => ({
    ...lead,
    contact: lead.contact_id ? contactsMap.get(lead.contact_id) || null : null,
    company: lead.company_id ? companiesMap.get(lead.company_id) || null : null,
    owner: lead.owner_id ? profilesMap.get(lead.owner_id) || null : null,
  }))

  // Apply search filter in memory if needed
  // Note: This means the total count from the query might not match filtered results
  // For better performance, consider implementing full-text search in the database
  if (filters.search) {
    const searchLower = filters.search.toLowerCase()
    leadsWithRelations = leadsWithRelations.filter((lead) => {
      const contactName = lead.contact?.name?.toLowerCase() || ''
      const companyName = lead.company?.name?.toLowerCase() || ''
      const notes = lead.notes?.toLowerCase() || ''
      const contactEmail = lead.contact?.email?.toLowerCase() || ''

      return (
        contactName.includes(searchLower) ||
        companyName.includes(searchLower) ||
        notes.includes(searchLower) ||
        contactEmail.includes(searchLower)
      )
    })
    // Update total count to reflect filtered results
    // Note: This is an approximation - actual total might be different if we had proper pagination
  }

  // Get last interaction date for each lead
  const leadsWithInteractions: LeadFull[] = await Promise.all(
    leadsWithRelations.map(async (lead) => {
      const { data: lastInteraction } = await supabase
        .from('interactions')
        .select('created_at')
        .eq('entity_type', 'lead')
        .eq('entity_id', lead.id)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      const { count: interactionsCount } = await supabase
        .from('interactions')
        .select('id', { count: 'exact', head: true })
        .eq('entity_type', 'lead')
        .eq('entity_id', lead.id)
        .is('deleted_at', null)

      return {
        ...lead,
        interactions_count: interactionsCount || 0,
        last_interaction_at: lastInteraction?.created_at || null,
      } as LeadFull
    })
  )

  // If search filter was applied, use filtered count; otherwise use query count
  const finalTotal = filters.search ? leadsWithInteractions.length : count || 0

  return {
    leads: leadsWithInteractions,
    total: finalTotal,
    page,
    pageSize,
    totalPages: Math.ceil(finalTotal / pageSize),
  }
}

/**
 * Get lead by ID with all relations
 */
export async function getLeadById(id: string): Promise<LeadFull | null> {
  // Use service role client to access crm schema
  const supabase = createServiceRoleClient()

  const { data: lead, error } = await supabase
    .from('leads')
    .select('*')
    .eq('id', id)
    .is('deleted_at', null)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return null // Not found
    }
    throw new Error(`Failed to fetch lead: ${error.message}`)
  }

  if (!lead) {
    return null
  }

  // Fetch related data separately
  const [contact, company, owner] = await Promise.all([
    lead.contact_id
      ? supabase
          .schema('core')
          .from('contacts')
          .select('id, name, email, phone')
          .eq('id', lead.contact_id)
          .single()
      : Promise.resolve({ data: null }),
    lead.company_id
      ? supabase
          .schema('core')
          .from('companies')
          .select('id, name, website, industry')
          .eq('id', lead.company_id)
          .single()
      : Promise.resolve({ data: null }),
    lead.owner_id
      ? supabase
          .schema('core')
          .from('profiles')
          .select('id, first_name, last_name, email, avatar_url')
          .eq('id', lead.owner_id)
          .single()
      : Promise.resolve({ data: null }),
  ])

  // Get interactions count and last interaction
  const { data: lastInteraction } = await supabase
    .schema('crm')
    .from('interactions')
    .select('created_at')
    .eq('entity_type', 'lead')
    .eq('entity_id', id)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  const { count: interactionsCount } = await supabase
    .schema('crm')
    .from('interactions')
    .select('id', { count: 'exact', head: true })
    .eq('entity_type', 'lead')
    .eq('entity_id', id)
    .is('deleted_at', null)

  return {
    ...lead,
    contact: contact.data,
    company: company.data,
    owner: owner.data,
    interactions_count: interactionsCount || 0,
    last_interaction_at: lastInteraction?.created_at || null,
  } as LeadFull
}

/**
 * Create a new lead
 */
export async function createLead(data: CreateLeadInput): Promise<Lead> {
  const supabase = createServiceRoleClient()
  // Get user from anon client to respect auth
  const anonSupabase = await createServerClient()
  const userId = await getCurrentUserId(anonSupabase)

  const leadData = {
    ...data,
    status: data.status || 'new',
    created_by: userId,
  }

  const { data: lead, error } = await supabase.from('leads').insert(leadData).select().single()

  if (error) {
    throw new Error(`Failed to create lead: ${error.message}`)
  }

  // Create initial status history entry
  await supabase.from('status_history').insert({
    lead_id: lead.id,
    status: lead.status,
    previous_status: null,
    notes: 'Lead created',
    created_by: userId,
  })

  // Trigger notification if lead has owner
  // Note: owner_id is a profile_id, we need to get the user_id for notifications
  // This is done asynchronously to not block lead creation
  if (lead.owner_id) {
    // Fetch owner user_id asynchronously to avoid blocking
    supabase
      .from('profiles')
      .select('user_id')
      .eq('id', lead.owner_id)
      .single()
      .then(({ data: ownerProfile, error: profileError }) => {
        if (profileError) {
          console.error('Failed to get owner user_id for notification:', profileError)
          return
        }

        if (ownerProfile?.user_id) {
          import('@/lib/notifications/trigger-notification').then(({ triggerNotification }) => {
            triggerNotification('lead', lead.id, 'assigned', 'lead_assigned', {
              actorId: userId,
              recipients: [ownerProfile.user_id],
            }).catch((err) => console.error('Failed to trigger lead assignment notification:', err))
          })
        }
      })
      .catch((err) => {
        // Don't fail lead creation if notification lookup fails
        console.error('Failed to lookup owner for notification:', err)
      })
  }

  return lead
}

/**
 * Update a lead
 */
export async function updateLead(id: string, data: Partial<CreateLeadInput>): Promise<Lead> {
  const supabase = createServiceRoleClient()
  // Get user from anon client to respect auth
  const anonSupabase = await createServerClient()
  const userId = await getCurrentUserId(anonSupabase)

  // Get current lead to check for owner_id and status changes
  const { data: currentLead } = await supabase
    .from('leads')
    .select('owner_id, status')
    .eq('id', id)
    .single()

  const { data: lead, error } = await supabase
    .from('leads')
    .update(data)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to update lead: ${error.message}`)
  }

  // Trigger notification if owner changed
  if (data.owner_id && currentLead?.owner_id !== data.owner_id) {
    // Get user_id from profile_id asynchronously
    supabase
      .from('profiles')
      .select('user_id')
      .eq('id', data.owner_id)
      .single()
      .then(({ data: ownerProfile, error: profileError }) => {
        if (profileError || !ownerProfile?.user_id) {
          console.error('Failed to get owner user_id for notification:', profileError)
          return
        }

        import('@/lib/notifications/trigger-notification').then(({ triggerNotification }) => {
          triggerNotification('lead', id, 'assigned', 'lead_assigned', {
            actorId: userId,
            recipients: [ownerProfile.user_id],
          }).catch((err) => console.error('Failed to trigger lead assignment notification:', err))
        })
      })
      .catch((err) => console.error('Failed to lookup owner for notification:', err))
  }

  // Trigger notification if status changed
  if (data.status && currentLead?.status !== data.status) {
    const { triggerNotification } = await import('@/lib/notifications/trigger-notification')
    triggerNotification('lead', id, 'status_changed', 'lead_status_changed', {
      actorId: userId,
      metadata: { previous_status: currentLead?.status, new_status: data.status },
    }).catch((err) => console.error('Failed to trigger lead status change notification:', err))
  }

  return lead
}

/**
 * Delete a lead (soft delete)
 */
export async function deleteLead(id: string): Promise<void> {
  const supabase = createServiceRoleClient()

  const { error } = await supabase
    .from('leads')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)

  if (error) {
    throw new Error(`Failed to delete lead: ${error.message}`)
  }
}

/**
 * Update lead status and create history entry
 */
export async function updateLeadStatus(input: UpdateLeadStatusInput): Promise<Lead> {
  const supabase = createServiceRoleClient()
  // Get user from anon client to respect auth
  const anonSupabase = await createServerClient()
  const userId = await getCurrentUserId(anonSupabase)

  // Get current status
  const { data: currentLead } = await supabase
    .from('leads')
    .select('status')
    .eq('id', input.lead_id)
    .single()

  const previousStatus = currentLead?.status || null

  // Update lead status
  const { data: lead, error } = await supabase
    .from('leads')
    .update({ status: input.status })
    .eq('id', input.lead_id)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to update lead status: ${error.message}`)
  }

  // Create status history entry
  await supabase.from('status_history').insert({
    lead_id: input.lead_id,
    status: input.status,
    previous_status: previousStatus,
    notes: input.notes || null,
    created_by: userId,
  })

  // Trigger notification for status change
  if (previousStatus !== input.status) {
    const { triggerNotification } = await import('@/lib/notifications/trigger-notification')
    triggerNotification('lead', input.lead_id, 'status_changed', 'lead_status_changed', {
      actorId: userId,
      metadata: { previous_status: previousStatus, new_status: input.status },
    }).catch((err) => console.error('Failed to trigger lead status change notification:', err))
  }

  return lead
}

/**
 * Get interactions for a lead
 */
export async function getLeadInteractions(leadId: string): Promise<Interaction[]> {
  const supabase = createServiceRoleClient()

  const { data: interactions, error } = await supabase
    .from('interactions')
    .select('*')
    .eq('entity_type', 'lead')
    .eq('entity_id', leadId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch interactions: ${error.message}`)
  }

  // Fetch profiles separately
  const createdByIds = [
    ...new Set((interactions || []).map((i) => i.created_by).filter(Boolean) as string[]),
  ]
  const { data: profiles } =
    createdByIds.length > 0
      ? await supabase
          .schema('core')
          .from('profiles')
          .select('id, first_name, last_name, email, avatar_url')
          .in('user_id', createdByIds)
      : { data: [] }

  // Create lookup map (note: profiles.user_id maps to interactions.created_by)
  const profilesMap = new Map((profiles || []).map((p) => [p.user_id, p]))

  return (interactions || []).map((interaction) => ({
    ...interaction,
    created_by_profile: interaction.created_by
      ? profilesMap.get(interaction.created_by) || null
      : null,
  })) as Interaction[]
}

/**
 * Add an interaction to a lead
 */
export async function addInteraction(input: CreateInteractionInput): Promise<Interaction> {
  const supabase = createServiceRoleClient()
  // Get user from anon client to respect auth
  const anonSupabase = await createServerClient()
  const userId = await getCurrentUserId(anonSupabase)

  const interactionData = {
    ...input,
    created_by: userId,
  }

  const { data: interaction, error } = await supabase
    .from('interactions')
    .insert(interactionData)
    .select('*')
    .single()

  if (error) {
    throw new Error(`Failed to add interaction: ${error.message}`)
  }

  // Fetch profile separately
  const { data: profile } = interaction.created_by
    ? await supabase
        .schema('core')
        .from('profiles')
        .select('id, first_name, last_name, email, avatar_url')
        .eq('user_id', interaction.created_by)
        .single()
    : { data: null }

  return {
    ...interaction,
    created_by_profile: profile || null,
  } as Interaction
}

/**
 * Get status history for a lead
 */
export async function getLeadStatusHistory(leadId: string): Promise<StatusHistoryEntry[]> {
  const supabase = createServiceRoleClient()

  const { data: history, error } = await supabase
    .from('status_history')
    .select('*')
    .eq('lead_id', leadId)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch status history: ${error.message}`)
  }

  // Fetch profiles separately
  const createdByIds = [
    ...new Set((history || []).map((h) => h.created_by).filter(Boolean) as string[]),
  ]
  const { data: profiles } =
    createdByIds.length > 0
      ? await supabase
          .schema('core')
          .from('profiles')
          .select('id, first_name, last_name, email')
          .in('user_id', createdByIds)
      : { data: [] }

  // Create lookup map
  const profilesMap = new Map((profiles || []).map((p) => [p.user_id, p]))

  return (history || []).map((entry) => ({
    ...entry,
    created_by_profile: entry.created_by ? profilesMap.get(entry.created_by) || null : null,
  })) as StatusHistoryEntry[]
}
