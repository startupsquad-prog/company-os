'use client'

import { Button } from '@/components/ui/button'
import { RainbowButton } from '@/components/ui/rainbow-button'
import { Phone, MessageSquare, Mail, Edit, Clock, CheckCircle, XCircle, Sparkles } from 'lucide-react'
import type { LeadFull } from '@/lib/types/leads'

interface LeadTopbarActionsProps {
  lead: LeadFull | null
  onLogUpdate: () => void
  onLogCall: () => void
  onSendWhatsApp: () => void
  onSendEmail: () => void
  onEdit: () => void
  onScheduleCallback: () => void
  onCloseLead: (status: 'won' | 'lost') => void
  onAiGenerateProposal?: () => void
  onAiGenerateEmail?: () => void
}

export function LeadTopbarActions({
  lead,
  onLogUpdate,
  onLogCall,
  onSendWhatsApp,
  onSendEmail,
  onEdit,
  onScheduleCallback,
  onCloseLead,
  onAiGenerateProposal,
  onAiGenerateEmail,
}: LeadTopbarActionsProps) {
  if (!lead) return null

  const canContact = lead.contact?.phone || lead.contact?.email

  return (
    <div className="flex items-center gap-2 flex-shrink-0">
      {/* Primary Actions */}
      <Button onClick={onLogUpdate} size="sm" variant="default">
        <Edit className="mr-2 h-4 w-4" />
        Log Update
      </Button>

      {onAiGenerateProposal && (
        <RainbowButton onClick={onAiGenerateProposal}>
          <Sparkles className="h-4 w-4" />
          <span className="ml-2 hidden sm:inline">AI Generate Proposal</span>
        </RainbowButton>
      )}

      <Button onClick={onLogCall} size="sm" variant="outline">
        <Phone className="mr-2 h-4 w-4" />
        Log Call
      </Button>

      {/* Communication Actions */}
      {lead.contact?.phone && (
        <Button onClick={onSendWhatsApp} size="sm" variant="outline">
          <MessageSquare className="mr-2 h-4 w-4" />
          WhatsApp
        </Button>
      )}

      {lead.contact?.email && (
        <>
          <Button onClick={onSendEmail} size="sm" variant="outline">
            <Mail className="mr-2 h-4 w-4" />
            Email
          </Button>
          {onAiGenerateEmail && (
            <RainbowButton onClick={onAiGenerateEmail}>
              <Sparkles className="h-4 w-4" />
              <span className="ml-2 hidden sm:inline">AI Generate Email</span>
            </RainbowButton>
          )}
        </>
      )}

      {/* Utility Actions */}
      <Button onClick={onScheduleCallback} size="sm" variant="ghost">
        <Clock className="mr-2 h-4 w-4" />
        Schedule
      </Button>

      {/* Close Lead Actions */}
      {lead.status !== 'won' && lead.status !== 'lost' && (
        <>
          <Button
            onClick={() => onCloseLead('won')}
            size="sm"
            variant="outline"
            className="text-green-600 hover:text-green-700 hover:bg-green-50"
          >
            <CheckCircle className="mr-2 h-4 w-4" />
            Close Won
          </Button>
          <Button
            onClick={() => onCloseLead('lost')}
            size="sm"
            variant="outline"
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <XCircle className="mr-2 h-4 w-4" />
            Close Lost
          </Button>
        </>
      )}
    </div>
  )
}

