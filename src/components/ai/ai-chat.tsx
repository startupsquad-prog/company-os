'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAiChat } from '@/lib/hooks/useAiChat'
import { AiChatButton } from './ai-chat-button'
import { AiChatPanel } from './ai-chat-panel'

export function AiChat() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const chat = useAiChat()

  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const supabase = createClient()
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser()
        
        if (error) {
          console.error('Error checking auth:', error)
          setIsAuthenticated(false)
        } else {
          setIsAuthenticated(!!user)
        }
      } catch (error) {
        console.error('Error checking auth:', error)
        setIsAuthenticated(false)
      } finally {
        setIsCheckingAuth(false)
      }
    }

    checkAuth()

    // Listen for auth changes
    const supabase = createClient()
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session?.user)
      setIsCheckingAuth(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  // Don't render if not authenticated or still checking
  if (isCheckingAuth || !isAuthenticated) {
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

