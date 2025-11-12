'use client'

import { Button } from '@/components/ui/button'
import { Phone, Calendar, FileText, Mail, MessageSquare, Edit, UserPlus } from 'lucide-react'
import type { CandidateFull } from '@/lib/types/recruitment'
import { useRouter } from 'next/navigation'

interface CandidateTopbarActionsProps {
  candidate: CandidateFull | null
  onEdit?: () => void
  onScheduleInterview?: () => void
  onLogCall?: () => void
  onAddApplication?: () => void
}

export function CandidateTopbarActions({
  candidate,
  onEdit,
  onScheduleInterview,
  onLogCall,
  onAddApplication,
}: CandidateTopbarActionsProps) {
  const router = useRouter()
  
  if (!candidate) return null

  const contact = candidate.contact
  const canContact = contact?.phone || contact?.email

  const handleSendWhatsApp = () => {
    if (!contact?.phone) return
    const phone = contact.phone.replace(/\D/g, '')
    window.open(`https://wa.me/${phone}`, '_blank')
  }

  const handleSendEmail = () => {
    if (!contact?.email) return
    window.location.href = `mailto:${contact.email}`
  }

  return (
    <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
      {/* Primary Actions */}
      {onEdit && (
        <Button onClick={onEdit} size="sm" variant="default">
          <Edit className="mr-2 h-4 w-4" />
          Edit
        </Button>
      )}

      {onScheduleInterview && (
        <Button onClick={onScheduleInterview} size="sm" variant="outline">
          <Calendar className="mr-2 h-4 w-4" />
          Schedule Interview
        </Button>
      )}

      {onLogCall && (
        <Button onClick={onLogCall} size="sm" variant="outline">
          <Phone className="mr-2 h-4 w-4" />
          Log Call
        </Button>
      )}

      {onAddApplication && (
        <Button onClick={onAddApplication} size="sm" variant="outline">
          <UserPlus className="mr-2 h-4 w-4" />
          Add Application
        </Button>
      )}

      {/* Communication Actions */}
      {contact?.phone && (
        <Button onClick={handleSendWhatsApp} size="sm" variant="outline">
          <MessageSquare className="mr-2 h-4 w-4" />
          WhatsApp
        </Button>
      )}

      {contact?.email && (
        <Button onClick={handleSendEmail} size="sm" variant="outline">
          <Mail className="mr-2 h-4 w-4" />
          Email
        </Button>
      )}

      {/* View Resume */}
      {candidate.resume_url && (
        <Button
          onClick={() => window.open(candidate.resume_url!, '_blank')}
          size="sm"
          variant="ghost"
        >
          <FileText className="mr-2 h-4 w-4" />
          View Resume
        </Button>
      )}
    </div>
  )
}

