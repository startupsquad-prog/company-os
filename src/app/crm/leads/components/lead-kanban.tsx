"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import type { LeadFull, LeadStatus } from "@/lib/types/leads"
import { format } from "date-fns"

interface LeadKanbanProps {
  data: LeadFull[]
  statusOptions?: Array<{ label: string; value: string }>
  onEdit?: (lead: LeadFull) => void
  onDelete?: (lead: LeadFull) => void
  onView?: (lead: LeadFull) => void
  onStatusChange?: (leadId: string, newStatus: string) => Promise<void>
  onAdd?: () => void
}

const statusOrder: LeadStatus[] = ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost']

const statusConfig: Record<LeadStatus, { label: string; color: string }> = {
  new: { label: "New", color: "bg-gray-100" },
  contacted: { label: "Contacted", color: "bg-blue-100" },
  qualified: { label: "Qualified", color: "bg-green-100" },
  proposal: { label: "Proposal", color: "bg-yellow-100" },
  negotiation: { label: "Negotiation", color: "bg-orange-100" },
  won: { label: "Won", color: "bg-green-200" },
  lost: { label: "Lost", color: "bg-red-100" },
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
  const [draggedLead, setDraggedLead] = useState<LeadFull | null>(null)

  // Group leads by status
  const leadsByStatus = statusOrder.reduce((acc, status) => {
    acc[status] = data.filter((lead) => lead.status === status)
    return acc
  }, {} as Record<LeadStatus, LeadFull[]>)

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
    <div className="flex gap-4 overflow-x-auto pb-4">
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
            <Card className="h-full">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${config.color}`} />
                    <h3 className="font-semibold">{config.label}</h3>
                    <Badge variant="secondary" className="ml-2">
                      {leads.length}
                    </Badge>
                  </div>
                  {onAdd && status === 'new' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={onAdd}
                      className="h-6 w-6 p-0"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-2 max-h-[calc(100vh-300px)] overflow-y-auto">
                {leads.map((lead) => (
                  <Card
                    key={lead.id}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    draggable
                    onDragStart={() => handleDragStart(lead)}
                    onClick={() => onView?.(lead)}
                  >
                    <CardContent className="p-3">
                      <div className="space-y-2">
                        <div>
                          <p className="font-medium text-sm">
                            {lead.contact?.name || 'Unnamed Lead'}
                          </p>
                          {lead.company?.name && (
                            <p className="text-xs text-muted-foreground">
                              {lead.company.name}
                            </p>
                          )}
                        </div>
                        
                        {lead.value && (
                          <p className="text-sm font-semibold">
                            ${lead.value.toLocaleString()}
                          </p>
                        )}
                        
                        <div className="flex items-center justify-between">
                          {lead.owner && (
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={lead.owner.avatar_url || undefined} />
                              <AvatarFallback className="text-xs">
                                {`${lead.owner.first_name?.[0] || ''}${lead.owner.last_name?.[0] || ''}`.toUpperCase() || '?'}
                              </AvatarFallback>
                            </Avatar>
                          )}
                          {lead.last_interaction_at && (
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(lead.last_interaction_at), 'MMM d')}
                            </span>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                {leads.length === 0 && (
                  <div className="text-center text-sm text-muted-foreground py-8">
                    <p>No leads in this stage</p>
                    {onAdd && status === 'new' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={onAdd}
                        className="mt-2"
                      >
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

