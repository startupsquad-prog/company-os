'use client'

import { cn } from '@/lib/utils'
import { useTheme } from 'next-themes'
import { useCallback, useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'

export type AnimationVariant =
  | 'circle'
  | 'rectangle'
  | 'circle-blur'
  | 'polygon'

export type AnimationStart =
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right'
  | 'center'
  | 'top-center'
  | 'bottom-center'
  | 'bottom-up'
  | 'top-down'
  | 'left-right'
  | 'right-left'

interface Animation {
  name: string
  css: string
}

const getPositionCoords = (position: AnimationStart) => {
  switch (position) {
    case 'top-left':
      return { cx: '0', cy: '0' }
    case 'top-right':
      return { cx: '40', cy: '0' }
    case 'bottom-left':
      return { cx: '0', cy: '40' }
    case 'bottom-right':
      return { cx: '40', cy: '40' }
    case 'top-center':
      return { cx: '20', cy: '0' }
    case 'bottom-center':
      return { cx: '20', cy: '40' }
    case 'bottom-up':
    case 'top-down':
    case 'left-right':
    case 'right-left':
      return { cx: '20', cy: '20' }
  }
}

const generateSVG = (variant: AnimationVariant, start: AnimationStart) => {
  if (variant === 'circle-blur') {
    if (start === 'center') {
      return `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><defs><filter id="blur"><feGaussianBlur stdDeviation="2"/></filter></defs><circle cx="20" cy="20" r="18" fill="white" filter="url(%23blur)"/></svg>`
    }
    const positionCoords = getPositionCoords(start)
    if (!positionCoords) {
      throw new Error(`Invalid start position: ${start}`)
    }
    const { cx, cy } = positionCoords
    return `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><defs><filter id="blur"><feGaussianBlur stdDeviation="2"/></filter></defs><circle cx="${cx}" cy="${cy}" r="18" fill="white" filter="url(%23blur)"/></svg>`
  }

  if (start === 'center') return

  if (variant === 'rectangle') return ''

  const positionCoords = getPositionCoords(start)
  if (!positionCoords) {
    throw new Error(`Invalid start position: ${start}`)
  }
  const { cx, cy } = positionCoords

  if (variant === 'circle') {
    return `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><circle cx="${cx}" cy="${cy}" r="20" fill="white"/></svg>`
  }

  return ''
}

const getTransformOrigin = (start: AnimationStart) => {
  switch (start) {
    case 'top-left':
      return 'top left'
    case 'top-right':
      return 'top right'
    case 'bottom-left':
      return 'bottom left'
    case 'bottom-right':
      return 'bottom right'
    case 'top-center':
      return 'top center'
    case 'bottom-center':
      return 'bottom center'
    case 'bottom-up':
    case 'top-down':
    case 'left-right':
    case 'right-left':
      return 'center'
  }
}

export const createAnimation = (
  variant: AnimationVariant,
  start: AnimationStart = 'center',
  blur = false,
  clickX?: number,
  clickY?: number,
): Animation => {
  const svg = generateSVG(variant, start)
  const transformOrigin = getTransformOrigin(start)
  
  // Calculate click position as percentage if provided
  const getClickPosition = () => {
    if (clickX !== undefined && clickY !== undefined && typeof window !== 'undefined') {
      const xPercent = (clickX / window.innerWidth) * 100
      const yPercent = (clickY / window.innerHeight) * 100
      return `${xPercent}% ${yPercent}%`
    }
    return null
  }
  
  const clickPosition = getClickPosition()

  if (variant === 'rectangle') {
    const getClipPath = (direction: AnimationStart) => {
      switch (direction) {
        case 'bottom-up':
          return {
            from: 'polygon(0% 100%, 100% 100%, 100% 100%, 0% 100%)',
            to: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
          }
        case 'top-down':
          return {
            from: 'polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)',
            to: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
          }
        case 'left-right':
          return {
            from: 'polygon(0% 0%, 0% 0%, 0% 100%, 0% 100%)',
            to: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
          }
        case 'right-left':
          return {
            from: 'polygon(100% 0%, 100% 0%, 100% 100%, 100% 100%)',
            to: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
          }
        case 'top-left':
          return {
            from: 'polygon(0% 0%, 0% 0%, 0% 0%, 0% 0%)',
            to: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
          }
        case 'top-right':
          return {
            from: 'polygon(100% 0%, 100% 0%, 100% 0%, 100% 0%)',
            to: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
          }
        case 'bottom-left':
          return {
            from: 'polygon(0% 100%, 0% 100%, 0% 100%, 0% 100%)',
            to: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
          }
        case 'bottom-right':
          return {
            from: 'polygon(100% 100%, 100% 100%, 100% 100%, 100% 100%)',
            to: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
          }
        default:
          return {
            from: 'polygon(0% 100%, 100% 100%, 100% 100%, 0% 100%)',
            to: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
          }
      }
    }

    const clipPath = getClipPath(start)

    return {
      name: `${variant}-${start}${blur ? '-blur' : ''}`,
      css: `
       ::view-transition-group(root) {
        animation-duration: 0.7s;
        animation-timing-function: ease-out;
      }
            
      ::view-transition-new(root) {
        animation-name: reveal-light-${start}${blur ? '-blur' : ''};
        ${blur ? 'filter: blur(2px);' : ''}
      }

      ::view-transition-old(root),
      [data-theme="dark"]::view-transition-old(root),
      .dark::view-transition-old(root) {
        animation: none;
        z-index: -1;
      }
      [data-theme="dark"]::view-transition-new(root),
      .dark::view-transition-new(root) {
        animation-name: reveal-dark-${start}${blur ? '-blur' : ''};
        ${blur ? 'filter: blur(2px);' : ''}
      }

      @keyframes reveal-dark-${start}${blur ? '-blur' : ''} {
        from {
          clip-path: ${clipPath.from};
          ${blur ? 'filter: blur(8px);' : ''}
        }
        ${blur ? '50% { filter: blur(4px); }' : ''}
        to {
          clip-path: ${clipPath.to};
          ${blur ? 'filter: blur(0px);' : ''}
        }
      }

      @keyframes reveal-light-${start}${blur ? '-blur' : ''} {
        from {
          clip-path: ${clipPath.from};
          ${blur ? 'filter: blur(8px);' : ''}
        }
        ${blur ? '50% { filter: blur(4px); }' : ''}
        to {
          clip-path: ${clipPath.to};
          ${blur ? 'filter: blur(0px);' : ''}
        }
      }
      `,
    }
  }

  if (variant === 'circle' && start === 'center') {
    // Use click position if available, otherwise use center
    const circlePosition = clickPosition || '50% 50%'
    // Create a unique animation name based on click position (rounded to avoid too many variations)
    const positionHash = clickPosition 
      ? `-${Math.round((clickX || 0) / 10)}-${Math.round((clickY || 0) / 10)}`
      : ''
    const animationName = `reveal${positionHash}${blur ? '-blur' : ''}`
    
    return {
      name: `${variant}-${start}${blur ? '-blur' : ''}`,
      css: `
       ::view-transition-group(root) {
        animation-duration: 0.7s;
        animation-timing-function: ease-out;
      }
            
      ::view-transition-new(root) {
        animation-name: reveal-light-${animationName};
        ${blur ? 'filter: blur(2px);' : ''}
      }

      ::view-transition-old(root),
      [data-theme="dark"]::view-transition-old(root),
      .dark::view-transition-old(root) {
        animation: none;
        z-index: -1;
      }
      [data-theme="dark"]::view-transition-new(root),
      .dark::view-transition-new(root) {
        animation-name: reveal-dark-${animationName};
        ${blur ? 'filter: blur(2px);' : ''}
      }

      @keyframes reveal-dark-${animationName} {
        from {
          clip-path: circle(0% at ${circlePosition});
          ${blur ? 'filter: blur(8px);' : ''}
        }
        ${blur ? '50% { filter: blur(4px); }' : ''}
        to {
          clip-path: circle(150.0% at ${circlePosition});
          ${blur ? 'filter: blur(0px);' : ''}
        }
      }

      @keyframes reveal-light-${animationName} {
        from {
           clip-path: circle(0% at ${circlePosition});
           ${blur ? 'filter: blur(8px);' : ''}
        }
        ${blur ? '50% { filter: blur(4px); }' : ''}
        to {
          clip-path: circle(150.0% at ${circlePosition});
          ${blur ? 'filter: blur(0px);' : ''}
        }
      }
      `,
    }
  }

  if (variant === 'circle-blur') {
    if (start === 'center') {
      return {
        name: `${variant}-${start}`,
        css: `
        ::view-transition-group(root) {
          animation-timing-function: ease-out;
        }

        ::view-transition-new(root) {
          mask: url('${svg}') center / 0 no-repeat;
          mask-origin: content-box;
          animation: scale 1s;
          transform-origin: center;
        }

        ::view-transition-old(root),
        [data-theme="dark"]::view-transition-old(root),
        .dark::view-transition-old(root) {
          animation: scale 1s;
          transform-origin: center;
          z-index: -1;
        }

        @keyframes scale {
          to {
            mask-size: 350vmax;
          }
        }
        `,
      }
    }

    return {
      name: `${variant}-${start}`,
      css: `
      ::view-transition-group(root) {
        animation-timing-function: ease-out;
      }

      ::view-transition-new(root) {
        mask: url('${svg}') ${start.replace('-', ' ')} / 0 no-repeat;
        mask-origin: content-box;
        animation: scale 1s;
        transform-origin: ${transformOrigin};
      }

      ::view-transition-old(root),
      [data-theme="dark"]::view-transition-old(root),
      .dark::view-transition-old(root) {
        animation: scale 1s;
        transform-origin: ${transformOrigin};
        z-index: -1;
      }

      @keyframes scale {
        to {
          mask-size: 350vmax;
        }
      }
      `,
    }
  }

  // Handle circle variants with start positions using clip-path
  if (variant === 'circle' && start !== 'center') {
    const getClipPathPosition = (position: AnimationStart) => {
      switch (position) {
        case 'top-left':
          return '0% 0%'
        case 'top-right':
          return '100% 0%'
        case 'bottom-left':
          return '0% 100%'
        case 'bottom-right':
          return '100% 100%'
        case 'top-center':
          return '50% 0%'
        case 'bottom-center':
          return '50% 100%'
        default:
          return '50% 50%'
      }
    }

    const clipPosition = getClipPathPosition(start)

    return {
      name: `${variant}-${start}${blur ? '-blur' : ''}`,
      css: `
       ::view-transition-group(root) {
        animation-duration: 1s;
        animation-timing-function: ease-out;
      }
            
      ::view-transition-new(root) {
        animation-name: reveal-light-${start}${blur ? '-blur' : ''};
        ${blur ? 'filter: blur(2px);' : ''}
      }

      ::view-transition-old(root),
      [data-theme="dark"]::view-transition-old(root),
      .dark::view-transition-old(root) {
        animation: none;
        z-index: -1;
      }
      [data-theme="dark"]::view-transition-new(root),
      .dark::view-transition-new(root) {
        animation-name: reveal-dark-${start}${blur ? '-blur' : ''};
        ${blur ? 'filter: blur(2px);' : ''}
      }

      @keyframes reveal-dark-${start}${blur ? '-blur' : ''} {
        from {
          clip-path: circle(0% at ${clipPosition});
          ${blur ? 'filter: blur(8px);' : ''}
        }
        ${blur ? '50% { filter: blur(4px); }' : ''}
        to {
          clip-path: circle(150.0% at ${clipPosition});
          ${blur ? 'filter: blur(0px);' : ''}
        }
      }

      @keyframes reveal-light-${start}${blur ? '-blur' : ''} {
        from {
           clip-path: circle(0% at ${clipPosition});
           ${blur ? 'filter: blur(8px);' : ''}
        }
        ${blur ? '50% { filter: blur(4px); }' : ''}
        to {
          clip-path: circle(150.0% at ${clipPosition});
          ${blur ? 'filter: blur(0px);' : ''}
        }
      }
      `,
    }
  }

  return {
    name: `${variant}-${start}${blur ? '-blur' : ''}`,
    css: `
      ::view-transition-group(root) {
        animation-timing-function: ease-in;
      }
      ::view-transition-new(root) {
        mask: url('${svg}') ${start.replace('-', ' ')} / 0 no-repeat;
        mask-origin: content-box;
        animation: scale-${start}${blur ? '-blur' : ''} 1s;
        transform-origin: ${transformOrigin};
        ${blur ? 'filter: blur(2px);' : ''}
      }
      ::view-transition-old(root),
      [data-theme="dark"]::view-transition-old(root),
      .dark::view-transition-old(root) {
        animation: scale-${start}${blur ? '-blur' : ''} 1s;
        transform-origin: ${transformOrigin};
        z-index: -1;
      }
      @keyframes scale-${start}${blur ? '-blur' : ''} {
        from {
          ${blur ? 'filter: blur(8px);' : ''}
        }
        ${blur ? '50% { filter: blur(4px); }' : ''}
        to {
          mask-size: 2000vmax;
          ${blur ? 'filter: blur(0px);' : ''}
        }
      }
    `,
  }
}

export const useThemeToggle = ({
  variant = 'circle',
  start = 'center',
  blur = true,
}: {
  variant?: AnimationVariant
  start?: AnimationStart
  blur?: boolean
} = {}) => {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    setIsDark(resolvedTheme === 'dark')
  }, [resolvedTheme])

  const styleId = 'theme-transition-styles'

  const updateStyles = useCallback((css: string) => {
    if (typeof window === 'undefined') return

    let styleElement = document.getElementById(styleId) as HTMLStyleElement

    if (!styleElement) {
      styleElement = document.createElement('style')
      styleElement.id = styleId
      document.head.appendChild(styleElement)
    }

    styleElement.textContent = css
  }, [])

  const toggleTheme = useCallback((clickX?: number, clickY?: number) => {
    setIsDark(!isDark)

    const animation = createAnimation(variant, start, blur, clickX, clickY)
    updateStyles(animation.css)

    if (typeof window === 'undefined') return

    const switchTheme = () => {
      setTheme(theme === 'light' ? 'dark' : 'light')
    }

    if (!document.startViewTransition) {
      switchTheme()
      return
    }

    document.startViewTransition(switchTheme)
  }, [theme, setTheme, variant, start, blur, updateStyles, isDark])

  return {
    isDark,
    setIsDark,
    toggleTheme,
  }
}

export function ThemeToggleButton({
  className = '',
  variant = 'circle',
  start = 'center',
  blur = true,
  size = 'icon',
}: {
  className?: string
  variant?: AnimationVariant
  start?: AnimationStart
  blur?: boolean
  size?: 'default' | 'sm' | 'lg' | 'icon'
}) {
  const { isDark, toggleTheme } = useThemeToggle({
    variant,
    start,
    blur,
  })

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    // Get click coordinates relative to viewport
    const clickX = event.clientX
    const clickY = event.clientY
    toggleTheme(clickX, clickY)
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size={size}
      className={cn(
        'cursor-pointer transition-all duration-300 active:scale-95',
        className,
      )}
      onClick={handleClick}
      aria-label="Toggle theme"
    >
      <span className="sr-only">Toggle theme</span>
      {isDark ? (
        <Sun className="h-4 w-4" />
      ) : (
        <Moon className="h-4 w-4" />
      )}
    </Button>
  )
}

