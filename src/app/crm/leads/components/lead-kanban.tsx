'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Plus, Star, Calendar, Phone, Tag } from 'lucide-react'
import type { LeadFull, LeadStatus } from '@/lib/types/leads'
import { format, formatDistanceToNow } from 'date-fns'
import { getDiceBearAvatar, getUserInitials } from '@/lib/utils/avatar'

interface LeadKanbanProps {
  data: LeadFull[]
  statusOptions?: Array<{ label: string; value: string }>
  onEdit?: (lead: LeadFull) => void
  onDelete?: (lead: LeadFull) => void
  onView?: (lead: LeadFull) => void
  onStatusChange?: (leadId: string, newStatus: string) => Promise<void>
  onAdd?: () => void
}

const statusOrder: LeadStatus[] = [
  'new',
  'contacted',
  'qualified',
  'proposal',
  'negotiation',
  'won',
  'lost',
]

const statusConfig: Record<LeadStatus, { label: string; color: string }> = {
  new: { label: 'New', color: 'bg-gray-100' },
  contacted: { label: 'Contacted', color: 'bg-blue-100' },
  qualified: { label: 'Qualified', color: 'bg-green-100' },
  proposal: { label: 'Proposal', color: 'bg-yellow-100' },
  negotiation: { label: 'Negotiation', color: 'bg-orange-100' },
  won: { label: 'Won', color: 'bg-green-200' },
  lost: { label: 'Lost', color: 'bg-red-100' },
}

// Helper to get lead rating (default to 3 if not in meta, or calculate from interactions)
const getLeadRating = (lead: LeadFull): number => {
  if (lead.meta && typeof lead.meta.rating === 'number') {
    return Math.min(5, Math.max(0, lead.meta.rating))
  }
  // Default rating or calculate from interactions
  return 3
}

// Helper to get "interested in" text
const getInterestedIn = (lead: LeadFull): string => {
  if (lead.tags && lead.tags.length > 0) {
    return lead.tags.join(', ')
  }
  if (lead.meta && lead.meta.interested_in) {
    return lead.meta.interested_in
  }
  return 'Not specified'
}

// Helper to get primary tag for display
const getPrimaryTag = (lead: LeadFull): string | null => {
  if (lead.tags && lead.tags.length > 0) {
    return lead.tags[0]
  }
  if (lead.meta && lead.meta.next_action) {
    return lead.meta.next_action
  }
  if (lead.meta && lead.meta.interested_in) {
    return lead.meta.interested_in
  }
  return null
}


// Star Rating Component
const StarRating = ({ rating }: { rating: number }) => {
  const fullStars = Math.floor(rating)
  const hasHalfStar = rating % 1 >= 0.5
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0)

  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: fullStars }).map((_, i) => (
        <Star key={`full-${i}`} className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
      ))}
      {hasHalfStar && (
        <Star className="h-3.5 w-3.5 fill-yellow-400/50 text-yellow-400" />
      )}
      {Array.from({ length: emptyStars }).map((_, i) => (
        <Star key={`empty-${i}`} className="h-3.5 w-3.5 fill-none text-yellow-400/30" />
      ))}
    </div>
  )
}

