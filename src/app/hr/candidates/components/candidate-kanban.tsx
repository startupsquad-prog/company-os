'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Plus, Calendar, Phone, Tag } from 'lucide-react'
import type { CandidateFull, CandidateStatus } from '@/lib/types/recruitment'
import { format, formatDistanceToNow } from 'date-fns'
import { getDiceBearAvatar, getUserInitials } from '@/lib/utils/avatar'

interface CandidateKanbanProps {
  data: CandidateFull[]
  statusOptions?: Array<{ label: string; value: string }>
  onEdit?: (candidate: CandidateFull) => void
  onDelete?: (candidate: CandidateFull) => void
  onView?: (candidate: CandidateFull) => void
  onStatusChange?: (candidateId: string, newStatus: CandidateStatus) => Promise<void>
  onAdd?: () => void
}

const statusOrder: CandidateStatus[] = [
  'new',
  'screening',
  'shortlisted',
  'interviewing',
  'offered',
  'hired',
  'rejected',
  'withdrawn',
]

const statusConfig: Record<CandidateStatus, { label: string; color: string }> = {
  new: { label: 'New', color: 'bg-gray-100' },
  screening: { label: 'Screening', color: 'bg-blue-100' },
  shortlisted: { label: 'Shortlisted', color: 'bg-green-100' },
  interviewing: { label: 'Interviewing', color: 'bg-yellow-100' },
  offered: { label: 'Offered', color: 'bg-orange-100' },
  hired: { label: 'Hired', color: 'bg-green-200' },
  rejected: { label: 'Rejected', color: 'bg-red-100' },
  withdrawn: { label: 'Withdrawn', color: 'bg-gray-200' },
}

