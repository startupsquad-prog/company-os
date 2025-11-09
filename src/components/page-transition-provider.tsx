'use client'

import { useEffect } from 'react'
import { createPageTransitionAnimation, applyPageTransitionStyles } from '@/lib/page-transition'

/**
 * PageTransitionProvider - Initializes page transition styles
 * This component ensures page transitions are set up on the client side
 */
export function PageTransitionProvider() {
  useEffect(() => {
    // Apply default transition styles on mount
    const defaultAnimationCSS = createPageTransitionAnimation(undefined, undefined, true)
    applyPageTransitionStyles(defaultAnimationCSS)
  }, [])

  return null
}


