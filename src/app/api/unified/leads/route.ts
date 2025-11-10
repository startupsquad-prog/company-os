import { NextRequest, NextResponse } from 'next/server'
import { getUnifiedClient } from '@/lib/db/unified-client'

/**
 * GET /api/unified/leads
 * Fetch leads with filters, pagination, and sorting
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const supabase = getUnifiedClient()

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

    // Build query - use public schema (views exist for crm tables)
    let query = supabase
      .from('leads')
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

    // Apply search (if needed, can search in notes or other fields)
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
      throw new Error(`Failed to fetch leads: ${error.message}`)
    }

    // Fetch related data
    const contactIds = [...new Set((leads || []).map((l: any) => l.contact_id).filter(Boolean))]
    const companyIds = [...new Set((leads || []).map((l: any) => l.company_id).filter(Boolean))]
    const ownerIds = [...new Set((leads || []).map((l: any) => l.owner_id).filter(Boolean))]

    // Fetch contacts
    const { data: contacts } =
      contactIds.length > 0
        ? await supabase
            .from('contacts')
            .select('id, name, email, phone')
            .in('id', contactIds)
        : { data: [] }

    // Fetch companies
    const { data: companies } =
      companyIds.length > 0
        ? await supabase
            .from('companies')
            .select('id, name, website, industry')
            .in('id', companyIds)
        : { data: [] }

    // Fetch profiles (owners)
    const { data: profiles } =
      ownerIds.length > 0
        ? await supabase
            .from('profiles')
            .select('id, first_name, last_name, email, avatar_url')
            .in('id', ownerIds)
        : { data: [] }

    // Create lookup maps
    const contactsMap = new Map((contacts || []).map((c: any) => [c.id, c]))
    const companiesMap = new Map((companies || []).map((c: any) => [c.id, c]))
    const profilesMap = new Map((profiles || []).map((p: any) => [p.id, p]))

    // Combine leads with relations
    const leadsWithRelations = (leads || []).map((lead: any) => ({
      ...lead,
      contact: lead.contact_id ? contactsMap.get(lead.contact_id) || null : null,
      company: lead.company_id ? companiesMap.get(lead.company_id) || null : null,
      owner: lead.owner_id ? profilesMap.get(lead.owner_id) || null : null,
    }))

    return NextResponse.json({
      leads: leadsWithRelations,
      total: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize),
    })
  } catch (error: any) {
    console.error('Error fetching leads:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch leads' },
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
    const supabase = getUnifiedClient()

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

    const { data: lead, error } = await ((supabase as any)
      .from('leads')
      .insert(leadData)
      .select()
      .single())

    if (error) {
      throw new Error(`Failed to create lead: ${error.message}`)
    }

    return NextResponse.json({ data: lead }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating lead:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create lead' },
      { status: 500 }
    )
  }
}

