import { NextRequest, NextResponse } from 'next/server'
import { fromCommonUtil, fromCore } from '@/lib/db/schema-helpers'

/**
 * GET /api/unified/passwords
 * Fetch passwords with filters, pagination, and sorting
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams

    // Skip auth check for now - return all data
    // const { userId } = await auth()
    // if (!userId) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }

    // Parse query parameters
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '10')
    const search = searchParams.get('search') || ''

    // Build filters
    const filters: Record<string, any> = {}
    const categoryFilter = searchParams.get('category')
    if (categoryFilter) {
      filters.category = categoryFilter.split(',')
    }

    // Build query using schema-aware helper
    let query = fromCommonUtil('password_vault_passwords')
      .select('*', { count: 'exact' })
      .is('deleted_at', null)

    // Apply search
    if (search) {
      query = query.or(`title.ilike.%${search}%,username.ilike.%${search}%,url.ilike.%${search}%,category.ilike.%${search}%`)
    }

    // Apply filters
    if (filters.category && Array.isArray(filters.category)) {
      query = query.in('category', filters.category)
    }

    // Apply sorting
    const sortField = searchParams.get('sortField') || 'created_at'
    const sortDirection = searchParams.get('sortDirection') || 'desc'
    query = query.order(sortField, { ascending: sortDirection === 'asc' })

    // Apply pagination
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1
    query = query.range(from, to)

    const { data: passwords, error, count } = await query

    if (error) {
      console.error('[API] Error fetching passwords:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      })
      throw new Error(`Failed to fetch passwords: ${error.message}`)
    }

    // Fetch companies separately (PostgREST can't resolve cross-schema foreign keys)
    const companyIds = [...new Set((passwords || []).map((p: any) => p.company_id).filter(Boolean))]

    // Fetch companies using schema helper
    const { data: companies } = companyIds.length > 0
      ? await fromCore('companies')
          .select('id, name, industry')
          .in('id', companyIds)
      : { data: [] }

    // Create lookup map
    const companiesMap = new Map((companies || []).map((c: any) => [c.id, c]))

    // Combine passwords with relations
    const passwordsWithRelations = (passwords || []).map((password: any) => ({
      ...password,
      company: password.company_id ? companiesMap.get(password.company_id) || null : null,
    }))

    return NextResponse.json({
      data: passwordsWithRelations,
      count: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize),
    })
  } catch (error: any) {
    console.error('[API] Error in GET /api/unified/passwords:', {
      message: error.message,
      stack: error.stack,
    })
    return NextResponse.json(
      { error: error.message || 'Failed to fetch passwords' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/unified/passwords
 * Create a new password
 */
export async function POST(request: NextRequest) {
  try {
    // Skip auth check for now
    // const { userId } = await auth()
    // if (!userId) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }

    const body = await request.json()
    const { password, ...rest } = body

    // For now, store password as plain text (in production, encrypt it)
    // TODO: Implement encryption before storing
    const password_encrypted = password || ''

    const { data, error } = await fromCommonUtil('password_vault_passwords')
      .insert({
        ...rest,
        password_encrypted,
        // created_by: userId, // Skip for now
      })
      .select()
      .single()

    if (error) {
      console.error('[API] Error creating password:', error)
      throw error
    }

    return NextResponse.json({ data })
  } catch (error: any) {
    console.error('[API] Error in POST /api/unified/passwords:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create password' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/unified/passwords
 * Update an existing password
 */
export async function PATCH(request: NextRequest) {
  try {
    // Skip auth check for now
    // const { userId } = await auth()
    // if (!userId) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }

    const body = await request.json()
    const { id, password, ...rest } = body

    // If password is provided, encrypt it
    const updateData: any = {
      ...rest,
      updated_at: new Date().toISOString(),
    }

    if (password !== undefined) {
      // For now, store password as plain text (in production, encrypt it)
      // TODO: Implement encryption before storing
      updateData.password_encrypted = password
    }

    const { data, error } = await fromCommonUtil('password_vault_passwords')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('[API] Error updating password:', error)
      throw error
    }

    return NextResponse.json({ data })
  } catch (error: any) {
    console.error('[API] Error in PATCH /api/unified/passwords:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update password' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/unified/passwords
 * Soft delete a password
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

    const { error } = await fromCommonUtil('password_vault_passwords')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)

    if (error) {
      console.error('[API] Error deleting password:', error)
      throw error
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[API] Error in DELETE /api/unified/passwords:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete password' },
      { status: 500 }
    )
  }
}

