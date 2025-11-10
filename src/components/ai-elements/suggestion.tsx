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
          'flex flex-col gap-2 overflow-y-auto',
          'scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent',
          'scrollbar-thumb-rounded-full',
          // Smooth scrolling
          'scroll-smooth',
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

interface SuggestionProps extends Omit<React.ComponentProps<typeof Button>, 'onClick'> {
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
          'w-full text-left justify-start text-xs',
          'hover:bg-accent hover:text-accent-foreground',
          'transition-colors duration-200',
          'h-auto min-h-[36px] py-2 px-3',
          'whitespace-normal break-words',
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
