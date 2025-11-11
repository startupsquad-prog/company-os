import { NextRequest, NextResponse } from 'next/server'
import { fromCommonUtil, fromCore } from '@/lib/db/schema-helpers'

/**
 * GET /api/unified/projects/[id]/members
 * Get all members of a project
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const { data: members, error } = await fromCommonUtil('project_members')
      .select('*')
      .eq('project_id', id)

    if (error) {
      throw new Error(`Failed to fetch project members: ${error.message}`)
    }

    // Fetch profiles for members
    const profileIds = [...new Set((members || []).map((m: any) => m.profile_id).filter(Boolean))]
    const { data: profiles } = profileIds.length > 0
      ? await fromCore('profiles')
          .select('id, first_name, last_name, email, avatar_url')
          .in('id', profileIds)
      : { data: [] }

    const profilesMap = new Map((profiles || []).map((p: any) => [p.id, p]))

    const membersWithProfiles = (members || []).map((member: any) => ({
      ...member,
      profile: profilesMap.get(member.profile_id) || null,
    }))

    return NextResponse.json({ data: membersWithProfiles })
  } catch (error: any) {
    console.error('Error fetching project members:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch project members' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/unified/projects/[id]/members
 * Add a member to a project
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const memberData = {
      project_id: id,
      profile_id: body.profile_id,
      role: body.role || 'collaborator',
    }

    const { data: member, error } = await fromCommonUtil('project_members')
      .insert(memberData)
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'Member already exists in project' },
          { status: 409 }
        )
      }
      throw new Error(`Failed to add project member: ${error.message}`)
    }

    // Fetch profile for the member
    const { data: profile } = await fromCore('profiles')
      .select('id, first_name, last_name, email, avatar_url')
      .eq('id', body.profile_id)
      .single()

    return NextResponse.json(
      {
        data: {
          ...member,
          profile: profile || null,
        },
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Error adding project member:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to add project member' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/unified/projects/[id]/members
 * Remove a member from a project
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const searchParams = request.nextUrl.searchParams
    const profileId = searchParams.get('profile_id')

    if (!profileId) {
      return NextResponse.json({ error: 'profile_id is required' }, { status: 400 })
    }

    const { error } = await fromCommonUtil('project_members')
      .delete()
      .eq('project_id', id)
      .eq('profile_id', profileId)

    if (error) {
      throw new Error(`Failed to remove project member: ${error.message}`)
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error removing project member:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to remove project member' },
      { status: 500 }
    )
  }
}

