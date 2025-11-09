'use client'

import { Bot, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface AiChatButtonProps {
  isOpen: boolean
  onClick: () => void
}

export function AiChatButton({ isOpen, onClick }: AiChatButtonProps) {
  return (
    <Button
      onClick={onClick}
      size="icon"
      className={cn(
        'fixed z-[60]', // Higher than topbar (z-50) to ensure visibility
        'rounded-full shadow-lg',
        'bg-primary text-primary-foreground hover:bg-primary/80',
        // Smooth transitions - use specific properties for better performance
        'transition-[transform,background-color] duration-200 ease-out',
        'will-change-transform',
        'hover:scale-110 active:scale-95',
        // Responsive positioning and sizing
        'bottom-4 right-4 h-12 w-12',
        'sm:bottom-5 sm:right-5 sm:h-12 sm:w-12',
        'md:bottom-6 md:right-6 md:h-14 md:w-14',
        isOpen && 'rotate-90'
      )}
      aria-label={isOpen ? 'Close AI chat' : 'Open AI chat'}
    >
      {isOpen ? (
        <X className="h-5 w-5 sm:h-6 sm:w-6" />
      ) : (
        <Bot className="h-5 w-5 sm:h-6 sm:w-6" />
      )}
    </Button>
  )
}
