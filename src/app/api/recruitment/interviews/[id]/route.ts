import { NextRequest, NextResponse } from 'next/server'
import { fromAts } from '@/lib/db/schema-helpers'

/**
 * PATCH /api/recruitment/interviews/[id]
 * Update an interview
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const updateData: any = {}
    if (body.application_id !== undefined) updateData.application_id = body.application_id
    if (body.candidate_id !== undefined) updateData.candidate_id = body.candidate_id
    if (body.interview_type !== undefined) updateData.interview_type = body.interview_type
    if (body.status !== undefined) updateData.status = body.status
    if (body.scheduled_at !== undefined) updateData.scheduled_at = body.scheduled_at
    if (body.duration_minutes !== undefined) updateData.duration_minutes = body.duration_minutes
    if (body.location !== undefined) updateData.location = body.location
    if (body.interviewer_ids !== undefined) updateData.interviewer_ids = body.interviewer_ids
    if (body.notes !== undefined) updateData.notes = body.notes
    if (body.feedback_summary !== undefined) updateData.feedback_summary = body.feedback_summary
    if (body.meta !== undefined) updateData.meta = body.meta
    if (body.updated_at) updateData.updated_at = body.updated_at

    const { data: interview, error } = await fromAts('interviews')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating interview:', error)
      throw new Error(`Failed to update interview: ${error.message || 'Unknown error'}`)
    }

    return NextResponse.json({ data: interview })
  } catch (error: any) {
    console.error('Error updating interview:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update interview' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/recruitment/interviews/[id]
 * Soft delete an interview
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const { error } = await fromAts('interviews')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)

    if (error) {
      console.error('Error deleting interview:', error)
      throw new Error(`Failed to delete interview: ${error.message || 'Unknown error'}`)
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting interview:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete interview' },
      { status: 500 }
    )
  }
}

