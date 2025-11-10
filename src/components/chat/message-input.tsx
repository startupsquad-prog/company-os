'use client'

import { useState, KeyboardEvent } from 'react'
import { Smile, Paperclip, Mic, Send } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useIsMobile } from '@/hooks/use-mobile'
import { cn } from '@/lib/utils'

interface MessageInputProps {
  onSend: (message: string) => void
  disabled?: boolean
}

export function MessageInput({ onSend, disabled }: MessageInputProps) {
  const [input, setInput] = useState('')
  const isMobile = useIsMobile()

  const handleSend = () => {
    if (input.trim() && !disabled) {
      onSend(input.trim())
      setInput('')
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div
      className={cn(
        'flex items-center gap-2 px-4 py-3 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 flex-shrink-0',
        isMobile && 'shadow-lg'
      )}
      style={
        isMobile
          ? {
              paddingBottom: `calc(1rem + env(safe-area-inset-bottom, 0))`,
            }
          : undefined
      }
    >
      {/* Left Action Buttons - Hidden on mobile to save space */}
      {!isMobile && (
        <div className="flex items-center gap-1">
          <Button
            size="icon"
            variant="ghost"
            className="h-9 w-9 rounded-full min-w-[44px] min-h-[44px]"
            disabled={disabled}
          >
            <Smile className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-9 w-9 rounded-full min-w-[44px] min-h-[44px]"
            disabled={disabled}
          >
            <Paperclip className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-9 w-9 rounded-full min-w-[44px] min-h-[44px]"
            disabled={disabled}
          >
            <Mic className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Input Field */}
      <Input
        type="text"
        placeholder="Enter message..."
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        className={cn(
          'flex-1',
          isMobile && 'min-h-[44px] text-base' // Larger touch target and text on mobile
        )}
      />

      {/* Send Button */}
      <Button
        size={isMobile ? 'lg' : 'default'}
        onClick={handleSend}
        disabled={disabled || !input.trim()}
        className={cn(
          isMobile ? 'min-w-[44px] min-h-[44px] px-4' : 'px-4'
        )}
      >
        {isMobile ? <Send className="h-5 w-5" /> : 'Send'}
      </Button>
    </div>
  )
}

