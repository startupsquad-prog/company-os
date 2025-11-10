/**
 * TransitionLink - A Link component that uses view-transitions for smooth page transitions
 *
 * Use this component for navigation links where you want smooth page transitions.
 * For regular links that don't need transitions, use Next.js Link directly.
 *
 * This component wraps next-view-transitions Link and maintains the same API as Next.js Link.
 */
'use client'

import { Link as NextLink } from 'next/link'
import { Link as NextViewTransitionsLink } from 'next-view-transitions'
import type { LinkProps as NextLinkProps } from 'next/link'
import { forwardRef } from 'react'
import {
  setClickPosition,
  createPageTransitionAnimation,
  applyPageTransitionStyles,
} from '@/lib/page-transition'

export interface TransitionLinkProps extends Omit<NextLinkProps, 'href'> {
  href: string
  children: React.ReactNode
  className?: string
}

/**
 * TransitionLink - Provides smooth page transitions using the View Transition API
 *
 * Usage:
 * ```tsx
 * <TransitionLink href="/dashboard">Dashboard</TransitionLink>
 * ```
 *
 * This should be used for:
 * - Main navigation links (sidebar, navbar)
 * - Primary page-to-page navigation
 * - Links where smooth transitions enhance UX
 *
 * Don't use for:
 * - External links
 * - Action buttons that trigger modals/forms
 * - Links that don't navigate to different pages
 */
export const TransitionLink = forwardRef<HTMLAnchorElement, TransitionLinkProps>(
  ({ href, children, className, ...props }, ref) => {
    const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
      // Capture click coordinates
      const clickX = event.clientX
      const clickY = event.clientY

      // Store click position for the transition
      setClickPosition(clickX, clickY)

      // Create and apply transition animation styles
      const animationCSS = createPageTransitionAnimation(clickX, clickY, true)
      applyPageTransitionStyles(animationCSS)
    }

    return (
      <NextViewTransitionsLink
        ref={ref}
        href={href}
        className={className}
        onClick={handleClick}
        {...props}
      >
        {children}
      </NextViewTransitionsLink>
    )
  }
)

TransitionLink.displayName = 'TransitionLink'
