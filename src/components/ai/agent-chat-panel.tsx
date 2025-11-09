'use client'

import { useEffect, useRef, useState } from 'react'
import { X, Send, Loader2, Trash2, Copy, Check } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import type { useAgentChat } from '@/lib/hooks/useAgentChat'

interface AgentChatPanelProps {
  isOpen: boolean
  onClose: () => void
  agentId: string
  iconRef: React.RefObject<HTMLButtonElement | null>
  messages: ReturnType<typeof useAgentChat>['messages']
  input: ReturnType<typeof useAgentChat>['input']
  handleInputChange: ReturnType<typeof useAgentChat>['handleInputChange']
  handleSubmit: ReturnType<typeof useAgentChat>['handleSubmit']
  isLoading: ReturnType<typeof useAgentChat>['isLoading']
  resetChat: ReturnType<typeof useAgentChat>['resetChat']
  append: ReturnType<typeof useAgentChat>['append']
  agent: ReturnType<typeof useAgentChat>['agent']
  error?: ReturnType<typeof useAgentChat>['error']
}

export function AgentChatPanel({
  isOpen,
  onClose,
  agentId,
  iconRef,
  messages,
  input,
  handleInputChange,
  handleSubmit,
  isLoading,
  resetChat,
  append,
  agent,
  error: chatError,
}: AgentChatPanelProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null)
  const [position, setPosition] = useState<{ bottom: number; left: number; right?: number } | null>(null)

  // Calculate position above agent icon
  useEffect(() => {
    if (!isOpen || !iconRef.current) {
      setPosition(null)
      return
    }

    const updatePosition = () => {
      const icon = iconRef.current
      if (!icon) return

      const rect = icon.getBoundingClientRect()
      const viewportWidth = window.innerWidth
      const panelWidth = 380 // Base width
      const panelHeight = 400 // Base height
      const gap = 8 // Gap between icon and panel

      // Calculate horizontal position (center above icon)
      let left = rect.left + rect.width / 2 - panelWidth / 2
      let right: number | undefined = undefined

      // Ensure panel doesn't go off screen
      if (left < 16) {
        left = 16
      } else if (left + panelWidth > viewportWidth - 16) {
        right = 16
        left = undefined as any
      }

      // Calculate vertical position (above icon)
      const bottom = window.innerHeight - rect.top + gap

      setPosition({ bottom, left, right })
    }

    updatePosition()
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)

    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [isOpen, iconRef])

  // Smooth auto-scroll to bottom - only when needed, with throttling
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastMessageCountRef = useRef(messages.length)
  const isUserScrollingRef = useRef(false)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

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
    const messageCountIncreased = messages.length > lastMessageCountRef.current
    const isStreaming = isLoading

    if (messageCountIncreased || (isStreaming && !isUserScrollingRef.current)) {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }

      scrollTimeoutRef.current = setTimeout(() => {
        if (messagesEndRef.current && !isUserScrollingRef.current) {
          messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' })
        }
      }, isStreaming ? 100 : 0)
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

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    e.stopPropagation()
    if (!isLoading && input?.trim()) {
      handleSubmit(e)
    }
  }

  const handleCopyMessage = async (content: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(content)
      setCopiedMessageId(messageId)
      setTimeout(() => setCopiedMessageId(null), 2000)
    } catch (error) {
      console.error('Failed to copy message:', error)
    }
  }

  // Map agent names to 3D icons from the local pack
  const getAgentIcon = (agentName: string): string => {
    const iconMap: Record<string, string> = {
      'Sales Assistant': '/ai-3d-icons-pack/28_massage ai.png',
      'Ops Helper': '/ai-3d-icons-pack/15_gear.png',
      'Task Master': '/ai-3d-icons-pack/4_book.png',
      'Code Buddy': '/ai-3d-icons-pack/9_code_1.png',
      'Data Analyst': '/ai-3d-icons-pack/11_dna.png',
      'Quick Answers': '/ai-3d-icons-pack/1_aichat.png',
    }
    
    return iconMap[agentName] || '/ai-3d-icons-pack/32_ ai robot.png'
  }

  if (!isOpen || !position) return null

  const agentName = agent?.name || 'Agent'
  const agentDescription = agent?.description || ''

  return (
    <Card
      className={cn(
        'fixed z-40 flex flex-col',
        'w-[380px] h-[400px]',
        'max-w-[calc(100vw-2rem)]',
        'max-h-[calc(100vh-5rem)]',
        'bg-card border-border text-foreground shadow-xl rounded-xl',
        'transition-[opacity,transform] duration-300 ease-out',
        'will-change-[opacity,transform]',
        'pointer-events-auto',
        'overflow-hidden',
        'isolate'
      )}
      style={{
        bottom: `${position.bottom}px`,
        ...(position.left !== undefined ? { left: `${position.left}px` } : {}),
        ...(position.right !== undefined ? { right: `${position.right}px`, left: 'auto' } : {}),
        maxWidth: 'calc(100vw - 2rem)',
        maxHeight: 'calc(100vh - 5rem)',
      }}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 pt-3 px-4 border-b shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <div className="h-8 w-8 shrink-0 rounded-lg overflow-hidden bg-transparent">
            <img
              src={getAgentIcon(agentName)}
              alt={agentName}
              className="h-full w-full object-cover rounded-lg"
              onError={(e) => {
                const target = e.target as HTMLImageElement
                target.src = '/ai-3d-icons-pack/32_ ai robot.png'
              }}
            />
          </div>
          <div className="min-w-0">
            <h3 className="text-base font-semibold truncate">{agentName}</h3>
            {agentDescription && (
              <p className="text-xs text-muted-foreground truncate">{agentDescription}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
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
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4 min-h-0 scroll-smooth overscroll-contain"
        >
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[200px] text-center px-4">
              <div className="space-y-2">
                <p className="text-xs sm:text-sm text-muted-foreground font-medium">
                  Start a conversation with {agentName}
                </p>
                <p className="text-[10px] sm:text-xs text-muted-foreground/80">
                  Type your message below
                </p>
              </div>
            </div>
          ) : (
            messages.map((message) => {
              if (!message.id || !message.role) {
                return null
              }

              let content = ''
              if ((message as any).parts && Array.isArray((message as any).parts)) {
                content = (message as any).parts
                  .map((part: any) => {
                    if (part.type === 'text' && part.text) return part.text
                    if (typeof part === 'string') return part
                    if (part.text) return part.text
                    if (part.content) return part.content
                    return ''
                  })
                  .filter(Boolean)
                  .join('')
              } else if (typeof (message as any).content === 'string') {
                content = (message as any).content
              } else if (Array.isArray((message as any).content)) {
                content = (message as any).content
                  .map((part: any) => typeof part === 'string' ? part : part.text || part.content || '')
                  .filter(Boolean)
                  .join('')
              } else {
                content = String((message as any).content || '')
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
                    <p className="text-xs sm:text-sm whitespace-pre-wrap break-words pr-6">{content}</p>
                    {message.role === 'assistant' && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                          'absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity',
                          'text-muted-foreground hover:text-foreground'
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
                    {message.role === 'user' ? 'You' : agentName}
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
            placeholder={`Message ${agentName}...`}
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
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onFocus={(e) => e.stopPropagation()}
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

