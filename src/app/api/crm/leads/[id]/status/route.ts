import { NextRequest, NextResponse } from 'next/server'
import { updateLeadStatus } from '@/lib/db/leads'
import type { UpdateLeadStatusInput } from '@/lib/types/leads'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body: Omit<UpdateLeadStatusInput, 'lead_id'> = await request.json()
    
    const lead = await updateLeadStatus({
      lead_id: params.id,
      ...body,
    })
    
    return NextResponse.json(lead)
  } catch (error: any) {
    console.error('Error updating lead status:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update lead status' },
      { status: 500 }
    )
  }
}

