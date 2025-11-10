'use client'

import React, { useEffect, useState, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { AgentDialog } from '@/components/agent-dialog'
import { useAgentChat } from '@/lib/hooks/useAgentChat'

type Agent = {
  id: string
  name: string
  description: string | null
}

interface TopbarAgentsProps {
  onAgentClick?: (agentId: string) => void
}

export function TopbarAgents({ onAgentClick }: TopbarAgentsProps) {
  const [agents, setAgents] = useState<Agent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [openAgentId, setOpenAgentId] = useState<string | null>(null)
  const agentRefs = useRef<Map<string, React.RefObject<HTMLButtonElement | null>>>(new Map())

  // Get or create ref for an agent
  const getAgentRef = (agentId: string): React.RefObject<HTMLButtonElement | null> => {
    if (!agentRefs.current.has(agentId)) {
      agentRefs.current.set(agentId, React.createRef<HTMLButtonElement | null>())
    }
    return agentRefs.current.get(agentId)!
  }

  // Fetch active agents from database
  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const supabase = createClient()

        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser()
        if (authError || !user) {
          console.error('❌ [TopbarAgents] Not authenticated:', authError)
          setIsLoading(false)
          return
        }

        // Use RPC function to get agents
        const { data, error } = (await supabase.rpc('get_ai_agents')) as {
          data: Agent[] | null
          error: any
        }

        if (error) {
          console.error('❌ [TopbarAgents] Error fetching agents:', error)
          setAgents([])
        } else if (!data || (data as Agent[]).length === 0) {
          setAgents([])
        } else {
          const agentList = (data as Agent[]) || []
          setAgents(agentList)
        }
      } catch (error) {
        console.error('❌ [TopbarAgents] Exception fetching agents:', error)
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

  const handleAgentClick = useCallback(
    (agentId: string, iconRef: React.RefObject<HTMLButtonElement | null>) => {
      // Toggle agent chat
      setOpenAgentId((prev) => (prev === agentId ? null : agentId))
      onAgentClick?.(agentId)
    },
    [onAgentClick]
  )

  const handleCloseAgent = useCallback(() => {
    setOpenAgentId(null)
  }, [])

  if (isLoading) {
    return null
  }

  if (agents.length === 0) {
    return null
  }

  return (
    <TooltipProvider>
      <div className="flex items-center gap-1.5">
        {agents.map((agent) => {
          const iconRef = getAgentRef(agent.id)
          const isOpen = openAgentId === agent.id

          return (
            <React.Fragment key={agent.id}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    ref={iconRef}
                    onClick={() => handleAgentClick(agent.id, iconRef)}
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
                <TooltipContent side="bottom" className="px-2 py-1.5 max-w-[160px]">
                  <p className="font-medium text-xs leading-tight">{agent.name}</p>
                  {agent.description && (
                    <p className="text-[10px] text-muted-foreground leading-tight mt-0.5 line-clamp-2">
                      {agent.description}
                    </p>
                  )}
                </TooltipContent>
              </Tooltip>

              {isOpen && iconRef && (
                <AgentDialogWrapper
                  agentId={agent.id}
                  iconRef={iconRef}
                  isOpen={true}
                  onClose={handleCloseAgent}
                />
              )}
            </React.Fragment>
          )
        })}
      </div>
    </TooltipProvider>
  )
}

interface AgentDialogWrapperProps {
  agentId: string
  iconRef: React.RefObject<HTMLButtonElement | null>
  isOpen: boolean
  onClose: () => void
}

function AgentDialogWrapper({ agentId, iconRef, isOpen, onClose }: AgentDialogWrapperProps) {
  const chat = useAgentChat(agentId)

  return (
    <AgentDialog
      isOpen={isOpen && chat.agent !== null}
      onClose={onClose}
      agentId={agentId}
      iconRef={iconRef}
      messages={chat.messages}
      input={chat.input}
      handleInputChange={chat.handleInputChange}
      handleSubmit={chat.handleSubmit}
      isLoading={chat.isLoading}
      resetChat={chat.resetChat}
      append={chat.append}
      agent={chat.agent}
      error={chat.error}
    />
  )
}
