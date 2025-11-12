import { NextRequest, NextResponse } from 'next/server'
import { fromAts, fromCore } from '@/lib/db/schema-helpers'
import { createServiceRoleClient } from '@/lib/supabase/server'

/**
 * GET /api/recruitment/candidates
 * Fetch candidates with filters, pagination, and sorting
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams

    // Parse query parameters
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '10')
    const search = searchParams.get('search') || ''

    // Build filters
    const filters: Record<string, any> = {}
    const statusFilter = searchParams.get('status')
    if (statusFilter) {
      filters.status = statusFilter.split(',')
    }
    const sourceFilter = searchParams.get('source')
    if (sourceFilter) {
      filters.source = sourceFilter.split(',')
    }
    const recruiterIdFilter = searchParams.get('recruiter_id')
    if (recruiterIdFilter) {
      filters.recruiter_id = recruiterIdFilter.split(',')
    }

    // Build query using service role client
    const supabase = createServiceRoleClient()
    let query = supabase
      .schema('ats')
      .from('candidates')
      .select('*', { count: 'exact' })
      .is('deleted_at', null)

    // Apply filters
    if (filters.status && Array.isArray(filters.status)) {
      query = query.in('status', filters.status)
    }
    if (filters.source && Array.isArray(filters.source)) {
      query = query.in('source', filters.source)
    }
    if (filters.recruiter_id && Array.isArray(filters.recruiter_id)) {
      query = query.in('recruiter_id', filters.recruiter_id)
    }

    // Apply search - search in notes field and related contact name/email/phone
    if (search) {
      query = query.or(`notes.ilike.%${search}%`)
    }

    // Apply sorting
    const sortField = searchParams.get('sortField') || 'created_at'
    const sortDirection = searchParams.get('sortDirection') || 'desc'
    query = query.order(sortField, { ascending: sortDirection === 'asc' })

    // Apply pagination
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1
    query = query.range(from, to)

    const { data: candidates, error, count } = await query

    if (error) {
      const errorDetails = {
        message: error.message || 'Unknown error',
        code: error.code,
        details: error.details,
        hint: error.hint,
      }
      console.error('Error fetching candidates:', errorDetails)
      throw new Error(`Failed to fetch candidates: ${errorDetails.message || 'Unknown error'}`)
    }

    // Fetch related data
    const contactIds = [...new Set((candidates || []).map((c: any) => c.contact_id).filter(Boolean))]
    const recruiterIds = [...new Set((candidates || []).map((c: any) => c.recruiter_id).filter(Boolean))]

    // Fetch contacts
    let contacts: any[] = []
    if (contactIds.length > 0) {
      const { data: contactsData, error: contactsError } = await supabase
        .schema('core')
        .from('contacts')
        .select('id, name, email, phone')
        .in('id', contactIds)

      if (contactsError) {
        console.error('Error fetching contacts:', contactsError)
      } else {
        contacts = contactsData || []
      }
    }

    // Fetch recruiters (profiles)
    let recruiters: any[] = []
    if (recruiterIds.length > 0) {
      const { data: recruitersData, error: recruitersError } = await supabase
        .schema('core')
        .from('profiles')
        .select('id, first_name, last_name, email')
        .in('id', recruiterIds)

      if (recruitersError) {
        console.error('Error fetching recruiters:', recruitersError)
      } else {
        recruiters = recruitersData || []
      }
    }

    // Create lookup maps
    const contactsMap = new Map(contacts.map((c: any) => [c.id, c]))
    const recruitersMap = new Map(recruiters.map((r: any) => [r.id, r]))

    // Filter by search if provided (search in contact name, email, phone)
    let filteredCandidates = candidates || []
    if (search) {
      const searchLower = search.toLowerCase()
      filteredCandidates = filteredCandidates.filter((candidate: any) => {
        const contact = contactsMap.get(candidate.contact_id)
        if (!contact) return false
        return (
          contact.name?.toLowerCase().includes(searchLower) ||
          contact.email?.toLowerCase().includes(searchLower) ||
          contact.phone?.toLowerCase().includes(searchLower) ||
          candidate.notes?.toLowerCase().includes(searchLower)
        )
      })
    }

    // Combine candidates with relations
    const candidatesWithRelations = filteredCandidates.map((candidate: any) => ({
      ...candidate,
      contact: candidate.contact_id ? contactsMap.get(candidate.contact_id) || null : null,
      recruiter: candidate.recruiter_id ? recruitersMap.get(candidate.recruiter_id) || null : null,
    }))

    // Recalculate count if search filtered results
    const finalCount = search ? candidatesWithRelations.length : (count || 0)
    const finalTotalPages = Math.ceil(finalCount / pageSize)

    return NextResponse.json({
      candidates: candidatesWithRelations,
      total: finalCount,
      page,
      pageSize,
      totalPages: finalTotalPages,
    })
  } catch (error: any) {
    console.error('Error fetching candidates:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch candidates' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/recruitment/candidates
 * Create a new candidate
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const candidateData = {
      contact_id: body.contact_id,
      status: body.status || 'new',
      source: body.source,
      recruiter_id: body.recruiter_id,
      resume_url: body.resume_url,
      cover_letter_url: body.cover_letter_url,
      tags: body.tags || [],
      notes: body.notes,
      meta: body.meta || {},
      created_by: body.created_by,
    }

    const supabase = createServiceRoleClient()
    const { data: candidate, error } = await supabase
      .schema('ats')
      .from('candidates')
      .insert(candidateData)
      .select()
      .single()

    if (error) {
      console.error('Error creating candidate:', error)
      throw new Error(`Failed to create candidate: ${error.message || 'Unknown error'}`)
    }

    return NextResponse.json({ data: candidate }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating candidate:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create candidate' },
      { status: 500 }
    )
  }
}

