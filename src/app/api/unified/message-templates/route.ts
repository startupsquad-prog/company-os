import { NextRequest, NextResponse } from 'next/server'
import { fromCrm } from '@/lib/db/schema-helpers'

/**
 * GET /api/unified/message-templates
 * Get message templates by type and category
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const templateType = searchParams.get('type') // whatsapp, email, sms
    const category = searchParams.get('category') // greeting, follow_up, closing, etc.
    const verticalId = searchParams.get('verticalId')

    let query = fromCrm('message_templates')
      .select('*')
      .eq('is_active', true)
      .is('deleted_at', null)

    if (templateType) {
      query = query.eq('template_type', templateType)
    }

    if (category) {
      query = query.eq('category', category)
    }

    if (verticalId && verticalId !== 'all') {
      query = query.eq('vertical_id', verticalId)
    }

    query = query.order('is_default', { ascending: false })
      .order('name', { ascending: true })

    const { data: templates, error } = await query

    if (error) {
      const errorDetails = {
        message: error.message || 'Unknown error',
        code: error.code,
        details: error.details,
        hint: error.hint,
      }
      console.error('Error fetching templates:', errorDetails)
      throw new Error(`Failed to fetch templates: ${errorDetails.message || 'Unknown error'}`)
    }

    return NextResponse.json({ templates: templates || [] })
  } catch (error: any) {
    const errorDetails = {
      message: error.message || 'Unknown error',
      stack: error.stack,
      error: JSON.stringify(error, Object.getOwnPropertyNames(error), 2),
    }
    console.error('Error fetching templates:', errorDetails)
    return NextResponse.json(
      { error: errorDetails.message || 'Failed to fetch templates' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/unified/message-templates
 * Create a new message template
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const templateData = {
      name: body.name,
      description: body.description,
      template_type: body.template_type,
      subject: body.subject,
      content: body.content,
      variables: body.variables || [],
      category: body.category,
      is_active: body.is_active !== undefined ? body.is_active : true,
      is_default: body.is_default !== undefined ? body.is_default : false,
      vertical_id: body.vertical_id,
      created_by: body.created_by,
    }

    const { data: template, error } = await fromCrm('message_templates')
      .insert(templateData)
      .select()
      .single()

    if (error) {
      const errorDetails = {
        message: error.message || 'Unknown error',
        code: error.code,
        details: error.details,
        hint: error.hint,
      }
      console.error('Error creating template:', errorDetails)
      throw new Error(`Failed to create template: ${errorDetails.message || 'Unknown error'}`)
    }

    return NextResponse.json({ data: template }, { status: 201 })
  } catch (error: any) {
    const errorDetails = {
      message: error.message || 'Unknown error',
      stack: error.stack,
      error: JSON.stringify(error, Object.getOwnPropertyNames(error), 2),
    }
    console.error('Error creating template:', errorDetails)
    return NextResponse.json(
      { error: errorDetails.message || 'Failed to create template' },
      { status: 500 }
    )
  }
}

