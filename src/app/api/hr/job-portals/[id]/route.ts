import { NextRequest, NextResponse } from 'next/server'
import { fromAts } from '@/lib/db/schema-helpers'

/**
 * GET /api/hr/job-portals/[id]
 * Get a single job portal by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const { data: portal, error } = await fromAts('job_portals')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Job portal not found' }, { status: 404 })
      }
      throw new Error(`Failed to fetch job portal: ${error.message}`)
    }

    return NextResponse.json({ portal })
  } catch (error: any) {
    console.error('Error fetching job portal:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch job portal' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/hr/job-portals/[id]
 * Update a job portal
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const updateData: any = {
      updated_at: new Date().toISOString(),
    }

    if (body.name !== undefined) updateData.name = body.name
    if (body.url !== undefined) updateData.url = body.url
    if (body.subscription_id !== undefined) updateData.subscription_id = body.subscription_id
    if (body.status !== undefined) updateData.status = body.status
    if (body.portal_type !== undefined) updateData.portal_type = body.portal_type
    if (body.api_key !== undefined) updateData.api_key = body.api_key
    if (body.api_secret !== undefined) updateData.api_secret = body.api_secret
    if (body.credentials_jsonb !== undefined) updateData.credentials_jsonb = body.credentials_jsonb
    if (body.notes !== undefined) updateData.notes = body.notes
    if (body.meta !== undefined) updateData.meta = body.meta

    const { data: portal, error } = await fromAts('job_portals')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Job portal not found' }, { status: 404 })
      }
      throw new Error(`Failed to update job portal: ${error.message}`)
    }

    return NextResponse.json({ portal })
  } catch (error: any) {
    console.error('Error updating job portal:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update job portal' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/hr/job-portals/[id]
 * Soft delete a job portal
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const { error } = await fromAts('job_portals')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)

    if (error) {
      throw new Error(`Failed to delete job portal: ${error.message}`)
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting job portal:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete job portal' },
      { status: 500 }
    )
  }
}

