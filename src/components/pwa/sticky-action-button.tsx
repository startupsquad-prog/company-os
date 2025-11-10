'use client'

import { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { useIsMobile } from '@/hooks/use-mobile'
import { Button } from '@/components/ui/button'

interface StickyActionButtonProps {
  onClick: () => void
  icon: ReactNode
  label?: string
  className?: string
  variant?: 'default' | 'primary' | 'secondary'
  position?: 'bottom-right' | 'bottom-left' | 'bottom-center'
  showOnMobile?: boolean
  showOnDesktop?: boolean
}

export function StickyActionButton({
  onClick,
  icon,
  label,
  className,
  variant = 'default',
  position = 'bottom-right',
  showOnMobile = true,
  showOnDesktop = false,
}: StickyActionButtonProps) {
  const isMobile = useIsMobile()

  // Determine visibility
  const shouldShow = isMobile ? showOnMobile : showOnDesktop

  if (!shouldShow) {
    return null
  }

  const positionClasses = {
    'bottom-right': 'bottom-20 right-4',
    'bottom-left': 'bottom-20 left-4',
    'bottom-center': 'bottom-20 left-1/2 -translate-x-1/2',
  }

  const variantClasses = {
    default: 'bg-primary text-primary-foreground hover:bg-primary/90',
    primary: 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
  }

  return (
    <div
      className={cn(
        'fixed z-40',
        positionClasses[position],
        'safe-area-inset-bottom', // Account for home indicator
        className
      )}
      style={{
        marginBottom: 'calc(env(safe-area-inset-bottom, 0) + 1rem)',
      }}
    >
      <Button
        onClick={onClick}
        size="lg"
        className={cn(
          'h-14 w-14 rounded-full',
          'shadow-lg',
          'transition-all duration-200',
          'active:scale-95',
          variantClasses[variant],
          label && 'h-auto w-auto px-4 py-3 gap-2'
        )}
      >
        <span className="flex items-center gap-2">
          {icon}
          {label && (
            <span className="font-medium text-sm whitespace-nowrap">{label}</span>
          )}
        </span>
      </Button>
    </div>
  )
}

