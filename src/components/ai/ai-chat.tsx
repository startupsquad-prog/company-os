'use client'

import { useUser } from '@clerk/nextjs'
import { useAiChat } from '@/lib/hooks/useAiChat'
import { AiChatButton } from './ai-chat-button'
import { AiChatPanel } from './ai-chat-panel'

export function AiChat() {
  const { isLoaded, isSignedIn } = useUser()
  const chat = useAiChat()

  // Don't render if not authenticated or still checking
  if (!isLoaded || !isSignedIn) {
    return null
  }

  return (
    <>
      <AiChatButton isOpen={chat.isOpen} onClick={chat.toggleChat} />
      <AiChatPanel
        isOpen={chat.isOpen}
        onClose={chat.toggleChat}
        messages={chat.messages}
        input={chat.input}
        handleInputChange={chat.handleInputChange}
        handleSubmit={chat.handleSubmit}
        isLoading={chat.isLoading}
        resetChat={chat.resetChat}
        append={chat.append}
        error={chat.error}
      />
    </>
  )
}
