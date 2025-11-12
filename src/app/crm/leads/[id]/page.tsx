'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from '@/components/ui/breadcrumb'
import { format, formatDistanceToNow } from 'date-fns'
import { toast } from 'sonner'
import { Edit, Trash2, ChevronLeft, ChevronRight, ArrowLeft, Phone, MessageSquare, Mail, Clock, Calendar, Tag, Sparkles } from 'lucide-react'
import type { LeadFull, Interaction, StatusHistoryEntry } from '@/lib/types/leads'
import type { CallFull } from '@/lib/types/calls'
import { getDiceBearAvatar, getUserInitials } from '@/lib/utils/avatar'
import { PageLoader } from '@/components/ui/loader'
import { RainbowButton } from '@/components/ui/rainbow-button'
import { LeadUpdateForm } from '../components/lead-update-form'
import { LeadTopbarActions } from '../components/lead-topbar-actions'
import { CloseLeadDialog } from '../components/close-lead-dialog'
import { useUser } from '@clerk/nextjs'
import { createClient } from '@/lib/supabase/client'

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
  new: { label: 'New', variant: 'outline' },
  contacted: { label: 'Contacted', variant: 'default' },
  qualified: { label: 'Qualified', variant: 'default' },
  proposal: { label: 'Proposal', variant: 'secondary' },
  negotiation: { label: 'Negotiation', variant: 'secondary' },
  won: { label: 'Won', variant: 'default' },
  lost: { label: 'Lost', variant: 'destructive' },
}

