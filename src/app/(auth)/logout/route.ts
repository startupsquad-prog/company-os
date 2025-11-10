import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

export async function POST() {
  // Clerk handles sign-out client-side via UserButton or SignOutButton
  // This route can be deprecated or removed
  return NextResponse.json({ message: 'Use Clerk SignOutButton component' }, { status: 200 })
}
