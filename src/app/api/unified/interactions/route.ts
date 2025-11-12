import { NextRequest, NextResponse } from 'next/server'
import { fromCrm } from '@/lib/db/schema-helpers'

/**
 * POST /api/unified/interactions
 * Create a new interaction
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Get created_by from body or use a default (for testing)
    // In production, this should come from authenticated user
    const interactionData = {
      entity_type: body.entity_type,
      entity_id: body.entity_id,
      type: body.type,
      subject: body.subject,
      notes: body.notes,
      scheduled_at: body.scheduled_at,
      duration_minutes: body.duration_minutes,
      outcome: body.outcome,
      meta: body.meta || {},
      created_by: body.created_by || null, // Clerk user ID
    }

    const { data: interaction, error } = await fromCrm('interactions')
      .insert(interactionData)
      .select()
      .single()

    if (error) {
      const errorDetails = {
        message: error.message || 'Unknown error',
        code: error.code,
        details: error.details,
        hint: error.hint,
      }
      console.error('Error creating interaction:', errorDetails)
      throw new Error(`Failed to create interaction: ${errorDetails.message || 'Unknown error'}`)
    }

    return NextResponse.json({ data: interaction }, { status: 201 })
  } catch (error: any) {
    const errorDetails = {
      message: error.message || 'Unknown error',
      stack: error.stack,
      error: JSON.stringify(error, Object.getOwnPropertyNames(error), 2),
    }
    console.error('Error creating interaction:', errorDetails)
    return NextResponse.json(
      { error: errorDetails.message || 'Failed to create interaction' },
      { status: 500 }
    )
  }
}