export function CandidateKanban({
  data,
  statusOptions = [],
  onEdit,
  onDelete,
  onView,
  onStatusChange,
  onAdd,
}: CandidateKanbanProps) {
  const router = useRouter()
  const [draggedCandidate, setDraggedCandidate] = useState<CandidateFull | null>(null)

  const handleView = (candidate: CandidateFull) => {
    if (onView) {
      onView(candidate)
    } else {
      router.push(`/hr/candidates/${candidate.id}`)
    }
  }

  // Group candidates by status
  const candidatesByStatus = statusOrder.reduce(
    (acc, status) => {
      acc[status] = data.filter((candidate) => candidate.status === status)
      return acc
    },
    {} as Record<CandidateStatus, CandidateFull[]>
  )

  const handleDragStart = (candidate: CandidateFull) => {
    setDraggedCandidate(candidate)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = async (newStatus: CandidateStatus) => {
    if (draggedCandidate && onStatusChange && draggedCandidate.status !== newStatus) {
      await onStatusChange(draggedCandidate.id, newStatus)
    }
    setDraggedCandidate(null)
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 overscroll-x-contain">
      {statusOrder.map((status) => {
        const candidates = candidatesByStatus[status] || []
        const config = statusConfig[status]

        return (
          <div
            key={status}
            className="flex-shrink-0 w-80"
            onDragOver={handleDragOver}
            onDrop={() => handleDrop(status)}
          >
            <Card className="h-full flex flex-col">
              <CardHeader className="pb-3 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${config.color}`} />
                    <h3 className="font-semibold text-sm">{config.label}</h3>
                    <Badge variant="secondary" className="ml-2 text-xs">
                      {candidates.length}
                    </Badge>
                  </div>
                  {onAdd && status === 'new' && (
                    <Button variant="ghost" size="sm" onClick={onAdd} className="h-6 w-6 p-0">
                      <Plus className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3 flex-1 overflow-y-auto min-h-0">
                {candidates.map((candidate) => {
                  const contact = candidate.contact
                  const contactName = contact?.name || 'Unnamed Candidate'
                  const contactEmail = contact?.email || ''
                  const contactPhone = contact?.phone || ''
                  const avatarSeed = contactName !== 'Unnamed Candidate' ? contactName : contactEmail || candidate.id
                  const avatarUrl = getDiceBearAvatar(avatarSeed)
                  const initials = contactName !== 'Unnamed Candidate'
                    ? getUserInitials(contactName.split(' ')[0], contactName.split(' ').slice(1).join(' '), contactEmail)
                    : '?'
                  
                  const createdDate = format(new Date(candidate.created_at), 'MMM d, yyyy')
                  const source = candidate.source || 'other'
                  const sourceLabel = source.charAt(0).toUpperCase() + source.slice(1)

                  return (
                    <Card
                      key={candidate.id}
                      className="cursor-pointer hover:shadow-md transition-shadow border"
                      draggable
                      onDragStart={() => handleDragStart(candidate)}
                      onClick={(e) => {
                        const target = e.target as HTMLElement
                        if (target.closest('[data-action-buttons]') || target.closest('button[type="button"]')) {
                          return
                        }
                        handleView(candidate)
                      }}
                    >
                      <CardContent className="p-4">
                        {/* Header: Avatar, Name, Date */}
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <div className="flex items-start gap-2 flex-1 min-w-0">
                            <Avatar className="h-10 w-10 flex-shrink-0">
                              <AvatarImage src={avatarUrl} alt={contactName} />
                              <AvatarFallback className="text-xs bg-muted">
                                {initials}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-sm truncate">{contactName}</h4>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <Calendar className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                                <p className="text-xs text-muted-foreground whitespace-nowrap">
                                  {createdDate}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Phone Number */}
                        <div className="flex items-center gap-2 mb-3">
                          <Phone className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                          <span className="text-xs text-foreground truncate font-medium">
                            {contactPhone || 'No phone'}
                          </span>
                        </div>

                        {/* Source */}
                        <div className="mb-3">
                          <p className="text-xs font-medium text-muted-foreground mb-1">Source</p>
                          <Badge variant="outline" className="text-xs h-5">
                            {sourceLabel}
                          </Badge>
                        </div>

                        {/* Tags */}
                        {candidate.tags && candidate.tags.length > 0 && (
                          <div className="mb-3">
                            <div className="flex flex-wrap gap-1">
                              {candidate.tags.slice(0, 2).map((tag, idx) => (
                                <Badge key={idx} variant="secondary" className="text-xs h-5 inline-flex items-center w-fit">
                                  <Tag className="h-2.5 w-2.5 mr-1 flex-shrink-0" />
                                  <span className="truncate">{tag}</span>
                                </Badge>
                              ))}
                              {candidate.tags.length > 2 && (
                                <Badge variant="secondary" className="text-xs h-5">
                                  +{candidate.tags.length - 2}
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Divider */}
                        <div className="border-t border-border mt-3 mb-2" />

                        {/* Action Buttons */}
                        <div 
                          data-action-buttons
                          className="flex gap-1 -mx-4 px-0"
                          onClick={(e) => e.stopPropagation()}
                          onMouseDown={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            className="flex-1 h-7 text-xs rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/90 active:bg-secondary/80 disabled:opacity-100 disabled:bg-secondary disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-1 cursor-pointer"
                            style={{ padding: '2px 1px', minWidth: 0 }}
                            onClick={(e) => {
                              e.stopPropagation()
                              if (contactPhone) {
                                const cleanPhone = contactPhone.replace(/\D/g, '')
                                window.open(`https://wa.me/${cleanPhone}`, '_blank')
                              }
                            }}
                            disabled={!contactPhone}
                          >
                            <img 
                              src="/brandfetch/whatsapp-icon-logo-svgrepo-com.svg"
                              alt="WhatsApp"
                              width={12}
                              height={12}
                              className="flex-shrink-0"
                              style={{ width: '12px', height: '12px', display: 'block' }}
                            />
                            <span className="text-xs whitespace-nowrap">WhatsApp</span>
                          </button>
                          <button
                            type="button"
                            className="flex-1 h-7 text-xs rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/90 active:bg-secondary/80 disabled:opacity-100 disabled:bg-secondary disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-1 cursor-pointer"
                            style={{ padding: '2px 1px', minWidth: 0 }}
                            onClick={(e) => {
                              e.stopPropagation()
                              if (contactEmail) {
                                window.open(`https://mail.google.com/mail/?view=cm&to=${encodeURIComponent(contactEmail)}`, '_blank')
                              }
                            }}
                            disabled={!contactEmail}
                          >
                            <img 
                              src="/brandfetch/gmail-svgrepo-com.svg"
                              alt="Gmail"
                              width={12}
                              height={12}
                              className="flex-shrink-0"
                              style={{ width: '12px', height: '12px', display: 'block' }}
                            />
                            <span className="text-xs whitespace-nowrap">Gmail</span>
                          </button>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}

                {candidates.length === 0 && (
                  <div className="text-center text-sm text-muted-foreground py-8">
                    <p>No candidates in this stage</p>
                    {onAdd && status === 'new' && (
                      <Button variant="outline" size="sm" onClick={onAdd} className="mt-2">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Candidate
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )
      })}
    </div>
  )
}


