import { NextRequest, NextResponse } from 'next/server'
import { getLeadById, updateLead, deleteLead } from '@/lib/db/leads'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const lead = await getLeadById(id)

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    return NextResponse.json(lead)
  } catch (error: any) {
    console.error('Error fetching lead:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch lead' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()

    const lead = await updateLead(id, body)

    return NextResponse.json(lead)
  } catch (error: any) {
    console.error('Error updating lead:', error)
    return NextResponse.json({ error: error.message || 'Failed to update lead' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await deleteLead(id)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting lead:', error)
    return NextResponse.json({ error: error.message || 'Failed to delete lead' }, { status: 500 })
  }
}
