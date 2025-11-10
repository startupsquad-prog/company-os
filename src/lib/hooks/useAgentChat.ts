'use client'

import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { useEffect, useState, useCallback, useMemo } from 'react'
import { useUser } from '@clerk/nextjs'
import { createClient } from '@/lib/supabase/client'

const STORAGE_PREFIX = 'agent-chat-session-'

type Agent = {
  id: string
  name: string
  description: string | null
  system_prompt: string
  tone: string | null
  guidance: string | null
  model: string | null
  max_tokens: number | null
  temperature: number | null
}

export function useAgentChat(agentId: string | null) {
  const { user: clerkUser } = useUser()
  const [isOpen, setIsOpen] = useState(false)
  const [input, setInput] = useState('')
  const [agent, setAgent] = useState<Agent | null>(null)
  const [isLoadingAgent, setIsLoadingAgent] = useState(true)

  const userId = clerkUser?.id || null

  // Fetch agent from database via API route (server-side handles RLS)
  useEffect(() => {
    if (!agentId) {
      setIsLoadingAgent(false)
      return
    }

    const fetchAgent = async () => {
      try {
        // Use API route which handles authentication and RLS server-side
        const response = await fetch(`/api/ai/agents?agentId=${agentId}`)

        if (!response.ok) {
          if (response.status === 404) {
            console.warn('Agent not found:', agentId)
            setAgent(null)
          } else {
            console.warn('Error fetching agent:', response.statusText)
            setAgent(null)
          }
          return
        }

        const result = await response.json()
        if (result.data) {
          setAgent(result.data as Agent)
        } else {
          setAgent(null)
        }
      } catch (error) {
        console.warn('Exception fetching agent:', error)
        setAgent(null)
      } finally {
        setIsLoadingAgent(false)
      }
    }

    fetchAgent()
  }, [agentId])

  // Create transport with chatflow endpoint for isolated agent context
  const transport = useMemo(() => {
    if (!agentId) return null

    return new DefaultChatTransport({
      api: `/api/ai/chatflow/${agentId}`,
    })
  }, [agentId])

  // Use Vercel AI SDK's useChat hook with transport
  const chat = useChat({
    transport: transport || undefined,
    onError: (error) => {
      console.error('❌ [useAgentChat] Error:', error)
    },
  })

  // Handle input change
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setInput(e.target.value)
    },
    []
  )

  // Handle form submission
  const handleSubmit = useCallback(
    (e?: React.FormEvent<HTMLFormElement>) => {
      e?.preventDefault()
      if (!input.trim() || chat.status === 'streaming' || !transport) {
        return
      }

      chat.sendMessage({
        text: input.trim(),
      })

      setInput('')
    },
    [input, chat, transport]
  )

  // Append message (for suggestions)
  const append = useCallback(
    (message: { role: 'user' | 'assistant'; content: string }) => {
      if (message.role === 'user' && transport) {
        chat.sendMessage({
          text: message.content,
        })
      }
    },
    [chat, transport]
  )

  // Load messages from localStorage on mount (per agent)
  const [hasRestored, setHasRestored] = useState(false)

  useEffect(() => {
    if (!userId || !agentId || hasRestored) return

    const storageKey = `${STORAGE_PREFIX}${userId}-${agentId}`
    const savedMessages = localStorage.getItem(storageKey)

    if (savedMessages) {
      try {
        const messages = JSON.parse(savedMessages)
        if (Array.isArray(messages) && messages.length > 0) {
          chat.setMessages(messages)
        }
      } catch (error) {
        console.error('Error loading agent chat session:', error)
      }
    }
    setHasRestored(true)
  }, [userId, agentId, hasRestored, chat])

  // Save messages to localStorage whenever they change (per agent)
  useEffect(() => {
    if (!userId || !agentId || !hasRestored || chat.messages.length === 0) return

    const storageKey = `${STORAGE_PREFIX}${userId}-${agentId}`
    try {
      localStorage.setItem(storageKey, JSON.stringify(chat.messages))
    } catch (error) {
      console.error('Error saving agent chat session:', error)
    }
  }, [chat.messages, userId, agentId, hasRestored])

  const toggleChat = useCallback(() => {
    setIsOpen((prev) => !prev)
  }, [])

  const resetChat = useCallback(() => {
    chat.setMessages([])
    setInput('')
    if (userId && agentId) {
      const storageKey = `${STORAGE_PREFIX}${userId}-${agentId}`
      localStorage.removeItem(storageKey)
    }
  }, [chat, userId, agentId])

  // Determine loading state from status
  const isLoading = chat.status === 'streaming' || chat.status === 'submitted'

  return {
    ...chat,
    input,
    handleInputChange,
    handleSubmit,
    append,
    isLoading,
    isOpen,
    toggleChat,
    resetChat,
    agent,
    isLoadingAgent,
    userId,
  }
}
