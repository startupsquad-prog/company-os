import { NextRequest, NextResponse } from 'next/server'
import { getUnifiedClient } from '@/lib/db/unified-client'

/**
 * GET /api/unified/employees/[id]
 * Get a single employee by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = getUnifiedClient()

    const { data: employee, error } = await ((supabase as any)
      .from('employees')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .single())

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
      }
      throw new Error(`Failed to fetch employee: ${error.message}`)
    }

    const employeeTyped = employee as any

    // Fetch related profile
    const profileResult = employeeTyped.profile_id
      ? await supabase
          .from('profiles')
          .select('id, first_name, last_name, email, phone, avatar_url, department_id')
          .eq('id', employeeTyped.profile_id)
          .single()
      : { data: null }
    const { data: profile } = profileResult
    const profileTyped = profile as any

    // Fetch department if profile has one
    const departmentResult = profileTyped?.department_id
      ? await supabase
          .from('departments')
          .select('id, name')
          .eq('id', profileTyped.department_id)
          .single()
      : { data: null }
    const { data: department } = departmentResult

    return NextResponse.json({
      data: {
        ...employeeTyped,
        profile: profileTyped,
        department,
      },
    })
  } catch (error: any) {
    console.error('Error fetching employee:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch employee' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/unified/employees/[id]
 * Update an employee
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const supabase = getUnifiedClient()

    const updateData: Record<string, any> = {}
    if (body.employee_id !== undefined) updateData.employee_id = body.employee_id
    if (body.status !== undefined) updateData.status = body.status
    if (body.hire_date !== undefined) updateData.hire_date = body.hire_date
    if (body.termination_date !== undefined) updateData.termination_date = body.termination_date
    if (body.updated_by !== undefined) updateData.updated_by = body.updated_by

    const { data: employee, error } = await ((supabase as any)
      .from('employees')
      .update(updateData)
      .eq('id', id)
      .select()
      .single())

    if (error) {
      throw new Error(`Failed to update employee: ${error.message}`)
    }

    return NextResponse.json({ data: employee as any }, { status: 200 })
  } catch (error: any) {
    console.error('Error updating employee:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update employee' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/unified/employees/[id]
 * Soft delete an employee
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = getUnifiedClient()

    const { error } = await ((supabase as any)
      .from('employees')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id))

    if (error) {
      throw new Error(`Failed to delete employee: ${error.message}`)
    }

    return NextResponse.json({ message: 'Employee deleted successfully' }, { status: 200 })
  } catch (error: any) {
    console.error('Error deleting employee:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete employee' },
      { status: 500 }
    )
  }
}

