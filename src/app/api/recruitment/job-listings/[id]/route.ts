import { NextRequest, NextResponse } from 'next/server'
import { fromAts } from '@/lib/db/schema-helpers'

/**
 * GET /api/recruitment/job-listings/[id]
 * Fetch a single job listing by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    const { data: listing, error } = await fromAts('job_listings')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .single()

    if (error) {
      console.error('Error fetching job listing:', error)
      throw new Error(`Failed to fetch job listing: ${error.message || 'Unknown error'}`)
    }

    if (!listing) {
      return NextResponse.json(
        { error: 'Job listing not found' },
        { status: 404 }
      )
    }

    // Fetch related data
    const [roleData, portalData] = await Promise.all([
      fromAts('job_roles').select('id, title, department, location, status').eq('id', listing.job_role_id).maybeSingle(),
      fromAts('job_portals').select('id, name, portal_type, status').eq('id', listing.job_portal_id).maybeSingle(),
    ])

    return NextResponse.json({
      data: {
        ...listing,
        job_role: roleData.data || null,
        job_portal: portalData.data || null,
      },
    })
  } catch (error: any) {
    console.error('Error fetching job listing:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch job listing' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/recruitment/job-listings/[id]
 * Update a job listing
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()

    const updateData: any = {}
    if (body.job_role_id !== undefined) updateData.job_role_id = body.job_role_id
    if (body.job_portal_id !== undefined) updateData.job_portal_id = body.job_portal_id
    if (body.external_job_id !== undefined) updateData.external_job_id = body.external_job_id
    if (body.listing_url !== undefined) updateData.listing_url = body.listing_url
    if (body.status !== undefined) updateData.status = body.status
    if (body.posted_at !== undefined) updateData.posted_at = body.posted_at
    if (body.expires_at !== undefined) updateData.expires_at = body.expires_at
    if (body.custom_description !== undefined) updateData.custom_description = body.custom_description
    if (body.notes !== undefined) updateData.notes = body.notes
    if (body.updated_at) updateData.updated_at = body.updated_at

    const { data: listing, error } = await fromAts('job_listings')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating job listing:', error)
      throw new Error(`Failed to update job listing: ${error.message || 'Unknown error'}`)
    }

    return NextResponse.json({ data: listing })
  } catch (error: any) {
    console.error('Error updating job listing:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update job listing' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/recruitment/job-listings/[id]
 * Soft delete a job listing
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    const { error } = await fromAts('job_listings')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)

    if (error) {
      console.error('Error deleting job listing:', error)
      throw new Error(`Failed to delete job listing: ${error.message || 'Unknown error'}`)
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting job listing:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete job listing' },
      { status: 500 }
    )
  }
}

