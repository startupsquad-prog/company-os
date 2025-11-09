import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  return NextResponse.json({ 
    message: 'Test route works!',
    path: '/api/ai/chat/test',
    timestamp: new Date().toISOString()
  })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  return NextResponse.json({ 
    message: 'Test POST route works!',
    path: '/api/ai/chat/test',
    received: body,
    timestamp: new Date().toISOString()
  })
}

