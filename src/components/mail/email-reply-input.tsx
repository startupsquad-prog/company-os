'use client'

import { useState } from 'react'
import { Send } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { EmailContent } from './types'

interface EmailReplyInputProps {
  email: EmailContent | null
  onSend: (reply: string, muteThread: boolean) => void
  disabled?: boolean
}

export function EmailReplyInput({
  email,
  onSend,
  disabled,
}: EmailReplyInputProps) {
  const [reply, setReply] = useState('')
  const [muteThread, setMuteThread] = useState(false)

  const handleSend = () => {
    if (reply.trim() && !disabled) {
      onSend(reply.trim(), muteThread)
      setReply('')
      setMuteThread(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  if (!email) {
    return null
  }

  return (
    <div className="px-6 py-4 border-t bg-background flex-shrink-0">
      <div className="flex flex-col gap-3">
        <Input
          type="text"
          placeholder={`Reply ${email.sender.name}...`}
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          className="flex-1"
        />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Switch
              id="mute-thread"
              checked={muteThread}
              onCheckedChange={setMuteThread}
              disabled={disabled}
            />
            <Label
              htmlFor="mute-thread"
              className="text-sm font-normal cursor-pointer"
            >
              Mute this thread
            </Label>
          </div>
          <Button
            onClick={handleSend}
            disabled={disabled || !reply.trim()}
            className="px-4"
          >
            Send
          </Button>
        </div>
      </div>
    </div>
  )
}

