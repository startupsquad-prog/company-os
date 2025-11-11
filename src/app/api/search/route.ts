import { fromCommonUtil, fromCore } from '@/lib/db/schema-helpers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''
    const limit = parseInt(searchParams.get('limit') || '10')

    if (!query || query.trim().length === 0) {
      return NextResponse.json({
        tasks: [],
        contacts: [],
        companies: [],
        profiles: [],
        total: 0,
      })
    }

    const searchTerm = `%${query}%`

    // Search tasks
    const { data: tasks, error: tasksError } = await fromCommonUtil('tasks')
      .select('id, title, description, status, priority, created_at')
      .or(`title.ilike.${searchTerm},description.ilike.${searchTerm}`)
      .is('deleted_at', null)
      .limit(limit)
      .order('created_at', { ascending: false })

    // Search contacts
    const { data: contacts, error: contactsError } = await fromCore('contacts')
      .select('id, name, email, phone, contact_type, created_at')
      .or(`name.ilike.${searchTerm},email.ilike.${searchTerm},phone.ilike.${searchTerm}`)
      .is('deleted_at', null)
      .limit(limit)
      .order('created_at', { ascending: false })

    // Search companies
    const { data: companies, error: companiesError } = await fromCore('companies')
      .select('id, name, legal_name, website, industry, created_at')
      .or(`name.ilike.${searchTerm},legal_name.ilike.${searchTerm},website.ilike.${searchTerm}`)
      .is('deleted_at', null)
      .limit(limit)
      .order('created_at', { ascending: false })

    // Search profiles (employees/users)
    const { data: profiles, error: profilesError } = await fromCore('profiles')
      .select('id, first_name, last_name, email, phone, created_at')
      .or(
        `first_name.ilike.${searchTerm},last_name.ilike.${searchTerm},email.ilike.${searchTerm},phone.ilike.${searchTerm}`
      )
      .is('deleted_at', null)
      .limit(limit)
      .order('created_at', { ascending: false })

    if (tasksError) {
      console.error('Tasks search error:', tasksError)
    }
    if (contactsError) {
      console.error('Contacts search error:', contactsError)
    }
    if (companiesError) {
      console.error('Companies search error:', companiesError)
    }
    if (profilesError) {
      console.error('Profiles search error:', profilesError)
    }

    const total =
      (tasks?.length || 0) +
      (contacts?.length || 0) +
      (companies?.length || 0) +
      (profiles?.length || 0)

    return NextResponse.json({
      tasks: tasks || [],
      contacts: contacts || [],
      companies: companies || [],
      profiles: profiles || [],
      total,
    })
  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json(
      {
        error: 'Failed to perform search',
        tasks: [],
        contacts: [],
        companies: [],
        profiles: [],
        total: 0,
      },
      { status: 500 }
    )
  }
}


