'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreHorizontal, Eye, Edit, Trash2 } from 'lucide-react'
import { format } from 'date-fns'
import type { LeadFull, LeadStatus } from '@/lib/types/leads'

interface LeadListProps {
  data: LeadFull[]
  onEdit?: (lead: LeadFull) => void
  onDelete?: (lead: LeadFull) => void
  onView?: (lead: LeadFull) => void
  onStatusChange?: (leadId: string, newStatus: string) => Promise<void>
  onAdd?: () => void
}

const statusConfig: Record<LeadStatus, { label: string; variant: any }> = {
  new: { label: 'New', variant: 'outline' },
  contacted: { label: 'Contacted', variant: 'default' },
  qualified: { label: 'Qualified', variant: 'default' },
  proposal: { label: 'Proposal', variant: 'secondary' },
  negotiation: { label: 'Negotiation', variant: 'secondary' },
  won: { label: 'Won', variant: 'default' },
  lost: { label: 'Lost', variant: 'destructive' },
}

export function LeadList({ data, onEdit, onDelete, onView, onStatusChange, onAdd }: LeadListProps) {
  return (
    <div className="space-y-2">
      {data.map((lead) => {
        const status = statusConfig[lead.status] || { label: lead.status, variant: 'outline' }

        return (
          <Card key={lead.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="flex-shrink-0">
                    {lead.owner && (
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={lead.owner.avatar_url || undefined} />
                        <AvatarFallback>
                          {`${lead.owner.first_name?.[0] || ''}${lead.owner.last_name?.[0] || ''}`.toUpperCase() ||
                            '?'}
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Button
                        variant="link"
                        className="h-auto p-0 font-medium text-left"
                        onClick={() => onView?.(lead)}
                      >
                        {lead.contact?.name || 'Unnamed Lead'}
                      </Button>
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      {lead.company?.name && <span>{lead.company.name}</span>}
                      {lead.source && (
                        <span className="capitalize">{lead.source.replace('_', ' ')}</span>
                      )}
                      {lead.value && (
                        <span className="font-medium">${lead.value.toLocaleString()}</span>
                      )}
                      {lead.last_interaction_at && (
                        <span>
                          Last activity: {format(new Date(lead.last_interaction_at), 'MMM d, yyyy')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex-shrink-0">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => onView?.(lead)}>
                        <Eye className="mr-2 h-4 w-4" />
                        View
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onEdit?.(lead)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => onDelete?.(lead)}
                        className="text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}

      {data.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-2">No leads found</p>
            <p className="text-sm text-muted-foreground mb-4">
              Try adjusting your filters or create a new lead
            </p>
            {onAdd && (
              <Button onClick={onAdd} variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                Create Lead
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
