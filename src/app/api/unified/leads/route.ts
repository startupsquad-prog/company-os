import { NextRequest, NextResponse } from 'next/server'
import { fromCrm, fromCore } from '@/lib/db/schema-helpers'

/**
 * GET /api/unified/leads
 * Fetch leads with filters, pagination, and sorting
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams

    // Parse query parameters
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '10')
    const search = searchParams.get('search') || ''
    const verticalId = searchParams.get('verticalId') || undefined

    // Build filters
    const filters: Record<string, any> = {}
    const statusFilter = searchParams.get('status')
    if (statusFilter) {
      filters.status = statusFilter.split(',')
    }
    const ownerIdFilter = searchParams.get('owner_id')
    if (ownerIdFilter) {
      filters.owner_id = ownerIdFilter.split(',')
    }
    const sourceFilter = searchParams.get('source')
    if (sourceFilter) {
      filters.source = sourceFilter.split(',')
    }
    if (verticalId && verticalId !== 'all') {
      filters.vertical_id = verticalId
    }

    // Build query using schema-aware helper
    let query = fromCrm('leads')
      .select('*', { count: 'exact' })
      .is('deleted_at', null)

    // Apply filters
    if (filters.status && Array.isArray(filters.status)) {
      query = query.in('status', filters.status)
    }
    if (filters.owner_id && Array.isArray(filters.owner_id)) {
      query = query.in('owner_id', filters.owner_id)
    }
    if (filters.source && Array.isArray(filters.source)) {
      query = query.in('source', filters.source)
    }
    if (filters.vertical_id) {
      query = query.eq('vertical_id', filters.vertical_id)
    }

    // Apply search - search in notes field
    // Note: For searching across multiple fields or in related tables (contacts, companies),
    // we'd need to fetch more data and filter in memory, or use a full-text search index
    if (search) {
      query = query.ilike('notes', `%${search}%`)
    }

    // Apply sorting
    const sortField = searchParams.get('sortField') || 'created_at'
    const sortDirection = searchParams.get('sortDirection') || 'desc'
    query = query.order(sortField, { ascending: sortDirection === 'asc' })

    // Apply pagination
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1
    query = query.range(from, to)

    const { data: leads, error, count } = await query

    if (error) {
      const errorDetails = {
        message: error.message || 'Unknown error',
        code: error.code,
        details: error.details,
        hint: error.hint,
        status: (error as any)?.status,
        statusText: (error as any)?.statusText,
      }
      console.error('Error fetching leads:', errorDetails)
      throw new Error(`Failed to fetch leads: ${errorDetails.message || 'Unknown error'}`)
    }

    // Fetch related data
    const contactIds = [...new Set((leads || []).map((l: any) => l.contact_id).filter(Boolean))]
    const companyIds = [...new Set((leads || []).map((l: any) => l.company_id).filter(Boolean))]
    const ownerIds = [...new Set((leads || []).map((l: any) => l.owner_id).filter(Boolean))]

    // Fetch contacts
    let contacts: any[] = []
    if (contactIds.length > 0) {
      const { data: contactsData, error: contactsError } = await fromCore('contacts')
        .select('id, name, email, phone')
        .in('id', contactIds)

      if (contactsError) {
        const errorDetails = {
          message: contactsError.message || 'Unknown error',
          code: contactsError.code,
          details: contactsError.details,
          hint: contactsError.hint,
        }
        console.error('Error fetching contacts:', errorDetails)
        // Don't throw - we can still return leads without contacts
      } else {
        contacts = contactsData || []
      }
    }

    // Fetch companies
    let companies: any[] = []
    if (companyIds.length > 0) {
      const { data: companiesData, error: companiesError } = await fromCore('companies')
        .select('id, name, website, industry')
        .in('id', companyIds)

      if (companiesError) {
        const errorDetails = {
          message: companiesError.message || 'Unknown error',
          code: companiesError.code,
          details: companiesError.details,
          hint: companiesError.hint,
        }
        console.error('Error fetching companies:', errorDetails)
        // Don't throw - we can still return leads without companies
      } else {
        companies = companiesData || []
      }
    }

    // Fetch profiles (owners) - note: owner_id in leads is UUID, maps to profiles.id
    let profiles: any[] = []
    if (ownerIds.length > 0) {
      const { data: profilesData, error: profilesError } = await fromCore('profiles')
        .select('id, user_id, first_name, last_name, email, avatar_url')
        .in('id', ownerIds)

      if (profilesError) {
        const errorDetails = {
          message: profilesError.message || 'Unknown error',
          code: profilesError.code,
          details: profilesError.details,
          hint: profilesError.hint,
        }
        console.error('Error fetching profiles:', errorDetails)
        // Don't throw - we can still return leads without profiles
      } else {
        profiles = profilesData || []
      }
    }

    // Fetch last call dates for leads (most recent call per lead)
    const leadIds = (leads || []).map((l: any) => l.id)
    let lastCallDates: Record<string, string> = {}
    if (leadIds.length > 0) {
      try {
        // For each lead, get the most recent call
        // Note: We'll fetch calls and group by lead_id client-side for simplicity
        // In production, you might want to use a database view or window function
        const { data: lastCalls, error: callsError } = await fromCrm('calls')
          .select('lead_id, started_at')
          .in('lead_id', leadIds)
          .not('started_at', 'is', null)
          .is('deleted_at', null)
          .order('started_at', { ascending: false })

        if (!callsError && lastCalls) {
          // Group by lead_id and get the most recent call (first one since we ordered DESC)
          const callsByLead = new Map<string, string>()
          for (const call of lastCalls) {
            if (call.lead_id && call.started_at && !callsByLead.has(call.lead_id)) {
              callsByLead.set(call.lead_id, call.started_at)
            }
          }
          lastCallDates = Object.fromEntries(callsByLead)
        }
      } catch (error) {
        console.error('Error fetching last call dates:', error)
        // Don't throw - we can still return leads without last call dates
      }
    }

    // Create lookup maps
    const contactsMap = new Map(contacts.map((c: any) => [c.id, c]))
    const companiesMap = new Map(companies.map((c: any) => [c.id, c]))
    // Note: owner_id in leads is UUID, maps to profiles.id
    const profilesMap = new Map(profiles.map((p: any) => [p.id, p]))

    // Combine leads with relations
    const leadsWithRelations = (leads || []).map((lead: any) => ({
      ...lead,
      contact: lead.contact_id ? contactsMap.get(lead.contact_id) || null : null,
      company: lead.company_id ? companiesMap.get(lead.company_id) || null : null,
      owner: lead.owner_id ? profilesMap.get(lead.owner_id) || null : null,
      last_call_date: lastCallDates[lead.id] || null,
    }))

    return NextResponse.json({
      leads: leadsWithRelations,
      total: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize),
    })
  } catch (error: any) {
    const errorDetails = {
      message: error.message || 'Unknown error',
      stack: error.stack,
      error: JSON.stringify(error, Object.getOwnPropertyNames(error), 2),
    }
    console.error('Error fetching leads:', errorDetails)
    return NextResponse.json(
      { error: errorDetails.message || 'Failed to fetch leads' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/unified/leads
 * Create a new lead
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const leadData = {
      contact_id: body.contact_id,
      company_id: body.company_id,
      owner_id: body.owner_id,
      status: body.status || 'new',
      source: body.source,
      value: body.value,
      currency: body.currency,
      notes: body.notes,
      tags: body.tags || [],
      vertical_id: body.vertical_id,
      created_by: body.created_by,
    }

    const { data: lead, error } = await fromCrm('leads')
      .insert(leadData)
      .select()
      .single()

    if (error) {
      const errorDetails = {
        message: error.message || 'Unknown error',
        code: error.code,
        details: error.details,
        hint: error.hint,
        status: (error as any)?.status,
        statusText: (error as any)?.statusText,
      }
      console.error('Error creating lead:', errorDetails)
      throw new Error(`Failed to create lead: ${errorDetails.message || 'Unknown error'}`)
    }

    return NextResponse.json({ data: lead }, { status: 201 })
  } catch (error: any) {
    const errorDetails = {
      message: error.message || 'Unknown error',
      stack: error.stack,
      error: JSON.stringify(error, Object.getOwnPropertyNames(error), 2),
    }
    console.error('Error creating lead:', errorDetails)
    return NextResponse.json(
      { error: errorDetails.message || 'Failed to create lead' },
      { status: 500 }
    )
  }
}

