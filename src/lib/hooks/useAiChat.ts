'use client'

import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { useEffect, useState, useCallback, useMemo } from 'react'
import { useUser } from '@clerk/nextjs'

const STORAGE_PREFIX = 'ai-chat-session-'

export function useAiChat() {
  const { user } = useUser()
  const [isOpen, setIsOpen] = useState(false)
  const [input, setInput] = useState('')

  // Create transport once - DefaultChatTransport handles the response format correctly
  const transport = useMemo(() => {
    return new DefaultChatTransport({
      api: '/api/ai/chat',
    })
  }, [])

  // Use Vercel AI SDK's useChat hook with transport
  const chat = useChat({
    transport,
    onError: (error) => {
      console.error('❌ [useChat] Error:', error)
      console.error('❌ [useChat] Error message:', error.message)
      console.error('❌ [useChat] Error stack:', error.stack)
    },
    onFinish: ({ message }) => {
      console.log('✅ [useChat] Message finished:', {
        id: message.id,
        role: message.role,
        hasParts: !!(message as any).parts,
        partsCount: (message as any).parts?.length || 0,
        parts: (message as any).parts,
        fullMessage: message,
      })
    },
    onData: (data) => {
      console.log('📥 [useChat] Data received:', {
        type: data.type,
        data: data,
      })
    },
  })

  // Debug: Log message updates
  useEffect(() => {
    if (chat.messages.length > 0) {
      const lastMessage = chat.messages[chat.messages.length - 1]
      console.log('🔄 [useChat] Last message updated:', {
        id: lastMessage.id,
        role: lastMessage.role,
        hasParts: !!(lastMessage as any).parts,
        partsCount: (lastMessage as any).parts?.length || 0,
        parts: (lastMessage as any).parts,
        status: chat.status,
      })
    }
  }, [chat.messages, chat.status])

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
      if (!input.trim() || chat.status === 'streaming') {
        return
      }

      // Use the simpler text format for sendMessage
      chat.sendMessage({
        text: input.trim(),
      })

      setInput('')
    },
    [input, chat]
  )

  // Append message (for suggestions)
  const append = useCallback(
    (message: { role: 'user' | 'assistant'; content: string }) => {
      if (message.role === 'user') {
        // Use the simpler text format for sendMessage
        chat.sendMessage({
          text: message.content,
        })
      }
    },
    [chat]
  )

  // Load messages from localStorage on mount (only once)
  const [hasRestored, setHasRestored] = useState(false)
  const userId = user?.id || null

  useEffect(() => {
    if (!userId || hasRestored) return

    const storageKey = `${STORAGE_PREFIX}${userId}`
    const savedMessages = localStorage.getItem(storageKey)

    if (savedMessages) {
      try {
        const messages = JSON.parse(savedMessages)
        if (Array.isArray(messages) && messages.length > 0) {
          chat.setMessages(messages)
        }
      } catch (error) {
        console.error('Error loading chat session:', error)
      }
    }
    setHasRestored(true)
  }, [userId, hasRestored, chat])

  // Save messages to localStorage whenever they change (skip initial restore)
  useEffect(() => {
    if (!userId || !hasRestored || chat.messages.length === 0) return

    const storageKey = `${STORAGE_PREFIX}${userId}`
    try {
      localStorage.setItem(storageKey, JSON.stringify(chat.messages))
    } catch (error) {
      console.error('Error saving chat session:', error)
    }
  }, [chat.messages, userId, hasRestored])

  const toggleChat = useCallback(() => {
    setIsOpen((prev) => !prev)
  }, [])

  const resetChat = useCallback(() => {
    chat.setMessages([])
    setInput('')
    if (userId) {
      const storageKey = `${STORAGE_PREFIX}${userId}`
      localStorage.removeItem(storageKey)
    }
  }, [chat, userId])

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
    userId,
  }
}
