import { NextRequest, NextResponse } from 'next/server'
import { fromAts } from '@/lib/db/schema-helpers'

/**
 * GET /api/recruitment/job-portals/[id]
 * Fetch a single job portal by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    const { data: portal, error } = await fromAts('job_portals')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .single()

    if (error) {
      console.error('Error fetching job portal:', error)
      throw new Error(`Failed to fetch job portal: ${error.message || 'Unknown error'}`)
    }

    if (!portal) {
      return NextResponse.json(
        { error: 'Job portal not found' },
        { status: 404 }
      )
    }

    // Fetch subscription if exists
    let subscription = null
    if (portal.subscription_id) {
      const { data: subData } = await (fromAts as any).schema('common_util').from('subscriptions')
        .select('id, name, status')
        .eq('id', portal.subscription_id)
        .maybeSingle()
      subscription = subData
    }

    return NextResponse.json({
      data: {
        ...portal,
        subscription,
      },
    })
  } catch (error: any) {
    console.error('Error fetching job portal:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch job portal' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/recruitment/job-portals/[id]
 * Update a job portal
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()

    const updateData: any = {}
    if (body.name !== undefined) updateData.name = body.name
    if (body.url !== undefined) updateData.url = body.url
    if (body.subscription_id !== undefined) updateData.subscription_id = body.subscription_id
    if (body.status !== undefined) updateData.status = body.status
    if (body.portal_type !== undefined) updateData.portal_type = body.portal_type
    if (body.api_key !== undefined) updateData.api_key = body.api_key
    if (body.api_secret !== undefined) updateData.api_secret = body.api_secret
    if (body.notes !== undefined) updateData.notes = body.notes
    if (body.updated_at) updateData.updated_at = body.updated_at

    const { data: portal, error } = await fromAts('job_portals')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating job portal:', error)
      throw new Error(`Failed to update job portal: ${error.message || 'Unknown error'}`)
    }

    return NextResponse.json({ data: portal })
  } catch (error: any) {
    console.error('Error updating job portal:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update job portal' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/recruitment/job-portals/[id]
 * Soft delete a job portal
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    const { error } = await fromAts('job_portals')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)

    if (error) {
      console.error('Error deleting job portal:', error)
      throw new Error(`Failed to delete job portal: ${error.message || 'Unknown error'}`)
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

