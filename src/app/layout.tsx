import type { Metadata } from 'next'
import '@/styles/globals.css'
import { ClerkProvider } from '@clerk/nextjs'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/sonner'
import { RoleProvider } from '@/lib/roles/role-context'
import OnekoCat from '@/components/common/OnekoCat'
import { ViewTransitions } from 'next-view-transitions'
import { PageTransitionProvider } from '@/components/page-transition-provider'

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
  return (
    <ClerkProvider>
      <ViewTransitions>
        <html lang="en" suppressHydrationWarning>
          <body className="font-sans" suppressHydrationWarning>
            <ThemeProvider
              attribute="data-theme"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              <RoleProvider>
                <PageTransitionProvider />
                {children}
                <Toaster />
                <OnekoCat />
              </RoleProvider>
            </ThemeProvider>
          </body>
        </html>
      </ViewTransitions>
    </ClerkProvider>
  )
}
