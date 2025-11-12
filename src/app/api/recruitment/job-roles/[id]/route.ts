import { NextRequest, NextResponse } from 'next/server'
import { fromAts } from '@/lib/db/schema-helpers'

/**
 * GET /api/recruitment/job-roles/[id]
 * Fetch a single job role by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    const { data: role, error } = await fromAts('job_roles')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .single()

    if (error) {
      console.error('Error fetching job role:', error)
      throw new Error(`Failed to fetch job role: ${error.message || 'Unknown error'}`)
    }

    if (!role) {
      return NextResponse.json(
        { error: 'Job role not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ data: role })
  } catch (error: any) {
    console.error('Error fetching job role:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch job role' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/recruitment/job-roles/[id]
 * Update a job role
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()

    const updateData: any = {}
    if (body.title !== undefined) updateData.title = body.title
    if (body.department !== undefined) updateData.department = body.department
    if (body.location !== undefined) updateData.location = body.location
    if (body.employment_type !== undefined) updateData.employment_type = body.employment_type
    if (body.status !== undefined) updateData.status = body.status
    if (body.description !== undefined) updateData.description = body.description
    if (body.requirements !== undefined) updateData.requirements = body.requirements
    if (body.responsibilities !== undefined) updateData.responsibilities = body.responsibilities
    if (body.salary_range_min !== undefined) updateData.salary_range_min = body.salary_range_min
    if (body.salary_range_max !== undefined) updateData.salary_range_max = body.salary_range_max
    if (body.currency !== undefined) updateData.currency = body.currency
    if (body.experience_required_years !== undefined) updateData.experience_required_years = body.experience_required_years
    if (body.tags !== undefined) updateData.tags = body.tags
    if (body.notes !== undefined) updateData.notes = body.notes
    if (body.updated_at) updateData.updated_at = body.updated_at

    const { data: role, error } = await fromAts('job_roles')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating job role:', error)
      throw new Error(`Failed to update job role: ${error.message || 'Unknown error'}`)
    }

    return NextResponse.json({ data: role })
  } catch (error: any) {
    console.error('Error updating job role:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update job role' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/recruitment/job-roles/[id]
 * Soft delete a job role
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    const { error } = await fromAts('job_roles')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)

    if (error) {
      console.error('Error deleting job role:', error)
      throw new Error(`Failed to delete job role: ${error.message || 'Unknown error'}`)
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting job role:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete job role' },
      { status: 500 }
    )
  }
}

