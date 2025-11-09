"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import type { LeadFull, Interaction, StatusHistoryEntry } from "@/lib/types/leads"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { Edit, Trash2, ChevronLeft, ChevronRight } from "lucide-react"

interface LeadDetailsModalProps {
  lead: LeadFull | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onEdit?: (lead: LeadFull) => void
  onDelete?: (lead: LeadFull) => void
  allLeads?: LeadFull[]
  onLeadChange?: (lead: LeadFull) => void
}

export function LeadDetailsModal({
  lead,
  open,
  onOpenChange,
  onEdit,
  onDelete,
  allLeads = [],
  onLeadChange,
}: LeadDetailsModalProps) {
  const [interactions, setInteractions] = useState<Interaction[]>([])
  const [statusHistory, setStatusHistory] = useState<StatusHistoryEntry[]>([])
  const [loading, setLoading] = useState(false)

  const fetchData = useCallback(async () => {
    if (!lead) return

    try {
      setLoading(true)
      const supabase = createClient()

      // Fetch interactions
      const { data: interactionsData } = await supabase
        .from('interactions')
        .select(`
          *,
          created_by_profile:profiles(
            id,
            first_name,
            last_name,
            email,
            avatar_url
          )
        `)
        .eq('entity_type', 'lead')
        .eq('entity_id', lead.id)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })

      setInteractions(interactionsData || [])

      // Fetch status history
      const { data: historyData } = await supabase
        .from('status_history')
        .select(`
          *,
          created_by_profile:profiles(
            id,
            first_name,
            last_name,
            email
          )
        `)
        .eq('lead_id', lead.id)
        .order('created_at', { ascending: false })

      setStatusHistory(historyData || [])
    } catch (error) {
      console.error('Error fetching lead data:', error)
    } finally {
      setLoading(false)
    }
  }, [lead])

  useEffect(() => {
    if (open && lead) {
      fetchData()
    }
  }, [open, lead, fetchData])

  const currentIndex = allLeads.findIndex((l) => l.id === lead?.id)
  const hasPrevious = currentIndex > 0
  const hasNext = currentIndex < allLeads.length - 1

  const navigateLead = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && hasPrevious) {
      onLeadChange?.(allLeads[currentIndex - 1])
    } else if (direction === 'next' && hasNext) {
      onLeadChange?.(allLeads[currentIndex + 1])
    }
  }

  if (!lead) return null

  const statusConfig: Record<string, { label: string; variant: any }> = {
    new: { label: "New", variant: "outline" },
    contacted: { label: "Contacted", variant: "default" },
    qualified: { label: "Qualified", variant: "default" },
    proposal: { label: "Proposal", variant: "secondary" },
    negotiation: { label: "Negotiation", variant: "secondary" },
    won: { label: "Won", variant: "default" },
    lost: { label: "Lost", variant: "destructive" },
  }

  const status = statusConfig[lead.status] || { label: lead.status, variant: "outline" }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogTitle className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl font-semibold">
              {lead.contact?.name || 'Unnamed Lead'}
            </span>
            <Badge variant={status.variant}>{status.label}</Badge>
          </div>
          <div className="flex items-center gap-2">
            {allLeads.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigateLead('prev')}
                  disabled={!hasPrevious}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigateLead('next')}
                  disabled={!hasNext}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </>
            )}
            <Button variant="outline" size="sm" onClick={() => onEdit?.(lead)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => onDelete?.(lead)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>
        </DialogTitle>
        <DialogDescription>
          Lead details and activity history
        </DialogDescription>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Contact</h3>
                <div className="space-y-1">
                  <p className="font-medium">{lead.contact?.name || '—'}</p>
                  {lead.contact?.email && (
                    <p className="text-sm text-muted-foreground">{lead.contact.email}</p>
                  )}
                  {lead.contact?.phone && (
                    <p className="text-sm text-muted-foreground">{lead.contact.phone}</p>
                  )}
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Company</h3>
                <div className="space-y-1">
                  <p className="font-medium">{lead.company?.name || '—'}</p>
                  {lead.company?.industry && (
                    <p className="text-sm text-muted-foreground">{lead.company.industry}</p>
                  )}
                  {lead.company?.website && (
                    <a
                      href={lead.company.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline"
                    >
                      {lead.company.website}
                    </a>
                  )}
                </div>
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Owner</h3>
                {lead.owner ? (
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={lead.owner.avatar_url || undefined} />
                      <AvatarFallback>
                        {`${lead.owner.first_name?.[0] || ''}${lead.owner.last_name?.[0] || ''}`.toUpperCase() || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <span>
                      {`${lead.owner.first_name || ''} ${lead.owner.last_name || ''}`.trim() || lead.owner.email || 'Unknown'}
                    </span>
                  </div>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Source</h3>
                <Badge variant="outline">{lead.source || '—'}</Badge>
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-3 gap-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Value</h3>
                <p className="font-medium">
                  {lead.value ? `$${lead.value.toLocaleString()}` : '—'}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Probability</h3>
                <p className="font-medium">{lead.probability ? `${lead.probability}%` : '—'}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Expected Close</h3>
                <p className="font-medium">
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
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Notes</h3>
                  <p className="text-sm whitespace-pre-wrap">{lead.notes}</p>
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="activity" className="mt-4">
            <div className="space-y-4">
              {interactions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No interactions yet
                </p>
              ) : (
                interactions.map((interaction) => (
                  <div key={interaction.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline">{interaction.type}</Badge>
                          {interaction.subject && (
                            <span className="font-medium">{interaction.subject}</span>
                          )}
                        </div>
                        {interaction.notes && (
                          <p className="text-sm text-muted-foreground mb-2">{interaction.notes}</p>
                        )}
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          {interaction.created_by_profile && (
                            <span>
                              {`${interaction.created_by_profile.first_name || ''} ${interaction.created_by_profile.last_name || ''}`.trim() || interaction.created_by_profile.email}
                            </span>
                          )}
                          <span>{format(new Date(interaction.created_at), 'MMM d, yyyy h:mm a')}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="history" className="mt-4">
            <div className="space-y-4">
              {statusHistory.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No status history
                </p>
              ) : (
                statusHistory.map((entry) => (
                  <div key={entry.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline">{entry.status}</Badge>
                          {entry.previous_status && (
                            <span className="text-sm text-muted-foreground">
                              from {entry.previous_status}
                            </span>
                          )}
                        </div>
                        {entry.notes && (
                          <p className="text-sm text-muted-foreground mb-2">{entry.notes}</p>
                        )}
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          {entry.created_by_profile && (
                            <span>
                              {`${entry.created_by_profile.first_name || ''} ${entry.created_by_profile.last_name || ''}`.trim() || entry.created_by_profile.email}
                            </span>
                          )}
                          <span>{format(new Date(entry.created_at), 'MMM d, yyyy h:mm a')}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="notes" className="mt-4">
            <div className="space-y-4">
              {lead.notes ? (
                <div className="border rounded-lg p-4">
                  <p className="text-sm whitespace-pre-wrap">{lead.notes}</p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No notes added yet
                </p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

