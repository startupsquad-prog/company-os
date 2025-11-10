import { NextRequest, NextResponse } from 'next/server'
import { getUnifiedClient } from '@/lib/db/unified-client'

/**
 * GET /api/unified/departments
 * Fetch departments (workaround for RLS issues)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = getUnifiedClient()

    const { data, error } = await supabase
      .schema('core')
      .from('departments')
      .select('id, name')
      .is('deleted_at', null)
      .order('name')

    if (error) {
      throw new Error(`Failed to fetch departments: ${error.message}`)
    }

    return NextResponse.json({
      data: data || [],
    })
  } catch (error: any) {
    console.error('Error fetching departments:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch departments' },
      { status: 500 }
    )
  }
}

