'use client'

import { useEffect, useRef, useState } from 'react'
import { X, Send, Loader2, Trash2, Copy, Check } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { Suggestions, Suggestion } from '@/components/ai-elements/suggestion'
import type { useAiChat } from '@/lib/hooks/useAiChat'

interface AiChatPanelProps {
  isOpen: boolean
  onClose: () => void
  messages: ReturnType<typeof useAiChat>['messages']
  input: ReturnType<typeof useAiChat>['input']
  handleInputChange: ReturnType<typeof useAiChat>['handleInputChange']
  handleSubmit: ReturnType<typeof useAiChat>['handleSubmit']
  isLoading: ReturnType<typeof useAiChat>['isLoading']
  resetChat: ReturnType<typeof useAiChat>['resetChat']
  append: ReturnType<typeof useAiChat>['append']
  error?: ReturnType<typeof useAiChat>['error']
}

// Sales and Ops team relevant suggestions (limited to 3)
const SUGGESTIONS = [
  'How do I create a new lead in the CRM?',
  'Show me pending orders that need attention',
  'How do I track shipment status?',
]

export function AiChatPanel({
  isOpen,
  onClose,
  messages,
  input,
  handleInputChange,
  handleSubmit,
  isLoading,
  resetChat,
  append,
  error: chatError,
}: AiChatPanelProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null)

  // Debug: Log messages when they change
  useEffect(() => {
    console.log('📨 [UI] Messages updated:', {
      count: messages.length,
      messages: messages.map((m) => {
        // Extract content from parts array (new AI SDK format)
        let content = ''
        if ((m as any).parts && Array.isArray((m as any).parts)) {
          content = (m as any).parts
            .map((p: any) => {
              if (p.type === 'text' && p.text) return p.text
              if (typeof p === 'string') return p
              if (p.text) return p.text
              if (p.content) return p.content
              return ''
            })
            .filter(Boolean)
            .join('')
        } else if (typeof (m as any).content === 'string') {
          content = (m as any).content
        } else {
          content = String((m as any).content || '')
        }

        return {
          id: m.id,
          role: m.role,
          content: content.substring(0, 50) + (content.length > 50 ? '...' : ''),
          contentLength: content.length,
          hasParts: !!(m as any).parts,
          partsCount: (m as any).parts?.length || 0,
          hasContent: !!(m as any).content,
        }
      }),
    })
  }, [messages])

  // Smooth auto-scroll to bottom - only when needed, with throttling
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastMessageCountRef = useRef(messages.length)
  const isUserScrollingRef = useRef(false)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    // Track user scrolling
    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100
      isUserScrollingRef.current = !isNearBottom
    }

    container.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      container.removeEventListener('scroll', handleScroll)
    }
  }, [])

  useEffect(() => {
    // Only auto-scroll if:
    // 1. New message was added (count increased)
    // 2. User is near bottom (not manually scrolling)
    // 3. Currently streaming (for smooth updates)
    const messageCountIncreased = messages.length > lastMessageCountRef.current
    const isStreaming = isLoading

    if (messageCountIncreased || (isStreaming && !isUserScrollingRef.current)) {
      // Clear any pending scroll
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }

      // Throttle scroll updates during streaming (every 100ms)
      scrollTimeoutRef.current = setTimeout(
        () => {
          if (messagesEndRef.current && !isUserScrollingRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' })
          }
        },
        isStreaming ? 100 : 0
      )
    }

    lastMessageCountRef.current = messages.length

    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }
    }
  }, [messages, isLoading])

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen])

  const handleReset = () => {
    if (confirm('Are you sure you want to clear the chat history?')) {
      resetChat()
    }
  }

  // Handle form submission
  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    e.stopPropagation()
    if (!isLoading && input?.trim()) {
      handleSubmit(e)
    }
  }

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: string) => {
    if (isLoading) return

    try {
      append({
        role: 'user',
        content: suggestion,
      })
    } catch (error) {
      console.error('Error appending suggestion:', error)
    }
  }

  // Handle copy message
  const handleCopyMessage = async (content: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(content)
      setCopiedMessageId(messageId)
      setTimeout(() => setCopiedMessageId(null), 2000)
    } catch (error) {
      console.error('Failed to copy message:', error)
    }
  }

  if (!isOpen) return null

  return (
    <Card
      className={cn(
        'fixed z-40 flex flex-col',
        // Responsive positioning - avoid topbar (h-16 = 64px) and button (h-14 + bottom-6 = ~80px)
        'bottom-20 right-4',
        'top-auto',
        // Reduced height - more compact sizing
        'w-[380px] h-[400px]',
        'max-w-[calc(100vw-2rem)]',
        'max-h-[calc(100vh-5rem)]', // Leave space for topbar and padding
        // Mobile adjustments
        'sm:bottom-20 sm:right-4 sm:w-[calc(100vw-2rem)] sm:h-[420px]',
        // Tablet adjustments
        'md:w-[400px] md:h-[440px]',
        // Desktop adjustments
        'lg:w-[420px] lg:h-[460px]',
        // Styling
        'bg-card border-border text-foreground shadow-xl rounded-xl',
        // Smooth transitions - use specific properties for better performance
        'transition-[opacity,transform] duration-300 ease-out',
        'will-change-[opacity,transform]',
        // Always allow pointer events when open
        'pointer-events-auto',
        // Ensure modal doesn't overflow viewport
        'overflow-hidden',
        // Ensure it doesn't go beyond viewport boundaries
        'left-auto',
        // Prevent any content from leaking outside
        'isolate'
      )}
      style={{
        // Ensure modal stays within viewport
        maxWidth: 'calc(100vw - 2rem)',
        maxHeight: 'calc(100vh - 5rem)',
      }}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 pt-3 px-4 border-b shrink-0">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-semibold sm:text-lg">Ask Suprans AI</h3>
        </div>
        <div className="flex items-center gap-1">
          {messages.length > 0 && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 sm:h-8 sm:w-8"
              onClick={handleReset}
              title="Clear chat history"
            >
              <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 sm:h-8 sm:w-8"
            onClick={onClose}
            aria-label="Close chat"
          >
            <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0 overflow-hidden min-h-0 h-full">
        {/* Messages area */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4 min-h-0 scroll-smooth overscroll-contain"
        >
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[200px] text-center px-4">
              <div className="space-y-4 w-full max-w-sm">
                <div className="space-y-2">
                  <p className="text-xs sm:text-sm text-muted-foreground font-medium">
                    Start a conversation with Suprans AI
                  </p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground/80">
                    Click a suggestion below or type your message
                  </p>
                </div>
                {/* Vertical suggestions when chat is empty */}
                <div className="flex flex-col gap-2.5 w-full">
                  {SUGGESTIONS.map((suggestion) => (
                    <Suggestion
                      key={suggestion}
                      suggestion={suggestion}
                      onClick={handleSuggestionClick}
                      disabled={isLoading}
                      className="w-full justify-start text-left"
                    />
                  ))}
                </div>
              </div>
            </div>
          ) : (
            messages.map((message) => {
              // Verify message format
              if (!message.id || !message.role) {
                console.warn('Invalid message format:', message)
                return null
              }

              // Handle different content formats - new AI SDK uses parts array
              // UIMessage has: { id, role, parts: Array<UIMessagePart> }
              // UIMessagePart can be TextUIPart { type: 'text', text: string }
              let content = ''

              // Check for parts array (new AI SDK format)
              if ((message as any).parts && Array.isArray((message as any).parts)) {
                content = (message as any).parts
                  .map((part: any) => {
                    // TextUIPart has { type: 'text', text: string }
                    if (part.type === 'text' && part.text) return part.text
                    // Some parts might be strings directly
                    if (typeof part === 'string') return part
                    // Fallback to text or content properties
                    if (part.text) return part.text
                    if (part.content) return part.content
                    return ''
                  })
                  .filter(Boolean) // Remove empty strings
                  .join('')
              }
              // Legacy format: message has content string
              else if (typeof (message as any).content === 'string') {
                content = (message as any).content
              }
              // Array format
              else if (Array.isArray((message as any).content)) {
                content = (message as any).content
                  .map((part: any) =>
                    typeof part === 'string' ? part : part.text || part.content || ''
                  )
                  .filter(Boolean)
                  .join('')
              }
              // Fallback
              else {
                content = String((message as any).content || '')
              }

              // Log if content is empty to debug
              if (!content) {
                console.warn('⚠️ [UI] Message has no content:', {
                  id: message.id,
                  role: message.role,
                  hasParts: !!(message as any).parts,
                  partsLength: (message as any).parts?.length || 0,
                  hasContent: !!(message as any).content,
                  messageKeys: Object.keys(message),
                })
              }

              return (
                <div
                  key={message.id}
                  className={cn(
                    'flex flex-col gap-0.5 sm:gap-1 group',
                    message.role === 'user' ? 'items-end' : 'items-start'
                  )}
                >
                  <div
                    className={cn(
                      'rounded-lg px-3 py-1.5 sm:px-4 sm:py-2 max-w-[85%] sm:max-w-[80%] relative',
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                    )}
                  >
                    <p className="text-xs sm:text-sm whitespace-pre-wrap break-words pr-6">
                      {content}
                    </p>
                    {message.role === 'assistant' && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                          'absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity',
                          message.role === 'assistant'
                            ? 'text-muted-foreground hover:text-foreground'
                            : ''
                        )}
                        onClick={() => handleCopyMessage(content, message.id)}
                        title="Copy message"
                      >
                        {copiedMessageId === message.id ? (
                          <Check className="h-3 w-3" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </Button>
                    )}
                  </div>
                  <span className="text-[10px] sm:text-xs text-muted-foreground px-1">
                    {message.role === 'user' ? 'You' : 'AI'}
                  </span>
                </div>
              )
            })
          )}
          {isLoading && (
            <div className="flex items-start gap-2">
              <div className="bg-muted text-muted-foreground rounded-lg px-3 py-2 sm:px-4">
                <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
              </div>
            </div>
          )}
          {/* Error display */}
          {chatError && (
            <div className="flex items-start gap-2">
              <div className="bg-destructive/10 text-destructive rounded-lg px-3 py-2 sm:px-4 max-w-[85%]">
                <p className="text-xs sm:text-sm">
                  Error: {chatError.message || 'An error occurred while processing your message'}
                </p>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Horizontal suggestions above input when there are messages */}
        {messages.length > 0 && (
          <div className="px-3 pt-2 sm:px-4 sm:pt-3 shrink-0 border-t">
            <Suggestions className="pb-2">
              {SUGGESTIONS.map((suggestion) => (
                <Suggestion
                  key={suggestion}
                  suggestion={suggestion}
                  onClick={handleSuggestionClick}
                  disabled={isLoading}
                />
              ))}
            </Suggestions>
          </div>
        )}

        {/* Input area - fixed at bottom */}
        <form
          onSubmit={handleFormSubmit}
          className="border-t p-2.5 sm:p-3 flex items-center gap-2 shrink-0 mt-auto"
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <Input
            ref={inputRef}
            type="text"
            value={input ?? ''}
            onChange={handleInputChange}
            placeholder="Type your message..."
            disabled={isLoading}
            className="flex-1 text-sm sm:text-base h-9 sm:h-10"
            autoComplete="off"
            onKeyDown={(e) => {
              e.stopPropagation()
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                if (!isLoading && input?.trim()) {
                  handleFormSubmit(e as any)
                }
              }
            }}
            onClick={(e) => {
              e.stopPropagation()
            }}
            onMouseDown={(e) => {
              e.stopPropagation()
            }}
            onFocus={(e) => {
              e.stopPropagation()
            }}
          />
          <Button
            type="submit"
            size="icon"
            disabled={isLoading || !input?.trim()}
            className="shrink-0 h-9 w-9 sm:h-10 sm:w-10"
          >
            {isLoading ? (
              <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
            ) : (
              <Send className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
