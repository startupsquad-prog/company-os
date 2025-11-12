'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { format } from 'date-fns'
import { ExternalLink } from 'lucide-react'
import type { JobPortalFull, JobPortalStatus, JobPortalType } from '@/lib/types/recruitment'

interface JobPortalDetailsModalProps {
  portal: JobPortalFull | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onEdit?: (portal: JobPortalFull) => void
  onDelete?: (portal: JobPortalFull) => void
}

const statusConfig: Record<JobPortalStatus, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
  active: { label: 'Active', variant: 'default' },
  inactive: { label: 'Inactive', variant: 'outline' },
  expired: { label: 'Expired', variant: 'destructive' },
}

const typeConfig: Record<JobPortalType, { label: string }> = {
  job_board: { label: 'Job Board' },
  linkedin: { label: 'LinkedIn' },
  indeed: { label: 'Indeed' },
  naukri: { label: 'Naukri' },
  monster: { label: 'Monster' },
  glassdoor: { label: 'Glassdoor' },
  other: { label: 'Other' },
}

export function JobPortalDetailsModal({
  portal,
  open,
  onOpenChange,
  onEdit,
  onDelete,
}: JobPortalDetailsModalProps) {
  if (!portal) return null

  const status = statusConfig[portal.status] || { label: portal.status, variant: 'outline' as const }
  const type = portal.portal_type ? typeConfig[portal.portal_type] : null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle>{portal.name}</DialogTitle>
              <DialogDescription>
                {type ? type.label : 'Job Portal'}
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={status.variant}>{status.label}</Badge>
              {onEdit && (
                <Button onClick={() => onEdit(portal)} size="sm" variant="outline">
                  Edit
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="credentials">Credentials</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Portal Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-muted-foreground">Type:</span>
                    <p className="text-sm font-medium">{type ? type.label : '—'}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Status:</span>
                    <p className="text-sm font-medium">{status.label}</p>
                  </div>
                  {portal.url && (
                    <div className="col-span-2">
                      <span className="text-sm text-muted-foreground">URL:</span>
                      <div className="flex items-center gap-2">
                        <a
                          href={portal.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline flex items-center gap-1"
                        >
                          {portal.url}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </div>
                  )}
                  {portal.subscription && (
                    <div className="col-span-2">
                      <span className="text-sm text-muted-foreground">Subscription:</span>
                      <p className="text-sm font-medium">{portal.subscription.name}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-sm text-muted-foreground">Created:</span>
                    <p className="text-sm font-medium">{format(new Date(portal.created_at), 'MMM d, yyyy')}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Updated:</span>
                    <p className="text-sm font-medium">{format(new Date(portal.updated_at), 'MMM d, yyyy')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="credentials" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">API Credentials</CardTitle>
              </CardHeader>
              <CardContent>
                {portal.api_key || portal.api_secret ? (
                  <div className="space-y-2">
                    {portal.api_key && (
                      <div>
                        <span className="text-sm text-muted-foreground">API Key:</span>
                        <p className="text-sm font-mono bg-muted p-2 rounded">{portal.api_key}</p>
                      </div>
                    )}
                    {portal.api_secret && (
                      <div>
                        <span className="text-sm text-muted-foreground">API Secret:</span>
                        <p className="text-sm font-mono bg-muted p-2 rounded">{portal.api_secret}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No API credentials configured.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notes" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                {portal.notes ? (
                  <p className="text-sm whitespace-pre-wrap">{portal.notes}</p>
                ) : (
                  <p className="text-sm text-muted-foreground">No notes available.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

