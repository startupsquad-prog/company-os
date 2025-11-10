import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

/**
 * POST /api/users/invite
 * Send an invitation email to a user via Clerk
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if Clerk secret key is configured
    if (!process.env.CLERK_SECRET_KEY) {
      console.error('CLERK_SECRET_KEY is not set in environment variables')
      return NextResponse.json(
        {
          error: 'Server configuration error',
          details: 'Clerk secret key is not configured. Please set CLERK_SECRET_KEY environment variable.',
        },
        { status: 500 }
      )
    }

    const body = await request.json()
    const { email, firstName, lastName, publicMetadata, privateMetadata } = body

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    // Create invitation in Clerk using Backend API
    try {
      console.log('Creating invitation for email:', email)
      
      // Use Clerk Backend API directly
      const clerkApiUrl = 'https://api.clerk.com/v1/invitations'
      const clerkSecretKey = process.env.CLERK_SECRET_KEY
      
      if (!clerkSecretKey) {
        throw new Error('CLERK_SECRET_KEY is not configured')
      }

      const invitationPayload: any = {
        email_address: email,
      }

      if (publicMetadata) {
        invitationPayload.public_metadata = publicMetadata
      }

      if (privateMetadata) {
        invitationPayload.private_metadata = privateMetadata
      }

      const response = await fetch(clerkApiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${clerkSecretKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invitationPayload),
      })

      const invitationData = await response.json()

      if (!response.ok) {
        // Handle Clerk API errors
        const errorMessage = invitationData.errors?.[0]?.longMessage || 
                            invitationData.errors?.[0]?.message || 
                            invitationData.message || 
                            'Failed to create invitation'
        throw new Error(errorMessage)
      }

      console.log('Invitation created successfully:', invitationData.id)

      return NextResponse.json(
        {
          success: true,
          invitation: {
            id: invitationData.id,
            emailAddress: invitationData.email_address,
            status: invitationData.status,
          },
        },
        { status: 201 }
      )
    } catch (clerkError: any) {
      console.error('Error creating invitation in Clerk:', {
        error: clerkError,
        message: clerkError?.message,
        errors: clerkError?.errors,
        status: clerkError?.status,
        statusText: clerkError?.statusText,
        stack: clerkError?.stack,
      })
      
      // Extract detailed error message
      let errorMessage = 'Failed to create invitation'
      let errorDetails = 'Unknown error'
      
      if (clerkError?.errors && Array.isArray(clerkError.errors) && clerkError.errors.length > 0) {
        errorDetails = clerkError.errors[0].message || JSON.stringify(clerkError.errors[0])
        errorMessage = clerkError.errors[0].message || errorMessage
      } else if (clerkError?.message) {
        errorDetails = clerkError.message
        errorMessage = clerkError.message
      } else if (typeof clerkError === 'string') {
        errorDetails = clerkError
        errorMessage = clerkError
      }
      
      return NextResponse.json(
        {
          error: errorMessage,
          details: errorDetails,
          fullError: process.env.NODE_ENV === 'development' ? JSON.stringify(clerkError, null, 2) : undefined,
        },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Error creating invitation:', error)
    return NextResponse.json(
      {
        error: 'Failed to create invitation',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}


