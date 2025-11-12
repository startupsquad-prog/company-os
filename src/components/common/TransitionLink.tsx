/**
 * TransitionLink - A Link component wrapper for consistent navigation
 *
 * Use this component for navigation links in the application.
 * This is a simple wrapper around Next.js Link for consistency.
 *
 * Note: Page transitions have been removed in favor of clean loading states.
 * Use Suspense boundaries with PageLoader or Skeleton components for loading states.
 */
'use client'

import NextLink from 'next/link'
import type { LinkProps as NextLinkProps } from 'next/link'
import { forwardRef } from 'react'

export interface TransitionLinkProps extends Omit<NextLinkProps, 'href'> {
  href: string
  children: React.ReactNode
  className?: string
}

/**
 * TransitionLink - Simple wrapper around Next.js Link
 *
 * Usage:
 * ```tsx
 * <TransitionLink href="/dashboard">Dashboard</TransitionLink>
 * ```
 *
 * This should be used for:
 * - Main navigation links (sidebar, navbar)
 * - Primary page-to-page navigation
 * - Consistent link styling throughout the app
 *
 * Don't use for:
 * - External links (use regular <a> tags)
 * - Action buttons that trigger modals/forms
 * - Links that don't navigate to different pages
 */
export const TransitionLink = forwardRef<HTMLAnchorElement, TransitionLinkProps>(
  ({ href, children, className, ...props }, ref) => {
    return (
      <NextLink
        ref={ref}
        href={href}
        className={className}
        {...props}
      >
        {children}
      </NextLink>
    )
  }
)

TransitionLink.displayName = 'TransitionLink'
