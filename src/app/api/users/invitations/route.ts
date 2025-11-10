import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

/**
 * GET /api/users/invitations
 * Fetch all invitations from Clerk
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if Clerk secret key is configured
    if (!process.env.CLERK_SECRET_KEY) {
      return NextResponse.json(
        {
          error: 'Server configuration error',
          details: 'Clerk secret key is not configured',
        },
        { status: 500 }
      )
    }

    const clerkApiUrl = 'https://api.clerk.com/v1/invitations'
    const clerkSecretKey = process.env.CLERK_SECRET_KEY

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') // 'pending', 'accepted', 'revoked', etc.

    let url = clerkApiUrl
    if (status) {
      url += `?status=${status}`
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${clerkSecretKey}`,
        'Content-Type': 'application/json',
      },
    })

    const data = await response.json()

    if (!response.ok) {
      const errorMessage = data.errors?.[0]?.longMessage || 
                          data.errors?.[0]?.message || 
                          data.message || 
                          'Failed to fetch invitations'
      return NextResponse.json(
        {
          error: 'Failed to fetch invitations',
          details: errorMessage,
        },
        { status: response.status }
      )
    }

    return NextResponse.json({
      success: true,
      invitations: data.data || data || [],
      total: data.total_count || (Array.isArray(data) ? data.length : 0),
    })
  } catch (error) {
    console.error('Error fetching invitations:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch invitations',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

