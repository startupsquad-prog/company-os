import type { Metadata } from 'next'
import '@/styles/globals.css'
import { ClerkProvider } from '@clerk/nextjs'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/sonner'
import { RoleProvider } from '@/lib/roles/role-context'
import OnekoCat from '@/components/common/OnekoCat'
import { ErrorBoundary } from '@/components/error-boundary'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Company OS',
  description: 'Internal platform for managing all departments',
  manifest: '/manifest.json',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#000000' },
  ],
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Company OS',
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
    viewportFit: 'cover', // For safe area insets
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
  
  const content = (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans" suppressHydrationWarning>
        <ErrorBoundary>
          <ThemeProvider
            attribute="data-theme"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <RoleProvider>
              {children}
              <Toaster />
              <OnekoCat />
            </RoleProvider>
          </ThemeProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
  
  // Always wrap with ClerkProvider to ensure useUser() hooks work
  // This is required because RoleProvider and other components use useUser()
  if (!clerkPublishableKey) {
    console.error(
      'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is not set. Clerk authentication will not work properly.'
    )
    // Still wrap with ClerkProvider but with a placeholder key
    // This prevents useUser() from throwing errors
    // ClerkProvider will handle invalid keys gracefully
    return (
      <ClerkProvider publishableKey="pk_test_placeholder">
        {content}
      </ClerkProvider>
    )
  }
  
  return (
    <ClerkProvider publishableKey={clerkPublishableKey}>
      {content}
    </ClerkProvider>
  )
}
