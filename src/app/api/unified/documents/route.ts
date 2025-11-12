import { NextRequest, NextResponse } from 'next/server'
import { fromCommonUtil, fromCore } from '@/lib/db/schema-helpers'

/**
 * GET /api/unified/documents
 * Fetch documents with filters, pagination, and sorting
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
    const pageSize = parseInt(searchParams.get('pageSize') || '10')
    const search = searchParams.get('search') || ''

    // Build filters
    const filters: Record<string, any> = {}
    const categoryFilter = searchParams.get('category')
    if (categoryFilter) {
      filters.category = categoryFilter.split(',')
    }

    // Build query using schema-aware helper
    let query = fromCommonUtil('password_vault_documents')
      .select('*', { count: 'exact' })
      .is('deleted_at', null)

    // Apply search
    if (search) {
      query = query.or(`title.ilike.%${search}%,issuer.ilike.%${search}%,category.ilike.%${search}%`)
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

    const { data: documents, error, count } = await query

    if (error) {
      console.error('[API] Error fetching documents:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      })
      throw new Error(`Failed to fetch documents: ${error.message}`)
    }

    // Fetch companies separately
    const companyIds = [...new Set((documents || []).map((d: any) => d.company_id).filter(Boolean))]

    const { data: companies } = companyIds.length > 0
      ? await fromCore('companies')
          .select('id, name, industry')
          .in('id', companyIds)
      : { data: [] }

    // Create lookup map
    const companiesMap = new Map((companies || []).map((c: any) => [c.id, c]))

    // Combine documents with relations
    const documentsWithRelations = (documents || []).map((document: any) => ({
      ...document,
      company: document.company_id ? companiesMap.get(document.company_id) || null : null,
    }))

    return NextResponse.json({
      data: documentsWithRelations,
      count: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize),
    })
  } catch (error: any) {
    console.error('[API] Error in GET /api/unified/documents:', {
      message: error.message,
      stack: error.stack,
    })
    return NextResponse.json(
      { error: error.message || 'Failed to fetch documents' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/unified/documents
 * Create a new document
 */
export async function POST(request: NextRequest) {
  try {
    // Skip auth check for now
    // const { userId } = await auth()
    // if (!userId) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }

    const body = await request.json()
    const { document_number, ...rest } = body

    // For now, store document number as plain text (in production, encrypt it)
    // TODO: Implement encryption before storing
    const document_number_encrypted = document_number || null

    const { data, error } = await fromCommonUtil('password_vault_documents')
      .insert({
        ...rest,
        document_number_encrypted,
        // created_by: userId, // Skip for now
      })
      .select()
      .single()

    if (error) {
      console.error('[API] Error creating document:', error)
      throw error
    }

    return NextResponse.json({ data })
  } catch (error: any) {
    console.error('[API] Error in POST /api/unified/documents:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create document' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/unified/documents
 * Update an existing document
 */
export async function PATCH(request: NextRequest) {
  try {
    // Skip auth check for now
    // const { userId } = await auth()
    // if (!userId) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }

    const body = await request.json()
    const { id, document_number, ...rest } = body

    const updateData: any = {
      ...rest,
      updated_at: new Date().toISOString(),
    }

    if (document_number !== undefined) {
      // For now, store as plain text (in production, encrypt it)
      // TODO: Implement encryption before storing
      updateData.document_number_encrypted = document_number || null
    }

    const { data, error } = await fromCommonUtil('password_vault_documents')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('[API] Error updating document:', error)
      throw error
    }

    return NextResponse.json({ data })
  } catch (error: any) {
    console.error('[API] Error in PATCH /api/unified/documents:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update document' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/unified/documents
 * Soft delete a document
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

    const { error } = await fromCommonUtil('password_vault_documents')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)

    if (error) {
      console.error('[API] Error deleting document:', error)
      throw error
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[API] Error in DELETE /api/unified/documents:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete document' },
      { status: 500 }
    )
  }
}



