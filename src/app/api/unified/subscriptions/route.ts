import { NextRequest, NextResponse } from 'next/server'
import { fromCommonUtil, fromCore } from '@/lib/db/schema-helpers'
import { auth } from '@clerk/nextjs/server'

/**
 * GET /api/unified/subscriptions
 * Fetch subscriptions with filters, pagination, and sorting
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams

    // Check authentication
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

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

    // Build query using schema-aware helper - subscriptions is in common_util schema
    let query = fromCommonUtil('subscriptions')
      .select('*', { count: 'exact' })
      .is('deleted_at', null)

    // Apply search
    if (search) {
      query = query.or(`subscription_name.ilike.%${search}%,vendor_name.ilike.%${search}%,plan_tier.ilike.%${search}%`)
    }

    // Apply filters
    if (filters.status && Array.isArray(filters.status)) {
      query = query.in('status', filters.status)
    }

    // Apply sorting
    const sortField = searchParams.get('sortField') || 'created_at'
    const sortDirection = searchParams.get('sortDirection') || 'desc'
    query = query.order(sortField, { ascending: sortDirection === 'asc' })

    // Apply pagination
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1
    query = query.range(from, to)

    const { data: subscriptions, error, count } = await query

    if (error) {
      console.error('[API] Error fetching subscriptions:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      })
      throw new Error(`Failed to fetch subscriptions: ${error.message}`)
    }

    // Fetch vendors (contacts) separately (PostgREST can't resolve cross-schema foreign keys)
    const vendorIds = [...new Set((subscriptions || []).map((s: any) => s.vendor_id).filter(Boolean))]

    // Fetch vendors using schema helper
    const { data: contacts } = vendorIds.length > 0
      ? await fromCore('contacts')
          .select('id, name, email')
          .in('id', vendorIds)
      : { data: [] }

    // Create lookup map
    const contactsMap = new Map((contacts || []).map((c: any) => [c.id, c]))

    // Combine subscriptions with relations
    const subscriptionsWithRelations = (subscriptions || []).map((subscription: any) => ({
      ...subscription,
      vendor: subscription.vendor_id ? contactsMap.get(subscription.vendor_id) || null : null,
    }))

    return NextResponse.json({
      data: subscriptionsWithRelations,
      count: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize),
    })
  } catch (error: any) {
    console.error('[API] Error in GET /api/unified/subscriptions:', {
      message: error.message,
      stack: error.stack,
    })
    return NextResponse.json(
      { error: error.message || 'Failed to fetch subscriptions' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/unified/subscriptions
 * Create a new subscription
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { vendor_id, vendor_name, ...rest } = body

    // If vendor_id is provided, fetch vendor name if not provided
    let finalVendorName = vendor_name
    if (vendor_id && !vendor_name) {
      const { data: contact } = await fromCore('contacts')
        .select('id, name')
        .eq('id', vendor_id)
        .single()
      
      if (contact) {
        finalVendorName = contact.name
      }
    }

    const { data, error } = await fromCommonUtil('subscriptions')
      .insert({
        ...rest,
        vendor_id: vendor_id || null,
        vendor_name: finalVendorName || null,
        created_by: userId,
      })
      .select()
      .single()

    if (error) {
      console.error('[API] Error creating subscription:', error)
      throw error
    }

    return NextResponse.json({ data })
  } catch (error: any) {
    console.error('[API] Error in POST /api/unified/subscriptions:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create subscription' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/unified/subscriptions
 * Update an existing subscription
 */
export async function PATCH(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id, vendor_id, vendor_name, ...rest } = body

    // If vendor_id is provided, fetch vendor name if not provided
    let finalVendorName = vendor_name
    if (vendor_id && !vendor_name) {
      const { data: contact } = await fromCore('contacts')
        .select('id, name')
        .eq('id', vendor_id)
        .single()
      
      if (contact) {
        finalVendorName = contact.name
      }
    }

    const { data, error } = await fromCommonUtil('subscriptions')
      .update({
        ...rest,
        vendor_id: vendor_id || null,
        vendor_name: finalVendorName || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('[API] Error updating subscription:', error)
      throw error
    }

    return NextResponse.json({ data })
  } catch (error: any) {
    console.error('[API] Error in PATCH /api/unified/subscriptions:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update subscription' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/unified/subscriptions
 * Soft delete a subscription
 */
export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    const { error } = await fromCommonUtil('subscriptions')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)

    if (error) {
      console.error('[API] Error deleting subscription:', error)
      throw error
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[API] Error in DELETE /api/unified/subscriptions:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete subscription' },
      { status: 500 }
    )
  }
}

