import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import type { NextRequest, NextMiddleware } from 'next/server'

// Define protected routes
const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/crm(.*)',
  '/ats(.*)',
  '/ops(.*)',
  '/import-ops(.*)',
])

// Define public routes that should redirect if authenticated
const isPublicRoute = createRouteMatcher(['/login(.*)'])

// Create the middleware function with error handling
const middlewareHandler = async (auth: any, req: NextRequest) => {
  try {
    const { userId } = await auth()
    const { pathname } = req.nextUrl

    // Allow public routes (login, sign-up) to be accessible
    // Clerk handles authentication on these routes
    if (isPublicRoute(req)) {
      // Only redirect if already authenticated
      if (userId) {
        return NextResponse.redirect(new URL('/dashboard', req.url))
      }
      // Otherwise, allow the request to proceed
      return NextResponse.next()
    }

    // Protect authenticated routes
    if (isProtectedRoute(req) && !userId) {
      // Redirect to login with return URL
      const signInUrl = new URL('/login', req.url)
      signInUrl.searchParams.set('redirect_url', pathname)
      return NextResponse.redirect(signInUrl)
    }

    // Allow the request to proceed
    return NextResponse.next()
  } catch (error) {
    // If Clerk middleware fails, allow the request to proceed
    // This prevents the middleware from breaking the app
    console.error('Middleware error:', error)
    return NextResponse.next()
  }
}

// Check if Clerk is configured
const isClerkConfigured = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY

// Export middleware - use Clerk if configured, otherwise use a simple pass-through
const middleware: NextMiddleware = isClerkConfigured
  ? clerkMiddleware(middlewareHandler)
  : async (req: NextRequest) => {
      // Simple pass-through middleware when Clerk is not configured
      return NextResponse.next()
    }

export default middleware

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}