function LeadDetailPageContent() {
  const params = useParams()
  const router = useRouter()
  const { user } = useUser()
  const leadId = params.id as string

  const [lead, setLead] = useState<LeadFull | null>(null)
  const [interactions, setInteractions] = useState<Interaction[]>([])
  const [statusHistory, setStatusHistory] = useState<StatusHistoryEntry[]>([])
  const [calls, setCalls] = useState<CallFull[]>([])
  const [callsLoading, setCallsLoading] = useState(false)
  const [loading, setLoading] = useState(true)
  const [allLeads, setAllLeads] = useState<LeadFull[]>([])
  const [updateFormOpen, setUpdateFormOpen] = useState(false)
  const [callFormOpen, setCallFormOpen] = useState(false)
  const [closeLeadOpen, setCloseLeadOpen] = useState(false)
  const [closeDialogOpen, setCloseDialogOpen] = useState(false)
  const [pendingCloseStatus, setPendingCloseStatus] = useState<'won' | 'lost' | null>(null)
  const [closingStatus, setClosingStatus] = useState<'won' | 'lost' | null>(null)

  const fetchLead = useCallback(async () => {
    if (!leadId) return

    try {
      setLoading(true)

      const response = await fetch(`/api/unified/leads/${leadId}`)

      if (!response.ok) {
        if (response.status === 404) {
          toast.error('Lead not found')
          router.push('/crm/leads')
          return
        }
        throw new Error('Failed to fetch lead')
      }

      const result = await response.json()
      if (result.data) {
        setLead(result.data as LeadFull)
        setInteractions((result.data.interactions || []) as Interaction[])
        setStatusHistory((result.data.status_history || []) as StatusHistoryEntry[])
      }
    } catch (error: any) {
      console.error('Error fetching lead:', error)
      toast.error(error.message || 'Failed to load lead')
      router.push('/crm/leads')
    } finally {
      setLoading(false)
    }
  }, [leadId, router])

  // Fetch all leads for navigation
  const fetchAllLeads = useCallback(async () => {
    try {
      const response = await fetch('/api/unified/leads?page=1&pageSize=1000')

      if (!response.ok) {
        throw new Error('Failed to fetch leads')
      }

      const result = await response.json()
      setAllLeads(result.leads || [])
    } catch (error) {
      console.error('Error fetching all leads:', error)
    }
  }, [])

  // Fetch calls for this lead
  const fetchCalls = useCallback(async () => {
    if (!leadId) return

    try {
      setCallsLoading(true)
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()

      // Fetch calls for this lead
      const { data: callsData, error: callsError } = await (supabase as any)
        .schema('crm')
        .from('calls')
        .select('*')
        .eq('lead_id', leadId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })

      if (callsError) {
        console.error('Error fetching calls:', callsError)
        setCalls([])
        return
      }

      // Fetch related data (contacts, caller profiles)
      const contactIds = [...new Set((callsData || []).map((c: any) => c.contact_id).filter(Boolean))]
      const callerIds = [...new Set((callsData || []).map((c: any) => c.caller_id).filter(Boolean))]

      const [contactsResult, callersResult] = await Promise.all([
        contactIds.length > 0
          ? (supabase as any)
              .schema('core')
              .from('contacts')
              .select('id, name, email, phone')
              .in('id', contactIds)
          : Promise.resolve({ data: [] }),
        callerIds.length > 0
          ? (supabase as any)
              .schema('core')
              .from('profiles')
              .select('id, first_name, last_name, email, avatar_url')
              .in('id', callerIds)
          : Promise.resolve({ data: [] }),
      ])

      const contactsMap = new Map((contactsResult.data || []).map((c: any) => [c.id, c]))
      const callersMap = new Map((callersResult.data || []).map((p: any) => [p.id, p]))

      // Combine calls with relations
      const callsWithRelations = (callsData || []).map((call: any) => ({
        ...call,
        contact: call.contact_id ? contactsMap.get(call.contact_id) || null : null,
        caller: call.caller_id ? callersMap.get(call.caller_id) || null : null,
      }))

      setCalls(callsWithRelations as CallFull[])
    } catch (error) {
      console.error('Error fetching calls:', error)
      setCalls([])
    } finally {
      setCallsLoading(false)
    }
  }, [leadId])

  useEffect(() => {
    fetchLead()
    fetchAllLeads()
  }, [fetchLead, fetchAllLeads])

  useEffect(() => {
    if (leadId) {
      fetchCalls()
    }
  }, [leadId, fetchCalls])

  const handleDelete = async () => {
    if (!lead) return
    if (!confirm(`Are you sure you want to delete this lead?`)) return

    try {
      const response = await fetch(`/api/unified/leads/${leadId}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to delete lead')

      toast.success('Lead deleted')
      router.push('/crm/leads')
    } catch (error) {
      console.error('Error deleting lead:', error)
      toast.error('Failed to delete lead')
    }
  }

  const navigateLead = (direction: 'prev' | 'next') => {
    const currentIndex = allLeads.findIndex((l) => l.id === leadId)
    if (direction === 'prev' && currentIndex > 0) {
      router.push(`/crm/leads/${allLeads[currentIndex - 1].id}`)
    } else if (direction === 'next' && currentIndex < allLeads.length - 1) {
      router.push(`/crm/leads/${allLeads[currentIndex + 1].id}`)
    }
  }

  const handleLogCall = async () => {
    if (!lead || !user) return
    setCallFormOpen(true)
  }

  const handleSendWhatsApp = () => {
    if (!lead?.contact?.phone) {
      toast.error('Phone number not available')
      return
    }
    
    const phone = lead.contact.phone.replace(/\D/g, '')
    window.open(`https://wa.me/${phone}`, '_blank')
  }

  const handleSendEmail = () => {
    if (!lead?.contact?.email) {
      toast.error('Email not available')
      return
    }
    
    window.location.href = `mailto:${lead.contact.email}`
  }

  const handleSuccess = () => {
    fetchLead()
    fetchAllLeads()
    fetchCalls()
  }

  const handleAiGenerateProposal = () => {
    toast.info('AI Generate Proposal - Coming soon!')
    // TODO: Implement AI proposal generation
  }

  const handleAiGenerateEmail = () => {
    toast.info('AI Generate Email - Coming soon!')
    // TODO: Implement AI email generation
  }

  const handleAiGenerateSummary = () => {
    toast.info('AI Generate Summary - Coming soon!')
    // TODO: Implement AI summary generation
  }

  // Handle close lead confirmation
  const handleCloseLeadConfirm = async (data: {
    amount?: number
    service?: string
    screenshot?: File
  }) => {
    if (!lead || !pendingCloseStatus) return

    try {
      const supabase = createClient()
      let screenshotUrl: string | null = null

      // Upload screenshot if provided
      if (data.screenshot) {
        const fileExt = data.screenshot.name.split('.').pop()
        const fileName = `${Date.now()}.${fileExt}`
        const filePath = `${lead.id}/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('lead-screenshots')
          .upload(filePath, data.screenshot)

        if (uploadError) {
          if (uploadError.message?.includes('Bucket not found')) {
            toast.error('Storage bucket not found. Please contact administrator.')
            throw uploadError
          }
          throw uploadError
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('lead-screenshots')
          .getPublicUrl(filePath)
        
        screenshotUrl = urlData.publicUrl
      }

      // Update lead with status and additional data
      const updateData: any = {
        status: pendingCloseStatus,
        value: data.amount || lead.value,
        meta: {
          ...(lead.meta || {}),
          closed_amount: data.amount,
          closed_service: data.service,
          closed_screenshot: screenshotUrl,
          closed_at: new Date().toISOString(),
        },
      }

      const response = await fetch(`/api/unified/leads/${lead.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      })

      if (!response.ok) throw new Error('Failed to update lead')

      toast.success(`Lead marked as ${pendingCloseStatus === 'won' ? 'Won' : 'Lost'}`)
      fetchLead()
      fetchAllLeads()
      fetchCalls()
    } catch (error) {
      console.error('Error closing lead:', error)
      toast.error('Failed to close lead')
      throw error
    }
  }

  if (loading) {
    return <PageLoader />
  }

  if (!lead) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center min-h-0">
        <p className="text-muted-foreground">Lead not found</p>
        <Button onClick={() => router.push('/crm/leads')} className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Leads
        </Button>
      </div>
    )
  }

  const status = statusConfig[lead.status] || { label: lead.status, variant: 'outline' as const }
  const contactName = lead.contact?.name || 'Unnamed Lead'
  const contactEmail = lead.contact?.email || ''
  const contactPhone = lead.contact?.phone || ''
  const avatarSeed = contactName !== 'Unnamed Lead' ? contactName : contactEmail || lead.id
  const avatarUrl = getDiceBearAvatar(avatarSeed)
  const initials = contactName !== 'Unnamed Lead'
    ? getUserInitials(contactName.split(' ')[0], contactName.split(' ').slice(1).join(' '), contactEmail)
    : '?'

  // Get last interaction
  const lastInteraction = interactions.length > 0 ? interactions[0] : null
  const lastCall = calls.length > 0 ? calls[0] : null
  const lastConnected = lastInteraction ? formatDistanceToNow(new Date(lastInteraction.created_at), { addSuffix: true }) : null
  const lastCallDate = lastCall ? formatDistanceToNow(new Date(lastCall.created_at), { addSuffix: true }) : null
  const lastDiscussion = lastInteraction?.notes || null

  const currentIndex = allLeads.findIndex((l) => l.id === leadId)
  const hasPrevious = currentIndex > 0
  const hasNext = currentIndex < allLeads.length - 1

  return (
    <div className="flex flex-1 flex-col min-w-0 h-full overflow-hidden">
      {/* Breadcrumb with Back Button */}
      <div className="flex items-center gap-1.5 mb-1.5 flex-shrink-0">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/crm/leads')}
          className="h-6 px-1.5 text-xs"
        >
          <ArrowLeft className="mr-1 h-3 w-3" />
          Back
        </Button>
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/crm/leads" className="text-[11px]">Leads</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="text-[11px]">{contactName}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Compact Header with Quick Info */}
      <div className="border-b pb-1.5 mb-1.5 flex-shrink-0">
        <div className="flex items-start gap-1.5">
          <Avatar className="h-8 w-8 flex-shrink-0">
            <AvatarImage src={avatarUrl} alt={contactName} />
            <AvatarFallback className="text-[10px]">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1 mb-0">
              <h1 className="text-sm font-semibold truncate leading-tight">{contactName}</h1>
              <Badge variant={status.variant} className="text-[9px] px-1 py-0 leading-tight">{status.label}</Badge>
              {lead.tags && lead.tags.length > 0 && (
                <div className="flex items-center gap-0.5 flex-wrap">
                  {lead.tags.slice(0, 3).map((tag) => (
                    <Badge key={tag} variant="outline" className="text-[9px] px-1 py-0 leading-tight">
                      <Tag className="mr-0.5 h-1.5 w-1.5" />
                      {tag}
                    </Badge>
                  ))}
                  {lead.tags.length > 3 && (
                    <Badge variant="outline" className="text-[9px] px-1 py-0 leading-tight">
                      +{lead.tags.length - 3}
                    </Badge>
                  )}
                </div>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground flex-wrap leading-tight mt-0.5">
              {contactEmail && (
                <a href={`mailto:${contactEmail}`} className="hover:text-primary hover:underline truncate">
                  {contactEmail}
                </a>
              )}
              {contactPhone && (
                <>
                  {contactEmail && <span>•</span>}
                  <a href={`tel:${contactPhone}`} className="hover:text-primary hover:underline">
                    {contactPhone}
                  </a>
                </>
              )}
            </div>
            {/* Quick Info Row */}
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5 flex-wrap leading-tight">
              <span>Created: {format(new Date(lead.created_at), 'MMM d, yyyy')}</span>
              {lastConnected && (
                <>
                  <span>•</span>
                  <span>Last Connected: {lastConnected}</span>
                </>
              )}
              {lastCallDate && (
                <>
                  <span>•</span>
                  <span>Last Call: {lastCallDate}</span>
                </>
              )}
              {lastDiscussion && (
                <>
                  <span>•</span>
                  <span className="truncate max-w-xs" title={lastDiscussion}>
                    Last Discussion: {lastDiscussion.substring(0, 50)}{lastDiscussion.length > 50 ? '...' : ''}
                  </span>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            {allLeads.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigateLead('prev')}
                  disabled={!hasPrevious}
                  className="h-6 w-6"
                >
                  <ChevronLeft className="h-3 w-3" />
                </Button>
                <span className="text-[10px] text-muted-foreground">
                  {currentIndex + 1} / {allLeads.length}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigateLead('next')}
                  disabled={!hasNext}
                  className="h-6 w-6"
                >
                  <ChevronRight className="h-3 w-3" />
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Topbar Actions */}
      <div className="mb-1.5 flex-shrink-0 border-b pb-1.5">
        <LeadTopbarActions
          lead={lead}
          onLogUpdate={() => {
            setClosingStatus(null)
            setUpdateFormOpen(true)
          }}
          onLogCall={handleLogCall}
          onSendWhatsApp={handleSendWhatsApp}
          onSendEmail={handleSendEmail}
          onEdit={() => router.push(`/crm/leads?edit=${leadId}`)}
          onScheduleCallback={() => {
            setClosingStatus(null)
            setUpdateFormOpen(true)
          }}
          onCloseLead={(status) => {
            setPendingCloseStatus(status)
            setCloseDialogOpen(true)
          }}
          onAiGenerateProposal={handleAiGenerateProposal}
          onAiGenerateEmail={handleAiGenerateEmail}
        />
      </div>

      {/* Content with tabs */}
      <div className="flex-1 overflow-hidden min-h-0">
        <Tabs defaultValue="overview" className="w-full h-full flex flex-col">
          <TabsList className="flex-shrink-0 h-9 w-fit">
            <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
            <TabsTrigger value="calls" className="text-xs">Calls</TabsTrigger>
            <TabsTrigger value="notes" className="text-xs">Notes</TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto min-h-0 mt-3">
            <TabsContent value="overview" className="space-y-3 mt-0">
              <div className="flex items-center justify-end mb-2">
                <RainbowButton onClick={handleAiGenerateSummary}>
                  <Sparkles className="h-4 w-4" />
                  <span className="ml-2 text-xs">AI Summary</span>
                </RainbowButton>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <h3 className="text-xs font-medium text-muted-foreground mb-1">Contact</h3>
                  <div className="space-y-0.5">
                    <p className="font-medium text-sm">{lead.contact?.name || '—'}</p>
                    {lead.contact?.email && (
                      <p className="text-xs text-muted-foreground">{lead.contact.email}</p>
                    )}
                    {lead.contact?.phone && (
                      <p className="text-xs text-muted-foreground">{lead.contact.phone}</p>
                    )}
                  </div>
                </div>
                <div>
                  <h3 className="text-xs font-medium text-muted-foreground mb-1">Company</h3>
                  <div className="space-y-0.5">
                    <p className="font-medium text-sm">{lead.company?.name || '—'}</p>
                    {lead.company?.industry && (
                      <p className="text-xs text-muted-foreground">{lead.company.industry}</p>
                    )}
                    {lead.company?.website && (
                      <a
                        href={lead.company.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:underline"
                      >
                        {lead.company.website}
                      </a>
                    )}
                  </div>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <h3 className="text-xs font-medium text-muted-foreground mb-1">Owner</h3>
                  {lead.owner ? (
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={lead.owner.avatar_url || undefined} />
                        <AvatarFallback className="text-xs">
                          {`${lead.owner.first_name?.[0] || ''}${lead.owner.last_name?.[0] || ''}`.toUpperCase() ||
                            '?'}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm">
                        {`${lead.owner.first_name || ''} ${lead.owner.last_name || ''}`.trim() ||
                          lead.owner.email ||
                          'Unknown'}
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </div>
                <div>
                  <h3 className="text-xs font-medium text-muted-foreground mb-1">Source</h3>
                  <Badge variant="outline" className="text-xs">{lead.source || '—'}</Badge>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-3 gap-3 text-sm">
                <div>
                  <h3 className="text-xs font-medium text-muted-foreground mb-1">Value</h3>
                  <p className="text-sm font-medium">
                    {lead.value ? `$${lead.value.toLocaleString()}` : '—'}
                  </p>
                </div>
                <div>
                  <h3 className="text-xs font-medium text-muted-foreground mb-1">Probability</h3>
                  <p className="text-sm font-medium">{lead.probability ? `${lead.probability}%` : '—'}</p>
                </div>
                <div>
                  <h3 className="text-xs font-medium text-muted-foreground mb-1">Expected Close</h3>
                  <p className="text-sm font-medium">
                    {lead.expected_close_date
                      ? format(new Date(lead.expected_close_date), 'MMM d, yyyy')
                      : '—'}
                  </p>
                </div>
              </div>

              {lead.notes && (
                <>
                  <Separator />
                  <div>
                    <h3 className="text-xs font-medium text-muted-foreground mb-1">Notes</h3>
                    <p className="text-xs whitespace-pre-wrap">{lead.notes}</p>
                  </div>
                </>
              )}
            </TabsContent>

            <TabsContent value="calls" className="mt-0">
              <div className="space-y-2">
                {callsLoading ? (
                  <p className="text-xs text-muted-foreground text-center py-8">Loading calls...</p>
                ) : calls.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-8">No calls recorded yet</p>
                ) : (
                  calls.map((call) => {
                    const callTypeConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
                      inbound: { label: 'Inbound', variant: 'default' },
                      outbound: { label: 'Outbound', variant: 'secondary' },
                      missed: { label: 'Missed', variant: 'destructive' },
                    }
                    const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
                      completed: { label: 'Completed', variant: 'default' },
                      no_answer: { label: 'No Answer', variant: 'outline' },
                      busy: { label: 'Busy', variant: 'outline' },
                      failed: { label: 'Failed', variant: 'destructive' },
                      cancelled: { label: 'Cancelled', variant: 'outline' },
                    }
                    const callType = callTypeConfig[call.call_type] || { label: call.call_type, variant: 'outline' as const }
                    const status = statusConfig[call.status || 'completed'] || { label: call.status || 'Completed', variant: 'default' as const }
                    const duration = call.duration_seconds
                      ? `${Math.floor(call.duration_seconds / 60)}:${String(call.duration_seconds % 60).padStart(2, '0')}`
                      : '—'

                    return (
                      <div key={call.id} className="border rounded-md p-3 text-sm">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <Badge variant={callType.variant} className="text-xs">{callType.label}</Badge>
                              <Badge variant={status.variant} className="text-xs">{status.label}</Badge>
                              {call.subject && (
                                <span className="font-medium text-sm truncate">{call.subject}</span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground mb-1.5 flex-wrap">
                              {call.phone_number && (
                                <span className="flex items-center gap-1">
                                  <Phone className="h-3 w-3" />
                                  {call.phone_number}
                                </span>
                              )}
                              {duration !== '—' && (
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {duration}
                                </span>
                              )}
                              {call.caller && (
                                <span className="truncate">
                                  by {`${call.caller.first_name || ''} ${call.caller.last_name || ''}`.trim() || call.caller.email || 'Unknown'}
                                </span>
                              )}
                            </div>
                            {call.notes && (
                              <p className="text-xs text-muted-foreground mb-1.5 line-clamp-2">{call.notes}</p>
                            )}
                            {call.outcome && (
                              <p className="text-xs text-muted-foreground mb-1.5">
                                <span className="font-medium">Outcome:</span> {call.outcome}
                              </p>
                            )}
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <span>
                                {format(new Date(call.created_at), 'MMM d, yyyy h:mm a')}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </TabsContent>

            <TabsContent value="notes" className="mt-0">
              <div className="space-y-2">
                {lead.notes ? (
                  <div className="border rounded-md p-3">
                    <p className="text-sm whitespace-pre-wrap">{lead.notes}</p>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground text-center py-8">No notes added yet</p>
                )}
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>

      {/* Update Form */}
      <LeadUpdateForm
        lead={lead}
        open={updateFormOpen}
        onOpenChange={(open) => {
          setUpdateFormOpen(open)
          if (!open) {
            setClosingStatus(null)
          }
        }}
        onSuccess={handleSuccess}
        onCloseLead={() => {
          router.push('/crm/leads')
        }}
        initialClosingStatus={closingStatus}
      />

      {/* Close Lead Dialog */}
      <CloseLeadDialog
        open={closeDialogOpen}
        onOpenChange={(open) => {
          setCloseDialogOpen(open)
          if (!open) {
            setPendingCloseStatus(null)
          }
        }}
        lead={lead}
        status={pendingCloseStatus || 'won'}
        onConfirm={handleCloseLeadConfirm}
      />
    </div>
  )
}

export default function LeadDetailPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <LeadDetailPageContent />
    </Suspense>
  )
}
