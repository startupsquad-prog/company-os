import { NextRequest, NextResponse } from 'next/server'
import { fromCrm, fromCore } from '@/lib/db/schema-helpers'

/**
 * GET /api/unified/leads/[id]
 * Get a single lead by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const { data: lead, error } = await fromCrm('leads')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
      }
      const errorDetails = {
        message: error.message || 'Unknown error',
        code: error.code,
        details: error.details,
        hint: error.hint,
      }
      console.error('Error fetching lead:', errorDetails)
      throw new Error(`Failed to fetch lead: ${errorDetails.message || 'Unknown error'}`)
    }

    const leadTyped = lead as any

    // Fetch related data separately (PostgREST can't resolve cross-schema foreign keys)
    const [contactResult, companyResult, ownerResult] = await Promise.all([
      // Fetch contact
      leadTyped.contact_id
        ? fromCore('contacts')
            .select('id, name, email, phone')
            .eq('id', leadTyped.contact_id)
            .single()
        : Promise.resolve({ data: null }),
      // Fetch company
      leadTyped.company_id
        ? fromCore('companies')
            .select('id, name, website, industry')
            .eq('id', leadTyped.company_id)
            .single()
        : Promise.resolve({ data: null }),
      // Fetch owner profile
      leadTyped.owner_id
        ? fromCore('profiles')
            .select('id, user_id, first_name, last_name, email, avatar_url')
            .eq('id', leadTyped.owner_id)
            .single()
        : Promise.resolve({ data: null }),
    ])

    // Fetch interactions
    const { data: interactions, error: interactionsError } = await fromCrm('interactions')
      .select('*')
      .eq('entity_type', 'lead')
      .eq('entity_id', id)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    if (interactionsError) {
      console.error('Error fetching interactions:', interactionsError)
    }

    // Fetch status history
    const { data: statusHistory, error: statusHistoryError } = await fromCrm('status_history')
      .select('*')
      .eq('lead_id', id)
      .order('created_at', { ascending: false })

    if (statusHistoryError) {
      console.error('Error fetching status history:', statusHistoryError)
    }

    // Fetch profiles for interactions and status history (created_by is Clerk user ID)
    const interactionsTyped = (interactions || []) as any[]
    const historyTyped = (statusHistory || []) as any[]
    const createdByIds = [
      ...new Set([
        ...interactionsTyped.map((i: any) => i.created_by).filter(Boolean),
        ...historyTyped.map((h: any) => h.created_by).filter(Boolean),
      ] as string[]),
    ]

    let profilesMap = new Map()
    if (createdByIds.length > 0) {
      const { data: profiles, error: profilesError } = await fromCore('profiles')
        .select('id, user_id, first_name, last_name, email, avatar_url')
        .in('user_id', createdByIds)

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError)
      } else {
        profilesMap = new Map((profiles || []).map((p: any) => [p.user_id, p]))
      }
    }

    // Combine interactions with profiles
    const interactionsWithProfiles = interactionsTyped.map((interaction: any) => ({
      ...interaction,
      created_by_profile: interaction.created_by
        ? profilesMap.get(interaction.created_by) || null
        : null,
    }))

    // Combine status history with profiles
    const historyWithProfiles = historyTyped.map((entry: any) => ({
      ...entry,
      created_by_profile: entry.created_by ? profilesMap.get(entry.created_by) || null : null,
    }))

    // Fetch last call date for this lead
    let lastCallDate: string | null = null
    try {
      const { data: lastCall, error: callError } = await fromCrm('calls')
        .select('started_at')
        .eq('lead_id', id)
        .not('started_at', 'is', null)
        .is('deleted_at', null)
        .order('started_at', { ascending: false })
        .limit(1)
        .single()

      if (!callError && lastCall && lastCall.started_at) {
        lastCallDate = lastCall.started_at
      }
    } catch (error) {
      console.error('Error fetching last call date:', error)
      // Don't throw - we can still return lead without last call date
    }

    return NextResponse.json({
      data: {
        ...leadTyped,
        contact: contactResult.data,
        company: companyResult.data,
        owner: ownerResult.data,
        interactions: interactionsWithProfiles,
        status_history: historyWithProfiles,
        last_call_date: lastCallDate,
      },
    })
  } catch (error: any) {
    const errorDetails = {
      message: error.message || 'Unknown error',
      stack: error.stack,
      error: JSON.stringify(error, Object.getOwnPropertyNames(error), 2),
    }
    console.error('Error fetching lead:', errorDetails)
    return NextResponse.json(
      { error: errorDetails.message || 'Failed to fetch lead' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/unified/leads/[id]
 * Update a lead
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const updateData: Record<string, any> = {}
    if (body.contact_id !== undefined) updateData.contact_id = body.contact_id
    if (body.company_id !== undefined) updateData.company_id = body.company_id
    if (body.owner_id !== undefined) updateData.owner_id = body.owner_id
    if (body.status !== undefined) updateData.status = body.status
    if (body.source !== undefined) updateData.source = body.source
    if (body.value !== undefined) updateData.value = body.value
    if (body.currency !== undefined) updateData.currency = body.currency
    if (body.notes !== undefined) updateData.notes = body.notes
    if (body.tags !== undefined) updateData.tags = body.tags
    if (body.vertical_id !== undefined) updateData.vertical_id = body.vertical_id
    if (body.probability !== undefined) updateData.probability = body.probability
    if (body.expected_close_date !== undefined) updateData.expected_close_date = body.expected_close_date

    const { data: lead, error } = await fromCrm('leads')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      const errorDetails = {
        message: error.message || 'Unknown error',
        code: error.code,
        details: error.details,
        hint: error.hint,
      }
      console.error('Error updating lead:', errorDetails)
      throw new Error(`Failed to update lead: ${errorDetails.message || 'Unknown error'}`)
    }

    return NextResponse.json({ data: lead })
  } catch (error: any) {
    const errorDetails = {
      message: error.message || 'Unknown error',
      stack: error.stack,
      error: JSON.stringify(error, Object.getOwnPropertyNames(error), 2),
    }
    console.error('Error updating lead:', errorDetails)
    return NextResponse.json(
      { error: errorDetails.message || 'Failed to update lead' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/unified/leads/[id]
 * Soft delete a lead
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const { error } = await fromCrm('leads')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)

    if (error) {
      const errorDetails = {
        message: error.message || 'Unknown error',
        code: error.code,
        details: error.details,
        hint: error.hint,
      }
      console.error('Error deleting lead:', errorDetails)
      throw new Error(`Failed to delete lead: ${errorDetails.message || 'Unknown error'}`)
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    const errorDetails = {
      message: error.message || 'Unknown error',
      stack: error.stack,
      error: JSON.stringify(error, Object.getOwnPropertyNames(error), 2),
    }
    console.error('Error deleting lead:', errorDetails)
    return NextResponse.json(
      { error: errorDetails.message || 'Failed to delete lead' },
      { status: 500 }
    )
  }
}