export function LeadKanban({
  data,
  statusOptions = [],
  onEdit,
  onDelete,
  onView,
  onStatusChange,
  onAdd,
}: LeadKanbanProps) {
  const router = useRouter()
  const [draggedLead, setDraggedLead] = useState<LeadFull | null>(null)

  const handleView = (lead: LeadFull) => {
    if (onView) {
      onView(lead)
    } else {
      router.push(`/crm/leads/${lead.id}`)
    }
  }

  // Group leads by status
  const leadsByStatus = statusOrder.reduce(
    (acc, status) => {
      acc[status] = data.filter((lead) => lead.status === status)
      return acc
    },
    {} as Record<LeadStatus, LeadFull[]>
  )

  const handleDragStart = (lead: LeadFull) => {
    setDraggedLead(lead)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = async (newStatus: LeadStatus) => {
    if (draggedLead && onStatusChange && draggedLead.status !== newStatus) {
      await onStatusChange(draggedLead.id, newStatus)
    }
    setDraggedLead(null)
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 overscroll-x-contain">
      {statusOrder.map((status) => {
        const leads = leadsByStatus[status] || []
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
                      {leads.length}
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
                {leads.map((lead) => {
                  const contact = lead.contact
                  const contactName = contact?.name || 'Unnamed Lead'
                  const contactEmail = contact?.email || ''
                  const contactPhone = contact?.phone || ''
                  const avatarSeed = contactName !== 'Unnamed Lead' ? contactName : contactEmail || lead.id
                  const avatarUrl = getDiceBearAvatar(avatarSeed)
                  const initials = contactName !== 'Unnamed Lead'
                    ? getUserInitials(contactName.split(' ')[0], contactName.split(' ').slice(1).join(' '), contactEmail)
                    : '?'
                  
                  const rating = getLeadRating(lead)
                  const interestedIn = getInterestedIn(lead)
                  const lastConnected = lead.last_interaction_at 
                    ? formatDistanceToNow(new Date(lead.last_interaction_at), { addSuffix: true })
                    : null
                  const createdDate = format(new Date(lead.created_at), 'MMM d, yyyy')

                  return (
                    <Card
                      key={lead.id}
                      className="cursor-pointer hover:shadow-md transition-shadow border"
                      draggable
                      onDragStart={() => handleDragStart(lead)}
                      onClick={(e) => {
                        // Don't trigger view if clicking on action buttons
                        const target = e.target as HTMLElement
                        if (target.closest('[data-action-buttons]') || target.closest('button[type="button"]')) {
                          return
                        }
                        handleView(lead)
                      }}
                    >
                      <CardContent className="p-4">
                        {/* Header: Avatar, Name, Date, Rating */}
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
                          <div className="flex items-center flex-shrink-0">
                            <StarRating rating={rating} />
                          </div>
                        </div>

                        {/* Phone Number - Always show */}
                        <div className="flex items-center gap-2 mb-3">
                          <Phone className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                          <span className="text-xs text-foreground truncate font-medium">
                            {contactPhone || 'No phone'}
                          </span>
                        </div>

                        {/* Interested In */}
                        <div className="mb-3">
                          <p className="text-xs font-medium text-muted-foreground mb-1">Interested in</p>
                          <p className="text-xs text-foreground line-clamp-2">{interestedIn}</p>
                        </div>

                        {/* Last Called and Tag - Always show section */}
                        <div className="space-y-2 mb-3">
                          {/* Last Called - Always show */}
                          <div className="flex items-center gap-1.5">
                            <p className="text-xs text-muted-foreground">
                              Last Called: <span className="font-medium text-foreground">
                                {(lead.last_call_date || lead.last_interaction_at) 
                                  ? formatDistanceToNow(new Date(lead.last_call_date || lead.last_interaction_at!), { addSuffix: true })
                                  : 'Never'}
                              </span>
                            </p>
                          </div>
                          {/* Tag - Always show if exists */}
                          {getPrimaryTag(lead) && (
                            <Badge variant="secondary" className="text-xs h-5 inline-flex items-center w-fit">
                              <Tag className="h-2.5 w-2.5 mr-1 flex-shrink-0" />
                              <span className="truncate">{getPrimaryTag(lead)}</span>
                            </Badge>
                          )}
                        </div>

                        {/* Divider - Always show */}
                        <div className="border-t border-border mt-3 mb-2" />

                        {/* Action Buttons - Minimal padding, fully clickable */}
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

                {leads.length === 0 && (
                  <div className="text-center text-sm text-muted-foreground py-8">
                    <p>No leads in this stage</p>
                    {onAdd && status === 'new' && (
                      <Button variant="outline" size="sm" onClick={onAdd} className="mt-2">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Lead
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
