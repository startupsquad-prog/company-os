'use client'

import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { useEffect, useState, useCallback, useMemo } from 'react'
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
  const [userId, setUserId] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [input, setInput] = useState('')
  const [agent, setAgent] = useState<Agent | null>(null)
  const [isLoadingAgent, setIsLoadingAgent] = useState(true)

  // Get user ID for localStorage key
  useEffect(() => {
    const getUserId = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUserId(user?.id || null)
    }
    getUserId()
  }, [])

  // Fetch agent from database
  useEffect(() => {
    if (!agentId) {
      setIsLoadingAgent(false)
      return
    }

    const fetchAgent = async () => {
      try {
        const supabase = createClient()
        
        // Try using public view first
        const { data, error } = await supabase
          .from('ai_agents')
          .select('*')
          .eq('id', agentId)
          .eq('is_active', true)
          .is('deleted_at', null)
          .single()

        if (error) {
          console.error('Error fetching agent:', {
            message: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint
          })
          setAgent(null)
        } else if (!data) {
          console.warn('Agent not found:', agentId)
          setAgent(null)
        } else {
          setAgent(data as Agent)
        }
      } catch (error) {
        console.error('Exception fetching agent:', error)
        setAgent(null)
      } finally {
        setIsLoadingAgent(false)
      }
    }

    fetchAgent()
  }, [agentId])

  // Create transport with agentId query parameter
  const transport = useMemo(() => {
    if (!agentId) return null
    
    return new DefaultChatTransport({
      api: `/api/ai/chat?agentId=${agentId}`,
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
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setInput(e.target.value)
  }, [])

  // Handle form submission
  const handleSubmit = useCallback((e?: React.FormEvent<HTMLFormElement>) => {
    e?.preventDefault()
    if (!input.trim() || chat.status === 'streaming' || !transport) {
      return
    }
    
    chat.sendMessage({
      text: input.trim(),
    })
    
    setInput('')
  }, [input, chat, transport])

  // Append message (for suggestions)
  const append = useCallback((message: { role: 'user' | 'assistant'; content: string }) => {
    if (message.role === 'user' && transport) {
      chat.sendMessage({
        text: message.content,
      })
    }
  }, [chat, transport])

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

