'use client'

import { X, Bot } from 'lucide-react'
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
        'rounded-full',
        'bg-black hover:bg-black/90', // Black circle background
        'text-white', // White bot icon
        // Smooth transitions without popping effects
        'transition-colors duration-200 ease-out',
        'shadow-lg', // Static shadow
        // Responsive positioning and sizing - slightly larger than before
        'bottom-4 right-4 h-14 w-14',
        'sm:bottom-5 sm:right-5 sm:h-14 sm:w-14',
        'md:bottom-6 md:right-6 md:h-16 md:w-16',
        // Center icon
        'flex items-center justify-center p-0'
      )}
      aria-label={isOpen ? 'Close AI chat' : 'Open AI chat'}
    >
      {isOpen ? (
        <X className="h-6 w-6 sm:h-7 sm:w-7 transition-opacity duration-200" />
      ) : (
        <Bot className="h-7 w-7 sm:h-8 sm:w-8 transition-opacity duration-200" />
      )}
    </Button>
  )
}

