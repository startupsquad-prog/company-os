import type { Metadata } from 'next'
import '@/styles/globals.css'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/sonner'
import { RoleProvider } from '@/lib/roles/role-context'
import OnekoCat from '@/components/common/OnekoCat'
import { ViewTransitions } from 'next-view-transitions'
import { PageTransitionProvider } from '@/components/page-transition-provider'

export const metadata: Metadata = {
  title: 'Company OS',
  description: 'Internal platform for managing all departments',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
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
  )
}

