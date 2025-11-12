import { NextRequest, NextResponse } from 'next/server'
import { fromCommonUtil, fromCore } from '@/lib/db/schema-helpers'

/**
 * GET /api/unified/cards
 * Fetch cards with filters, pagination, and sorting
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams

    // Skip auth check for now
    // const { userId } = await auth()
    // if (!userId) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }

    // Parse query parameters
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '12')
    const search = searchParams.get('search') || ''

    // Build filters
    const filters: Record<string, any> = {}
    const categoryFilter = searchParams.get('category')
    if (categoryFilter) {
      filters.category = categoryFilter.split(',')
    }

    const cardTypeFilter = searchParams.get('card_type')
    if (cardTypeFilter) {
      filters.card_type = cardTypeFilter.split(',')
    }

    // Build query using schema-aware helper
    let query = fromCommonUtil('password_vault_cards')
      .select('*', { count: 'exact' })
      .is('deleted_at', null)

    // Apply search
    if (search) {
      query = query.or(`title.ilike.%${search}%,cardholder_name.ilike.%${search}%,bank_name.ilike.%${search}%,category.ilike.%${search}%`)
    }

    // Apply filters
    if (filters.category && Array.isArray(filters.category)) {
      query = query.in('category', filters.category)
    }
    if (filters.card_type && Array.isArray(filters.card_type)) {
      query = query.in('card_type', filters.card_type)
    }

    // Apply sorting
    const sortField = searchParams.get('sortField') || 'created_at'
    const sortDirection = searchParams.get('sortDirection') || 'desc'
    query = query.order(sortField, { ascending: sortDirection === 'asc' })

    // Apply pagination
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1
    query = query.range(from, to)

    const { data: cards, error, count } = await query

    if (error) {
      console.error('[API] Error fetching cards:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      })
      throw new Error(`Failed to fetch cards: ${error.message}`)
    }

    // Fetch companies separately
    const companyIds = [...new Set((cards || []).map((c: any) => c.company_id).filter(Boolean))]

    const { data: companies } = companyIds.length > 0
      ? await fromCore('companies')
          .select('id, name, industry')
          .in('id', companyIds)
      : { data: [] }

    // Create lookup map
    const companiesMap = new Map((companies || []).map((c: any) => [c.id, c]))

    // Combine cards with relations
    const cardsWithRelations = (cards || []).map((card: any) => ({
      ...card,
      company: card.company_id ? companiesMap.get(card.company_id) || null : null,
    }))

    return NextResponse.json({
      data: cardsWithRelations,
      count: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize),
    })
  } catch (error: any) {
    console.error('[API] Error in GET /api/unified/cards:', {
      message: error.message,
      stack: error.stack,
    })
    return NextResponse.json(
      { error: error.message || 'Failed to fetch cards' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/unified/cards
 * Create a new card
 */
export async function POST(request: NextRequest) {
  try {
    // Skip auth check for now
    // const { userId } = await auth()
    // if (!userId) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }

    const body = await request.json()
    const { card_number, cvv, ...rest } = body

    // For now, store card number and CVV as plain text (in production, encrypt them)
    // TODO: Implement encryption before storing
    const card_number_encrypted = card_number || ''
    const cvv_encrypted = cvv || null

    const { data, error } = await fromCommonUtil('password_vault_cards')
      .insert({
        ...rest,
        card_number_encrypted,
        cvv_encrypted,
        // created_by: userId, // Skip for now
      })
      .select()
      .single()

    if (error) {
      console.error('[API] Error creating card:', error)
      throw error
    }

    return NextResponse.json({ data })
  } catch (error: any) {
    console.error('[API] Error in POST /api/unified/cards:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create card' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/unified/cards
 * Update an existing card
 */
export async function PATCH(request: NextRequest) {
  try {
    // Skip auth check for now
    // const { userId } = await auth()
    // if (!userId) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }

    const body = await request.json()
    const { id, card_number, cvv, ...rest } = body

    const updateData: any = {
      ...rest,
      updated_at: new Date().toISOString(),
    }

    if (card_number !== undefined) {
      // For now, store as plain text (in production, encrypt it)
      // TODO: Implement encryption before storing
      updateData.card_number_encrypted = card_number
    }

    if (cvv !== undefined) {
      // For now, store as plain text (in production, encrypt it)
      // TODO: Implement encryption before storing
      updateData.cvv_encrypted = cvv || null
    }

    const { data, error } = await fromCommonUtil('password_vault_cards')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('[API] Error updating card:', error)
      throw error
    }

    return NextResponse.json({ data })
  } catch (error: any) {
    console.error('[API] Error in PATCH /api/unified/cards:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update card' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/unified/cards
 * Soft delete a card
 */
export async function DELETE(request: NextRequest) {
  try {
    // Skip auth check for now
    // const { userId } = await auth()
    // if (!userId) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }

    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    const { error } = await fromCommonUtil('password_vault_cards')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)

    if (error) {
      console.error('[API] Error deleting card:', error)
      throw error
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[API] Error in DELETE /api/unified/cards:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete card' },
      { status: 500 }
    )
  }
}



