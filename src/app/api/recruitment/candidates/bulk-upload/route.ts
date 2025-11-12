import { NextRequest, NextResponse } from 'next/server'
import { fromAts, fromCore } from '@/lib/db/schema-helpers'

/**
 * POST /api/recruitment/candidates/bulk-upload
 * Bulk upload candidates from CSV
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    const text = await file.text()
    const lines = text.split('\n').filter(line => line.trim())
    
    if (lines.length < 2) {
      return NextResponse.json(
        { error: 'CSV must have at least a header and one data row' },
        { status: 400 }
      )
    }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
    const requiredHeaders = ['name', 'email']
    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h))
    
    if (missingHeaders.length > 0) {
      return NextResponse.json(
        { error: `Missing required headers: ${missingHeaders.join(', ')}` },
        { status: 400 }
      )
    }

    const results: Array<{ row: number; success: boolean; message: string; candidateId?: string }> = []
    const createdBy = formData.get('created_by') as string

    for (let i = 1; i < lines.length; i++) {
      const row = lines[i]
      const values = row.split(',').map(v => v.trim())
      
      if (values.length !== headers.length) {
        results.push({
          row: i + 1,
          success: false,
          message: 'Column count mismatch',
        })
        continue
      }

      const rowData: Record<string, string> = {}
      headers.forEach((header, index) => {
        rowData[header] = values[index] || ''
      })

      const name = rowData.name
      const email = rowData.email
      const phone = rowData.phone || ''
      const source = (rowData.source || 'other') as any
      const status = (rowData.status || 'new') as any
      const notes = rowData.notes || ''

      if (!name || !email) {
        results.push({
          row: i + 1,
          success: false,
          message: 'Name and email are required',
        })
        continue
      }

      try {
        // Check if contact exists
        const { data: existingContacts } = await fromCore('contacts')
          .select('id')
          .eq('email', email)
          .is('deleted_at', null)
          .limit(1)

        let contactId: string

        if (existingContacts && existingContacts.length > 0) {
          contactId = existingContacts[0].id
        } else {
          // Create new contact
          const { data: newContact, error: contactError } = await fromCore('contacts')
            .insert({
              name,
              email,
              phone: phone || null,
            })
            .select()
            .single()

          if (contactError || !newContact) {
            results.push({
              row: i + 1,
              success: false,
              message: `Failed to create contact: ${contactError?.message || 'Unknown error'}`,
            })
            continue
          }

          contactId = newContact.id
        }

        // Check if candidate already exists
        const { data: existingCandidates } = await fromAts('candidates')
          .select('id')
          .eq('contact_id', contactId)
          .is('deleted_at', null)
          .limit(1)

        if (existingCandidates && existingCandidates.length > 0) {
          results.push({
            row: i + 1,
            success: false,
            message: 'Candidate already exists',
            candidateId: existingCandidates[0].id,
          })
          continue
        }

        // Create candidate
        const { data: candidate, error: candidateError } = await fromAts('candidates')
          .insert({
            contact_id: contactId,
            status,
            source,
            notes: notes || null,
            created_by: createdBy,
          })
          .select()
          .single()

        if (candidateError || !candidate) {
          results.push({
            row: i + 1,
            success: false,
            message: `Failed to create candidate: ${candidateError?.message || 'Unknown error'}`,
          })
          continue
        }

        results.push({
          row: i + 1,
          success: true,
          message: 'Candidate created successfully',
          candidateId: candidate.id,
        })
      } catch (error: any) {
        results.push({
          row: i + 1,
          success: false,
          message: error.message || 'Unknown error',
        })
      }
    }

    const successCount = results.filter(r => r.success).length
    const errorCount = results.filter(r => !r.success).length

    return NextResponse.json({
      success: true,
      total: results.length,
      successCount,
      errorCount,
      results,
    })
  } catch (error: any) {
    console.error('Error in bulk upload:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to process bulk upload' },
      { status: 500 }
    )
  }
}

