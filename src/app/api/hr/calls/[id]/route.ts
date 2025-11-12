import { NextRequest, NextResponse } from 'next/server'
import { fromAts } from '@/lib/db/schema-helpers'

/**
 * GET /api/hr/calls/[id]
 * Get a single recruitment call by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const { data: call, error } = await fromAts('calls')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Call not found' }, { status: 404 })
      }
      throw new Error(`Failed to fetch call: ${error.message}`)
    }

    return NextResponse.json({ call })
  } catch (error: any) {
    console.error('Error fetching call:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch call' }, { status: 500 })
  }
}

/**
 * PATCH /api/hr/calls/[id]
 * Update a recruitment call
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

    if (body.candidate_id !== undefined) updateData.candidate_id = body.candidate_id
    if (body.application_id !== undefined) updateData.application_id = body.application_id
    if (body.caller_id !== undefined) updateData.caller_id = body.caller_id
    if (body.call_type !== undefined) updateData.call_type = body.call_type
    if (body.direction !== undefined) updateData.direction = body.direction
    if (body.phone_number !== undefined) updateData.phone_number = body.phone_number
    if (body.duration_seconds !== undefined) updateData.duration_seconds = body.duration_seconds
    if (body.status !== undefined) updateData.status = body.status
    if (body.outcome !== undefined) updateData.outcome = body.outcome
    if (body.subject !== undefined) updateData.subject = body.subject
    if (body.notes !== undefined) updateData.notes = body.notes
    if (body.recording_url !== undefined) updateData.recording_url = body.recording_url
    if (body.scheduled_at !== undefined) updateData.scheduled_at = body.scheduled_at
    if (body.started_at !== undefined) updateData.started_at = body.started_at
    if (body.ended_at !== undefined) updateData.ended_at = body.ended_at
    if (body.meta !== undefined) updateData.meta = body.meta

    const { data: call, error } = await fromAts('calls')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Call not found' }, { status: 404 })
      }
      throw new Error(`Failed to update call: ${error.message}`)
    }

    return NextResponse.json({ call })
  } catch (error: any) {
    console.error('Error updating call:', error)
    return NextResponse.json({ error: error.message || 'Failed to update call' }, { status: 500 })
  }
}

/**
 * DELETE /api/hr/calls/[id]
 * Soft delete a recruitment call
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const { error } = await fromAts('calls')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)

    if (error) {
      throw new Error(`Failed to delete call: ${error.message}`)
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting call:', error)
    return NextResponse.json({ error: error.message || 'Failed to delete call' }, { status: 500 })
  }
}

