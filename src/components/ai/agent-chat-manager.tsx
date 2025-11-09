'use client'

import { useState, useCallback } from 'react'
import { AgentDock } from './agent-dock'
import { AgentChatPanel } from './agent-chat-panel'
import { useAgentChat } from '@/lib/hooks/useAgentChat'

export function AgentChatManager() {
  const [openAgentId, setOpenAgentId] = useState<string | null>(null)
  const [iconRefs, setIconRefs] = useState<Map<string, React.RefObject<HTMLButtonElement | null>>>(new Map())

  const handleAgentClick = useCallback((agentId: string, iconRef: React.RefObject<HTMLButtonElement | null>) => {
    // Store the icon ref for positioning
    setIconRefs((prev) => {
      const newMap = new Map(prev)
      newMap.set(agentId, iconRef)
      return newMap
    })

    // Toggle agent chat
    setOpenAgentId((prev) => (prev === agentId ? null : agentId))
  }, [])

  const handleCloseAgent = useCallback(() => {
    setOpenAgentId(null)
  }, [])

  const currentIconRef = openAgentId ? iconRefs.get(openAgentId) : null

  return (
    <>
      <AgentDock onAgentClick={handleAgentClick} openAgentId={openAgentId} />
      {openAgentId && currentIconRef && (
        <AgentChatWrapper
          agentId={openAgentId}
          iconRef={currentIconRef}
          isOpen={true}
          onClose={handleCloseAgent}
        />
      )}
    </>
  )
}

interface AgentChatWrapperProps {
  agentId: string
  iconRef: React.RefObject<HTMLButtonElement>
  isOpen: boolean
  onClose: () => void
}

function AgentChatWrapper({ agentId, iconRef, isOpen, onClose }: AgentChatWrapperProps) {
  const chat = useAgentChat(agentId)

  return (
    <AgentChatPanel
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

