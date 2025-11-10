'use client'

import { useEffect, useRef, useState } from 'react'
import { X, Send, Loader2, Trash2, Copy, Check } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import type { useAgentChat } from '@/lib/hooks/useAgentChat'
import { Suggestions, Suggestion } from '@/components/ai-elements/suggestion'

interface AgentDialogProps {
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

// Agent-specific suggestions mapping - only 3 relevant questions per agent
const getAgentSuggestions = (agentName: string): string[] => {
  const suggestionsMap: Record<string, string[]> = {
    'Sales Assistant': [
      'How do I create a new lead in the CRM?',
      'Show me my current sales pipeline',
      'What are my top converting leads?',
    ],
    'Ops Helper': [
      'Show me pending orders that need attention',
      'Track the status of a shipment',
      'Help me create a new quotation',
    ],
    'Task Master': [
      'Show me all my overdue tasks',
      'What tasks are due today?',
      'Help me create a new task',
    ],
    'Code Buddy': [
      'Help me debug this TypeScript error',
      'Explain how this React hook works',
      'Review this database query',
    ],
    'Data Analyst': [
      'Generate a sales performance report',
      'Show me sales trends from last quarter',
      'Analyze conversion rates by lead source',
    ],
    'Email Generator': [
      'Generate a professional email template',
      'Create a follow-up email for a client',
      'Write a sales email with product details',
    ],
    'Quick Answers': [
      'How do I navigate to the CRM module?',
      'What are the keyboard shortcuts?',
      'Show me how to filter records',
    ],
  }

  const suggestions = suggestionsMap[agentName] || suggestionsMap['Quick Answers']
  // Return only first 3 suggestions
  return suggestions.slice(0, 3)
}

export function AgentDialog({
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
}: AgentDialogProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null)

  // Get agent-specific suggestions
  const agentName = agent?.name || 'Agent'
  const suggestions = getAgentSuggestions(agentName)

  // Auto-scroll to bottom
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' })
    }
  }, [messages])

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

  const handleSuggestionClick = (suggestion: string) => {
    append({ role: 'user', content: suggestion })
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

  // Map agent names to icons
  const getAgentIcon = (agentName: string): string => {
    const iconMap: Record<string, string> = {
      'Email Generator':
        '/ai-agents-icons/1aa2a1f4-b620-414e-8ad3-c0eba625abb3-removebg-preview.png',
      'WhatsApp Reply Generator':
        '/ai-agents-icons/3ebccd01-dfed-424f-900a-ed063978b8ac-removebg-preview.png',
      'Payment Link Generator':
        '/ai-agents-icons/91cb7dcc-9a18-48f7-9047-0836570df63c-removebg-preview.png',
      'Sales Assistant': '/ai-3d-icons-pack/28_massage ai.png',
      'Ops Helper': '/ai-3d-icons-pack/15_gear.png',
      'Task Master': '/ai-3d-icons-pack/4_book.png',
      'Code Buddy': '/ai-3d-icons-pack/9_code_1.png',
      'Data Analyst': '/ai-3d-icons-pack/11_dna.png',
      'Quick Answers': '/ai-3d-icons-pack/1_aichat.png',
    }

    return iconMap[agentName] || '/ai-3d-icons-pack/32_ ai robot.png'
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md max-h-[85vh] p-0 flex flex-col overflow-hidden">
        <DialogTitle className="sr-only">{agentName} Chat</DialogTitle>
        <div className="flex flex-col h-full overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 pt-2 px-2 border-b shrink-0">
        <div className="flex items-center gap-1.5 min-w-0">
          <div className="h-6 w-6 shrink-0 rounded-lg overflow-hidden bg-transparent">
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
            <h3 className="text-xs font-semibold truncate">{agentName}</h3>
            {agent?.description && (
              <p className="text-[9px] text-muted-foreground truncate line-clamp-1">
                {agent.description}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-0.5 shrink-0">
          {messages.length > 0 && (
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5"
              onClick={handleReset}
              title="Clear chat history"
            >
              <Trash2 className="h-2.5 w-2.5" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0 overflow-hidden min-h-0 h-full">
        {messages.length === 0 ? (
          // Centered layout when no messages
          <div className="flex-1 flex flex-col items-center justify-center p-4 space-y-3">
            <div className="text-center space-y-1">
              <p className="text-xs text-muted-foreground font-medium">
                Start a conversation with {agentName}
              </p>
              <p className="text-[9px] text-muted-foreground/80">
                Try one of the suggestions below
              </p>
            </div>
            <div className="w-full max-w-[220px]">
              <Suggestions>
                {suggestions.map((suggestion) => (
                  <Suggestion
                    key={suggestion}
                    suggestion={suggestion}
                    onClick={handleSuggestionClick}
                    disabled={isLoading}
                  />
                ))}
              </Suggestions>
            </div>
          </div>
        ) : (
          // Messages layout
          <>
            <div className="flex-1 overflow-y-auto p-2 space-y-1.5 min-h-0 scroll-smooth overscroll-contain">
              {messages.map((message) => {
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
                    .map((part: any) =>
                      typeof part === 'string' ? part : part.text || part.content || ''
                    )
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
                        'rounded-md px-2 py-1 max-w-[85%] relative',
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground'
                      )}
                    >
                      <p className="text-[11px] leading-tight whitespace-pre-wrap break-words pr-4">
                        {content}
                      </p>
                      {message.role === 'assistant' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className={cn(
                            'absolute top-0.5 right-0.5 h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity',
                            'text-muted-foreground hover:text-foreground'
                          )}
                          onClick={() => handleCopyMessage(content, message.id)}
                          title="Copy message"
                        >
                          {copiedMessageId === message.id ? (
                            <Check className="h-2 w-2" />
                          ) : (
                            <Copy className="h-2 w-2" />
                          )}
                        </Button>
                      )}
                    </div>
                    <span className="text-[8px] text-muted-foreground px-1">
                      {message.role === 'user' ? 'You' : agentName}
                    </span>
                  </div>
                )
              })}
              {isLoading && (
                <div className="flex items-start gap-1.5">
                  <div className="bg-muted text-muted-foreground rounded-md px-2 py-1">
                    <Loader2 className="h-2.5 w-2.5 animate-spin" />
                  </div>
                </div>
              )}
              {chatError && (
                <div className="flex items-start gap-1.5">
                  <div className="bg-destructive/10 text-destructive rounded-md px-2 py-1 max-w-[85%]">
                    <p className="text-[10px]">Error: {chatError.message || 'An error occurred'}</p>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </>
        )}

        {/* Input area */}
        <form
          onSubmit={handleFormSubmit}
          className="border-t p-1.5 flex items-center gap-1 shrink-0 mt-auto"
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
            className="flex-1 text-[11px] h-7"
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
            className="shrink-0 h-7 w-7"
          >
            {isLoading ? (
              <Loader2 className="h-2.5 w-2.5 animate-spin" />
            ) : (
              <Send className="h-2.5 w-2.5" />
            )}
          </Button>
        </form>
      </CardContent>
        </div>
      </DialogContent>
    </Dialog>
  )
}
