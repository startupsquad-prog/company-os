'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface SuggestionsProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

const Suggestions = React.forwardRef<HTMLDivElement, SuggestionsProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'flex gap-2 overflow-x-auto pb-2',
          'scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent',
          'scrollbar-thumb-rounded-full',
          // Hide scrollbar on mobile, show on desktop
          '[&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:thin]',
          'sm:[&::-webkit-scrollbar]:block',
          // Smooth scrolling
          'scroll-smooth',
          // Prevent vertical wrap, allow horizontal scroll
          'flex-nowrap',
          className
        )}
        style={{
          WebkitOverflowScrolling: 'touch',
        }}
        {...props}
      >
        {children}
      </div>
    )
  }
)
Suggestions.displayName = 'Suggestions'

interface SuggestionProps
  extends Omit<React.ComponentProps<typeof Button>, 'onClick'> {
  suggestion: string
  onClick: (suggestion: string) => void
}

const Suggestion = React.forwardRef<HTMLButtonElement, SuggestionProps>(
  ({ suggestion, onClick, className, variant = 'outline', size = 'sm', ...props }, ref) => {
    return (
      <Button
        ref={ref}
        variant={variant}
        size={size}
        className={cn(
          'whitespace-nowrap text-xs sm:text-sm',
          'hover:bg-accent hover:text-accent-foreground',
          'transition-colors duration-200',
          'flex-shrink-0',
          // Ensure touch targets are at least 44x44px on mobile
          'min-h-[36px] sm:min-h-[32px]',
          'px-3 py-1.5 sm:px-3 sm:py-1.5',
          className
        )}
        onClick={() => onClick(suggestion)}
        {...props}
      >
        {suggestion}
      </Button>
    )
  }
)
Suggestion.displayName = 'Suggestion'

export { Suggestions, Suggestion }

