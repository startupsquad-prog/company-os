import { NextRequest, NextResponse } from 'next/server'
import { getLeadById, updateLead, deleteLead } from '@/lib/db/leads'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const lead = await getLeadById(params.id)

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    return NextResponse.json(lead)
  } catch (error: any) {
    console.error('Error fetching lead:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch lead' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()

    const lead = await updateLead(params.id, body)

    return NextResponse.json(lead)
  } catch (error: any) {
    console.error('Error updating lead:', error)
    return NextResponse.json({ error: error.message || 'Failed to update lead' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await deleteLead(params.id)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting lead:', error)
    return NextResponse.json({ error: error.message || 'Failed to delete lead' }, { status: 500 })
  }
}
