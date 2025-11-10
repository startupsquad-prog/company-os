'use client'

import React, { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

type Agent = {
  id: string
  name: string
  description: string | null
}

interface AgentDockProps {
  onAgentClick: (agentId: string, iconRef: React.RefObject<HTMLButtonElement | null>) => void
  openAgentId: string | null
}

export function AgentDock({ onAgentClick, openAgentId }: AgentDockProps) {
  const [agents, setAgents] = useState<Agent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const agentRefs = useRef<Map<string, React.RefObject<HTMLButtonElement | null>>>(new Map())

  // Get or create ref for an agent
  const getAgentRef = (agentId: string): React.RefObject<HTMLButtonElement | null> => {
    if (!agentRefs.current.has(agentId)) {
      agentRefs.current.set(agentId, React.createRef<HTMLButtonElement | null>())
    }
    return agentRefs.current.get(agentId)!
  }

  // Fetch active agents from database (exclude default agent)
  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const supabase = createClient()

        // First check if user is authenticated
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser()
        if (authError || !user) {
          console.error('❌ [AgentDock] Not authenticated:', authError)
          setIsLoading(false)
          return
        }

        console.log('🔍 [AgentDock] Fetching agents for user:', user.id)

        // Use RPC function to get agents (more reliable than view)
        const { data, error } = (await supabase.rpc('get_ai_agents')) as {
          data: Agent[] | null
          error: any
        }

        console.log('📊 [AgentDock] Filtered agents query result:', {
          data,
          error,
          count: (data as Agent[] | null)?.length || 0,
          hasError: !!error,
          errorType: error?.constructor?.name,
          errorString: error ? JSON.stringify(error, Object.getOwnPropertyNames(error)) : null,
          errorDetails: error
            ? {
                message: error.message,
                details: error.details,
                hint: error.hint,
                code: error.code,
                status: (error as any).status,
                statusText: (error as any).statusText,
              }
            : null,
        })

        // Check for error OR empty data (both are issues)
        if (error) {
          console.error('❌ [AgentDock] Error fetching agents:', {
            error,
            errorString: JSON.stringify(error, Object.getOwnPropertyNames(error)),
            errorMessage: error.message,
            errorCode: error.code,
            errorDetails: error.details,
            errorHint: error.hint,
          })
          setAgents([])
        } else if (!data || (data as Agent[]).length === 0) {
          console.warn('⚠️ [AgentDock] No agents returned (but no error). Data:', data)
          setAgents([])
        } else {
          const agentList = (data as Agent[]) || []
          console.log(
            '✅ [AgentDock] Fetched agents:',
            agentList.length,
            agentList.map((a) => a.name)
          )
          setAgents(agentList)
        }
      } catch (error) {
        console.error('❌ [AgentDock] Exception fetching agents:', error)
        setAgents([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchAgents()
  }, [])

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

  // Always render dock container, even if loading or empty (for debugging)
  if (isLoading) {
    return (
      <div
        className={cn(
          'fixed z-[55]',
          'bottom-4 right-20',
          'px-4 py-2',
          'bg-card/95 backdrop-blur-sm',
          'border border-border rounded-xl',
          'shadow-lg',
          'text-xs text-muted-foreground',
          'sm:right-24',
          'md:right-28'
        )}
      >
        Loading agents...
      </div>
    )
  }

  if (agents.length === 0) {
    console.warn('⚠️ [AgentDock] No agents found')
    return (
      <div
        className={cn(
          'fixed z-[55]',
          'bottom-4 right-20',
          'px-4 py-2',
          'bg-card/95 backdrop-blur-sm',
          'border border-border rounded-xl',
          'shadow-lg',
          'text-xs text-muted-foreground',
          'sm:right-24',
          'md:right-28'
        )}
      >
        No agents available
      </div>
    )
  }

  return (
    <TooltipProvider>
      <div
        className={cn(
          'fixed z-[55]', // Above content but below main chat button (z-60)
          'bottom-4 right-20', // Position at bottom right, leave space for main chat button
          'flex items-center gap-1.5',
          'px-2.5 py-1.5',
          'bg-card/95 backdrop-blur-sm',
          'border border-border rounded-lg',
          'shadow-lg',
          'transition-all duration-300',
          'pointer-events-auto',
          // Responsive positioning
          'sm:right-24',
          'md:right-28'
        )}
      >
        {agents.map((agent) => {
          const iconRef = getAgentRef(agent.id)
          const isOpen = openAgentId === agent.id

          return (
            <Tooltip key={agent.id}>
              <TooltipTrigger asChild>
                <button
                  ref={iconRef}
                  onClick={() => onAgentClick(agent.id, iconRef)}
                  className={cn(
                    'relative',
                    'h-9 w-9',
                    'rounded-lg',
                    'transition-all duration-200',
                    'hover:scale-110 active:scale-95',
                    'focus:outline-none',
                    isOpen ? 'bg-primary/10' : 'bg-transparent hover:bg-muted/50'
                  )}
                  aria-label={`Open ${agent.name}`}
                >
                  <div className="h-full w-full rounded-lg overflow-hidden bg-transparent">
                    <img
                      src={getAgentIcon(agent.name)}
                      alt={agent.name}
                      className="h-full w-full object-cover rounded-lg"
                      onError={(e) => {
                        // Fallback to robot icon if image fails to load
                        const target = e.target as HTMLImageElement
                        target.src = '/ai-3d-icons-pack/32_ ai robot.png'
                      }}
                    />
                  </div>
                  {isOpen && (
                    <div className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-primary border border-background" />
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="px-2 py-1.5 max-w-[160px]">
                <p className="font-medium text-xs leading-tight">{agent.name}</p>
                {agent.description && (
                  <p className="text-[10px] text-muted-foreground leading-tight mt-0.5 line-clamp-2">
                    {agent.description}
                  </p>
                )}
              </TooltipContent>
            </Tooltip>
          )
        })}
      </div>
    </TooltipProvider>
  )
}
