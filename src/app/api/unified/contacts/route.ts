import { NextRequest, NextResponse } from 'next/server'
import { dbAdmin } from '@/db/connections'
import { contactsInCore } from '@/db/schema/core'
import { eq, isNull } from 'drizzle-orm'

/**
 * GET /api/unified/contacts
 * Get contacts for dropdowns (simplified list)
 */
export async function GET(request: NextRequest) {
  try {
    const contacts = await dbAdmin
      .select({
        id: contactsInCore.id,
        name: contactsInCore.name,
        email: contactsInCore.email,
      })
      .from(contactsInCore)
      .where(isNull(contactsInCore.deletedAt))
      .limit(100)

    return NextResponse.json({ data: contacts })
  } catch (error: any) {
    console.error('[API] Error in GET /api/unified/contacts:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch contacts' },
      { status: 500 }
    )
  }
}

