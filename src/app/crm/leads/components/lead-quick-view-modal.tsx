'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { format } from 'date-fns'
import type { LeadFull, LeadStatus } from '@/lib/types/leads'
import { toast } from 'sonner'

interface LeadQuickViewModalProps {
  lead: LeadFull | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onStatusChange?: (leadId: string, newStatus: string) => void
}

const statusOptions: { label: string; value: LeadStatus }[] = [
  { label: 'New', value: 'new' },
  { label: 'Contacted', value: 'contacted' },
  { label: 'Qualified', value: 'qualified' },
  { label: 'Proposal', value: 'proposal' },
  { label: 'Negotiation', value: 'negotiation' },
  { label: 'Won', value: 'won' },
  { label: 'Lost', value: 'lost' },
]

export function LeadQuickViewModal({
  lead,
  open,
  onOpenChange,
  onStatusChange,
}: LeadQuickViewModalProps) {
  if (!lead) return null

  const statusConfig: Record<string, { label: string; variant: any }> = {
    new: { label: 'New', variant: 'outline' },
    contacted: { label: 'Contacted', variant: 'default' },
    qualified: { label: 'Qualified', variant: 'default' },
    proposal: { label: 'Proposal', variant: 'secondary' },
    negotiation: { label: 'Negotiation', variant: 'secondary' },
    won: { label: 'Won', variant: 'default' },
    lost: { label: 'Lost', variant: 'destructive' },
  }

  const status = statusConfig[lead.status] || { label: lead.status, variant: 'outline' }

  const handleStatusChange = async (newStatus: string) => {
    if (onStatusChange) {
      await onStatusChange(lead.id, newStatus)
      toast.success('Status updated')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{lead.contact?.name || 'Unnamed Lead'}</DialogTitle>
          <DialogDescription>Quick view and actions</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">Status</label>
            <Select value={lead.status} onValueChange={handleStatusChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Company</span>
              <span className="font-medium">{lead.company?.name || '—'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Owner</span>
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
                <span className="text-sm">—</span>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Value</span>
              <span className="font-medium">
                {lead.value ? `$${lead.value.toLocaleString()}` : '—'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Expected Close</span>
              <span className="text-sm">
                {lead.expected_close_date
                  ? format(new Date(lead.expected_close_date), 'MMM d, yyyy')
                  : '—'}
              </span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
