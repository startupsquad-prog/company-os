import { NextRequest, NextResponse } from 'next/server'
import { fromAts, fromCore } from '@/lib/db/schema-helpers'
import { createServiceRoleClient } from '@/lib/supabase/server'

/**
 * GET /api/recruitment/candidates/[id]
 * Fetch a single candidate by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const supabase = createServiceRoleClient()

    const { data: candidate, error } = await supabase
      .schema('ats')
      .from('candidates')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .single()

    if (error) {
      console.error('Error fetching candidate:', error)
      throw new Error(`Failed to fetch candidate: ${error.message || 'Unknown error'}`)
    }

    if (!candidate) {
      return NextResponse.json(
        { error: 'Candidate not found' },
        { status: 404 }
      )
    }

    // Fetch related data
    const contactId = candidate.contact_id
    let contact = null
    if (contactId) {
      const { data: contactData } = await supabase
        .schema('core')
        .from('contacts')
        .select('id, name, email, phone')
        .eq('id', contactId)
        .maybeSingle()
      contact = contactData
    }

    let recruiter = null
    if (candidate.recruiter_id) {
      const { data: recruiterData } = await supabase
        .schema('core')
        .from('profiles')
        .select('id, first_name, last_name, email')
        .eq('id', candidate.recruiter_id)
        .maybeSingle()
      recruiter = recruiterData
    }

    return NextResponse.json({
      data: {
        ...candidate,
        contact,
        recruiter,
      },
    })
  } catch (error: any) {
    console.error('Error fetching candidate:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch candidate' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/recruitment/candidates/[id]
 * Update a candidate
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()
    const supabase = createServiceRoleClient()

    const updateData: any = {}
    if (body.contact_id !== undefined) updateData.contact_id = body.contact_id
    if (body.status !== undefined) updateData.status = body.status
    if (body.source !== undefined) updateData.source = body.source
    if (body.recruiter_id !== undefined) updateData.recruiter_id = body.recruiter_id
    if (body.resume_url !== undefined) updateData.resume_url = body.resume_url
    if (body.cover_letter_url !== undefined) updateData.cover_letter_url = body.cover_letter_url
    if (body.tags !== undefined) updateData.tags = body.tags
    if (body.notes !== undefined) updateData.notes = body.notes
    if (body.meta !== undefined) updateData.meta = body.meta
    if (body.updated_at) updateData.updated_at = body.updated_at

    const { data: candidate, error } = await supabase
      .schema('ats')
      .from('candidates')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating candidate:', error)
      throw new Error(`Failed to update candidate: ${error.message || 'Unknown error'}`)
    }

    return NextResponse.json({ data: candidate })
  } catch (error: any) {
    console.error('Error updating candidate:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update candidate' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/recruitment/candidates/[id]
 * Soft delete a candidate
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const supabase = createServiceRoleClient()

    const { error } = await supabase
      .schema('ats')
      .from('candidates')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)

    if (error) {
      console.error('Error deleting candidate:', error)
      throw new Error(`Failed to delete candidate: ${error.message || 'Unknown error'}`)
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


