import { NextRequest, NextResponse } from 'next/server'
import { dbAdmin } from '@/db/connections'
import { profilesInCore } from '@/db/schema/core'
import { eq, isNull } from 'drizzle-orm'

/**
 * GET /api/unified/profiles
 * Get profiles for dropdowns (simplified list)
 */
export async function GET(request: NextRequest) {
  try {
    const profiles = await dbAdmin
      .select({
        id: profilesInCore.id,
        firstName: profilesInCore.firstName,
        lastName: profilesInCore.lastName,
      })
      .from(profilesInCore)
      .where(isNull(profilesInCore.deletedAt))
      .limit(100)

    // Transform to snake_case
    const transformedProfiles = profiles.map((p) => ({
      id: p.id,
      first_name: p.firstName,
      last_name: p.lastName,
    }))

    return NextResponse.json({ data: transformedProfiles })
  } catch (error: any) {
    console.error('[API] Error in GET /api/unified/profiles:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch profiles' },
      { status: 500 }
    )
  }
}

