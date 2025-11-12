import { NextRequest, NextResponse } from 'next/server'
import { fromAts } from '@/lib/db/schema-helpers'

/**
 * GET /api/hr/candidates/[id]
 * Get a single candidate by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const { data: candidate, error } = await fromAts('candidates')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Candidate not found' }, { status: 404 })
      }
      throw new Error(`Failed to fetch candidate: ${error.message}`)
    }

    return NextResponse.json({ candidate })
  } catch (error: any) {
    console.error('Error fetching candidate:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch candidate' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/hr/candidates/[id]
 * Update a candidate
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

    if (body.contact_id !== undefined) updateData.contact_id = body.contact_id
    if (body.status !== undefined) updateData.status = body.status
    if (body.source !== undefined) updateData.source = body.source
    if (body.recruiter_id !== undefined) updateData.recruiter_id = body.recruiter_id
    if (body.resume_url !== undefined) updateData.resume_url = body.resume_url
    if (body.cover_letter_url !== undefined) updateData.cover_letter_url = body.cover_letter_url
    if (body.tags !== undefined) updateData.tags = body.tags
    if (body.notes !== undefined) updateData.notes = body.notes
    if (body.meta !== undefined) updateData.meta = body.meta

    const { data: candidate, error } = await fromAts('candidates')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Candidate not found' }, { status: 404 })
      }
      throw new Error(`Failed to update candidate: ${error.message}`)
    }

    return NextResponse.json({ candidate })
  } catch (error: any) {
    console.error('Error updating candidate:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update candidate' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/hr/candidates/[id]
 * Soft delete a candidate
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const { error } = await fromAts('candidates')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)

    if (error) {
      throw new Error(`Failed to delete candidate: ${error.message}`)
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting candidate:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete candidate' },
      { status: 500 }
    )
  }
}

