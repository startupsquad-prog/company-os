import { NextRequest, NextResponse } from 'next/server'
import { getLeads, createLead } from '@/lib/db/leads'
import type { CreateLeadInput, LeadFilters, LeadSort, LeadStatus } from '@/lib/types/leads'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams

    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '10')
    const sortField = searchParams.get('sortField') || 'created_at'
    const sortDirection = searchParams.get('sortDirection') || 'desc'
    const verticalId = searchParams.get('verticalId') || undefined

    const filters: LeadFilters = {}

    if (searchParams.get('status')) {
      filters.status = searchParams.get('status')!.split(',') as LeadStatus[]
    }

    if (searchParams.get('owner_id')) {
      filters.owner_id = searchParams.get('owner_id')!.split(',')
    }

    if (searchParams.get('source')) {
      filters.source = searchParams.get('source')!.split(',')
    }

    if (searchParams.get('date_from')) {
      filters.date_from = searchParams.get('date_from')!
    }

    if (searchParams.get('date_to')) {
      filters.date_to = searchParams.get('date_to')!
    }

    if (searchParams.get('value_min')) {
      filters.value_min = parseFloat(searchParams.get('value_min')!)
    }

    if (searchParams.get('value_max')) {
      filters.value_max = parseFloat(searchParams.get('value_max')!)
    }

    if (searchParams.get('tags')) {
      filters.tags = searchParams.get('tags')!.split(',')
    }

    if (searchParams.get('search')) {
      filters.search = searchParams.get('search')!
    }

    const sort: LeadSort = {
      field: sortField as LeadSort['field'],
      direction: sortDirection as 'asc' | 'desc',
    }

    const result = await getLeads(filters, sort, page, pageSize, verticalId as any)

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Error fetching leads:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch leads' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateLeadInput = await request.json()

    const lead = await createLead(body)

    return NextResponse.json(lead, { status: 201 })
  } catch (error: any) {
    console.error('Error creating lead:', error)
    return NextResponse.json({ error: error.message || 'Failed to create lead' }, { status: 500 })
  }
}
