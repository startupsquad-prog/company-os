/**
 * Page Transition Utilities
 * Handles view transitions with click position-based animations
 */

const PAGE_TRANSITION_STYLE_ID = 'page-transition-styles'

// Store click position globally for view transition
let lastClickPosition: { x: number; y: number } | null = null

export function setClickPosition(x: number, y: number) {
  lastClickPosition = { x, y }
}

export function getClickPosition() {
  return lastClickPosition
}

export function clearClickPosition() {
  lastClickPosition = null
}

export function createPageTransitionAnimation(
  clickX?: number,
  clickY?: number,
  blur = true,
): string {
  // Calculate click position as percentage if provided
  const getClickPosition = () => {
    if (clickX !== undefined && clickY !== undefined && typeof window !== 'undefined') {
      const xPercent = (clickX / window.innerWidth) * 100
      const yPercent = (clickY / window.innerHeight) * 100
      return `${xPercent}% ${yPercent}%`
    }
    return '50% 50%' // Default to center
  }

  const circlePosition = getClickPosition()
  const positionHash = clickX !== undefined && clickY !== undefined
    ? `-${Math.round(clickX / 10)}-${Math.round(clickY / 10)}`
    : ''
  const animationName = `page-reveal${positionHash}${blur ? '-blur' : ''}`

  return `
    ::view-transition-group(root) {
      animation-duration: 0.6s;
      animation-timing-function: ease-out;
    }
    
    ::view-transition-new(root) {
      animation-name: reveal-new-${animationName};
      ${blur ? 'filter: blur(2px);' : ''}
    }

    ::view-transition-old(root) {
      animation: none;
      z-index: -1;
    }

    @keyframes reveal-new-${animationName} {
      from {
        clip-path: circle(0% at ${circlePosition});
        ${blur ? 'filter: blur(8px);' : ''}
        opacity: 0.3;
      }
      ${blur ? '50% { filter: blur(4px); }' : ''}
      to {
        clip-path: circle(150.0% at ${circlePosition});
        ${blur ? 'filter: blur(0px);' : ''}
        opacity: 1;
      }
    }
  `
}

export function applyPageTransitionStyles(css: string) {
  if (typeof window === 'undefined') return

  let styleElement = document.getElementById(PAGE_TRANSITION_STYLE_ID) as HTMLStyleElement

  if (!styleElement) {
    styleElement = document.createElement('style')
    styleElement.id = PAGE_TRANSITION_STYLE_ID
    document.head.appendChild(styleElement)
  }

  styleElement.textContent = css
}

// Initialize page transition styles on client side
if (typeof window !== 'undefined') {
  // Apply default transition styles on load
  const defaultAnimationCSS = createPageTransitionAnimation(undefined, undefined, true)
  applyPageTransitionStyles(defaultAnimationCSS)
}

