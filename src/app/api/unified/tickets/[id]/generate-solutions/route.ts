import { NextRequest, NextResponse } from 'next/server'
import { generateText } from 'ai'
import { openai } from '@ai-sdk/openai'
import { getTicketSolutions, createTicketSolution, getTicketById, getProfileIdFromClerkUserId } from '@/lib/db/tickets-drizzle'
import { getClerkUserId } from '@/lib/auth/clerk'

// Route segment config
// Note: Using nodejs runtime instead of edge because edge runtime doesn't support postgres-js database connections
// Edge runtime would require Neon HTTP driver or similar edge-compatible database client
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 30

/**
 * POST /api/unified/tickets/[id]/generate-solutions
 * Generate AI-powered solutions for a ticket using OpenAI
 * Only generates if no solutions exist for the ticket
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: ticketId } = await params

    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      console.error('[API] OPENAI_API_KEY is not configured')
      return NextResponse.json(
        { error: 'OpenAI API key is not configured' },
        { status: 500 }
      )
    }

    // Check if solutions already exist
    const existingSolutions = await getTicketSolutions(ticketId)
    if (existingSolutions.length > 0) {
      return NextResponse.json(
        { error: 'Solutions already exist for this ticket. Please delete existing solutions before generating new ones.' },
        { status: 400 }
      )
    }

    // Fetch ticket details
    const ticket = await getTicketById(ticketId)
    if (!ticket) {
      return NextResponse.json(
        { error: 'Ticket not found' },
        { status: 404 }
      )
    }

    // Get user profile ID for created_by
    let profileId: string | null = null
    try {
      const userId = await getClerkUserId()
      if (userId) {
        profileId = await getProfileIdFromClerkUserId(userId)
      }
    } catch (error) {
      console.warn('[API] Auth check failed, continuing without auth for testing')
    }

    // Construct prompt
    const prompt = `Analyze the following support ticket and generate structured solutions.

Ticket Title: ${ticket.title || 'Untitled'}
Ticket Description: ${ticket.description || 'No description provided'}

Generate up to 2 solutions for resolving this ticket. Each solution should have:
- A clear, concise title (one line)
- A brief description explaining the solution approach
- Up to 4 checklist items that break down the solution into actionable, self-explanatory steps (each item should be a one-liner)

Requirements:
- Maximum 2 solutions
- Maximum 4 checklist items per solution
- Checklist items must be one-liners and self-explanatory
- Solutions should be practical and actionable
- Break down complex tasks into simple, clear steps

Return your response as a valid JSON array with this exact structure:
[
  {
    "title": "Solution title here",
    "description": "Brief description of the solution approach",
    "checklist_items": [
      {"text": "First actionable step", "position": 0},
      {"text": "Second actionable step", "position": 1},
      {"text": "Third actionable step", "position": 2},
      {"text": "Fourth actionable step", "position": 3}
    ]
  },
  {
    "title": "Alternative solution title",
    "description": "Brief description of alternative approach",
    "checklist_items": [
      {"text": "First step", "position": 0},
      {"text": "Second step", "position": 1}
    ]
  }
]

Important: Return ONLY valid JSON, no markdown formatting, no code blocks, no explanations. Just the JSON array.`

    // Generate solutions using OpenAI
    console.log('[API] Generating solutions for ticket:', ticketId)
    const result = await generateText({
      model: openai('gpt-4o-mini'),
      prompt,
      temperature: 0.7,
      maxTokens: 2000,
    })

    // Parse the response
    let solutionsData: Array<{
      title: string
      description: string
      checklist_items: Array<{ text: string; position: number }>
    }> = []

    try {
      // Try to parse as JSON (handle cases where response might have markdown code blocks)
      let text = result.text.trim()
      
      // Remove markdown code blocks if present
      if (text.startsWith('```json')) {
        text = text.replace(/^```json\s*/, '').replace(/\s*```$/, '')
      } else if (text.startsWith('```')) {
        text = text.replace(/^```\s*/, '').replace(/\s*```$/, '')
      }

      solutionsData = JSON.parse(text)

      // Validate structure
      if (!Array.isArray(solutionsData)) {
        throw new Error('Response is not an array')
      }

      // Enforce constraints
      if (solutionsData.length > 2) {
        solutionsData = solutionsData.slice(0, 2)
      }

      // Validate and clean each solution
      solutionsData = solutionsData.map((solution, index) => {
        if (!solution.title || !solution.description) {
          throw new Error(`Solution ${index + 1} is missing title or description`)
        }

        // Ensure checklist_items is an array
        const checklistItems = Array.isArray(solution.checklist_items) 
          ? solution.checklist_items 
          : []

        // Limit to 4 items and ensure proper structure
        const cleanedItems = checklistItems
          .slice(0, 4)
          .map((item: any, itemIndex: number) => ({
            id: crypto.randomUUID(),
            text: typeof item.text === 'string' ? item.text.trim() : String(item.text || '').trim(),
            is_completed: false,
            position: typeof item.position === 'number' ? item.position : itemIndex,
          }))
          .filter((item: any) => item.text.length > 0)

        return {
          title: solution.title.trim(),
          description: solution.description.trim(),
          checklist_items: cleanedItems,
        }
      }).filter((solution) => solution.title.length > 0)

      if (solutionsData.length === 0) {
        throw new Error('No valid solutions generated')
      }

    } catch (parseError) {
      console.error('[API] Error parsing AI response:', parseError)
      console.error('[API] Raw response:', result.text)
      return NextResponse.json(
        { error: 'Failed to parse AI response. Please try again.' },
        { status: 500 }
      )
    }

    // Create solutions in database
    const createdSolutions = []
    for (const solutionData of solutionsData) {
      try {
        const solution = await createTicketSolution(
          ticketId,
          solutionData.title,
          solutionData.description,
          solutionData.checklist_items,
          profileId
        )
        createdSolutions.push({
          id: solution.id,
          ticket_id: solution.ticketId,
          title: solution.title,
          description: solution.description,
          checklist_items: solution.checklistItems || [],
          is_active: solution.isActive,
          created_at: solution.createdAt,
          updated_at: solution.updatedAt,
          created_by: solution.createdBy,
        })
      } catch (dbError) {
        console.error('[API] Error creating solution in database:', dbError)
        // Continue with other solutions even if one fails
      }
    }

    if (createdSolutions.length === 0) {
      return NextResponse.json(
        { error: 'Failed to create solutions in database' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      data: createdSolutions,
      message: `Successfully generated ${createdSolutions.length} solution(s)`,
    })
  } catch (error: any) {
    console.error('[API] Error in generate-solutions:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate solutions' },
      { status: 500 }
    )
  }
}

