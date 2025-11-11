import { NextRequest, NextResponse } from 'next/server'
import { fromCore } from '@/lib/db/schema-helpers'

/**
 * GET /api/unified/users/[id]
 * Get a single user (profile) by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const { data: profile, error } = await fromCore('profiles')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }
      throw new Error(`Failed to fetch user: ${error.message}`)
    }

    const profileTyped = profile as any

    // Fetch department if profile has one
    const { data: department } = profileTyped.department_id
      ? await fromCore('departments')
          .select('id, name')
          .eq('id', profileTyped.department_id)
          .single()
      : { data: null }

    return NextResponse.json({
      data: {
        ...profileTyped,
        department,
      },
    })
  } catch (error: any) {
    console.error('Error fetching user:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch user' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/unified/users/[id]
 * Update a user (profile)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const updateData: Record<string, any> = {}
    if (body.first_name !== undefined) updateData.first_name = body.first_name
    if (body.last_name !== undefined) updateData.last_name = body.last_name
    if (body.email !== undefined) updateData.email = body.email
    if (body.phone !== undefined) updateData.phone = body.phone
    if (body.avatar_url !== undefined) updateData.avatar_url = body.avatar_url
    if (body.department_id !== undefined) updateData.department_id = body.department_id
    if (body.updated_by !== undefined) updateData.updated_by = body.updated_by

    const { data: profile, error } = await fromCore('profiles')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update user: ${error.message}`)
    }

    return NextResponse.json({ data: profile }, { status: 200 })
  } catch (error: any) {
    console.error('Error updating user:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update user' },
      { status: 500 }
    )
  }
}

