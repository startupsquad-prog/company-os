'use client'

import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useEffect, useRef, useState } from 'react'
import Lottie from 'lottie-react'
import { DotLottieReact } from '@lottiefiles/dotlottie-react'

interface AiChatButtonProps {
  isOpen: boolean
  onClick: () => void
}

export function AiChatButton({ isOpen, onClick }: AiChatButtonProps) {
  const animationRef = useRef<any>(null)
  const dotLottieRef = useRef<any>(null)
  const [fileType, setFileType] = useState<'json' | 'lottie' | null>(null)

  useEffect(() => {
    // Check if file is JSON or .lottie format
    const checkFileType = async () => {
      try {
        const response = await fetch('/lottie/AI logo Foriday.lottie')
        if (response.ok) {
          const text = await response.text()
          try {
            // Try parsing as JSON
            JSON.parse(text)
            setFileType('json')
          } catch {
            // If not JSON, it's a binary .lottie file
            setFileType('lottie')
          }
        }
      } catch (error) {
        console.error('Error checking file type:', error)
        // Default to .lottie format
        setFileType('lottie')
      }
    }

    checkFileType()
  }, [])

  useEffect(() => {
    if (fileType === 'lottie' && dotLottieRef.current) {
      // DotLottie API
      if (isOpen) {
        dotLottieRef.current.pause()
      } else {
        dotLottieRef.current.play()
      }
    } else if (fileType === 'json' && animationRef.current) {
      // lottie-react API
      if (isOpen) {
        animationRef.current.pause()
      } else {
        animationRef.current.play()
      }
    }
  }, [isOpen, fileType])

  return (
    <>
      {/* Chat Bubble - Only show when chat is closed */}
      {!isOpen && (
        <div
          className={cn(
            'fixed z-[59]', // Just below the button
            'bottom-4 right-20', // Positioned to the left of the button
            'sm:bottom-5 sm:right-24',
            'md:bottom-6 md:right-28',
            'flex items-center',
            'animate-fade-in'
          )}
        >
          {/* Chat bubble container */}
          <div className="relative">
            {/* Speech bubble */}
            <div
              className={cn(
                'relative',
                'bg-card/95 backdrop-blur-sm',
                'border border-border',
                'rounded-2xl',
                'px-4 py-2.5',
                'shadow-lg',
                'mr-2' // Space for the tail
              )}

            >
              {/* Animated gradient text */}
              <span
                className="text-sm font-medium bg-clip-text text-transparent animate-gradient-shift"
                style={{
                  backgroundImage: 'linear-gradient(90deg, #ec4899, #8b5cf6, #3b82f6, #1e40af)',
                  backgroundSize: '200% 100%',
                  textShadow: 'none',
                  filter: 'none',
                }}
              >
                Ask Ai...
              </span>
            </div>
            {/* Tail pointing to the button */}
            <div
              className={cn(
                'absolute right-0 top-1/2 -translate-y-1/2 translate-x-full',
                'w-0 h-0',
                'border-t-[8px] border-t-transparent',
                'border-b-[8px] border-b-transparent',
                'border-l-[10px] border-l-card',
                'drop-shadow-sm'
              )}
              style={{
                filter: 'drop-shadow(1px 1px 2px rgba(0, 0, 0, 0.1))',
              }}
            />
            {/* Tail border (to match the bubble border) */}
            <div
              className={cn(
                'absolute right-0 top-1/2 -translate-y-1/2 translate-x-full',
                'w-0 h-0',
                'border-t-[9px] border-t-transparent',
                'border-b-[9px] border-b-transparent',
                'border-l-[11px] border-l-border',
                '-z-10'
              )}
            />
          </div>
        </div>
      )}

      {/* Chat Button */}
      <Button
        onClick={onClick}
        size="icon"
        className={cn(
          'fixed z-[60]', // Higher than topbar (z-50) to ensure visibility
          'rounded-full',
          'bg-transparent hover:bg-transparent', // Remove blue background
          'text-primary-foreground',
          // Smooth transitions - use specific properties for better performance
          'transition-transform duration-200 ease-out',
          'will-change-transform',
          'hover:scale-110 active:scale-95',
          // Responsive positioning and sizing
          'bottom-4 right-4 h-12 w-12',
          'sm:bottom-5 sm:right-5 sm:h-12 sm:w-12',
          'md:bottom-6 md:right-6 md:h-14 md:w-14',
          isOpen && 'rotate-90',
          // Center Lottie animation and ensure it fills completely
          'flex items-center justify-center overflow-hidden p-0'
        )}
        aria-label={isOpen ? 'Close AI chat' : 'Open AI chat'}
      >
        {isOpen ? (
          <X className="h-5 w-5 sm:h-6 sm:w-6" />
        ) : fileType === 'lottie' ? (
          <div className="relative h-full w-full overflow-hidden flex items-center justify-center">
            <DotLottieReact
              lottieRef={dotLottieRef}
              src="/lottie/AI logo Foriday.lottie"
              loop
              autoplay
              className="h-full w-full"
              style={{ 
                width: '180%', 
                height: '180%',
                minWidth: '180%',
                minHeight: '180%',
                transform: 'translate(-22.5%, -22.5%)',
                filter: 'brightness(0.6) contrast(1.3)',
              }}
            />
          </div>
        ) : fileType === 'json' ? (
          <div className="relative h-full w-full overflow-hidden flex items-center justify-center">
            <Lottie
              lottieRef={animationRef}
              src="/lottie/AI logo Foriday.lottie"
              loop={true}
              autoplay={true}
              className="h-full w-full"
              style={{ 
                width: '180%', 
                height: '180%',
                minWidth: '180%',
                minHeight: '180%',
                transform: 'translate(-22.5%, -22.5%)',
                filter: 'brightness(0.6) contrast(1.3)',
              }}
            />
          </div>
        ) : (
          <div className="h-5 w-5 sm:h-6 sm:w-6" />
        )}
      </Button>
    </>
  )
}

