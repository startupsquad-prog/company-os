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
import { RainbowButton } from '@/components/ui/rainbow-button'
import { Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { ExternalLink } from 'lucide-react'
import type { JobListingFull, JobListingStatus } from '@/lib/types/recruitment'

interface JobListingDetailsModalProps {
  listing: JobListingFull | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onEdit?: (listing: JobListingFull) => void
  onDelete?: (listing: JobListingFull) => void
}

const statusConfig: Record<JobListingStatus, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
  draft: { label: 'Draft', variant: 'outline' },
  active: { label: 'Active', variant: 'default' },
  paused: { label: 'Paused', variant: 'secondary' },
  closed: { label: 'Closed', variant: 'destructive' },
  expired: { label: 'Expired', variant: 'destructive' },
}

export function JobListingDetailsModal({
  listing,
  open,
  onOpenChange,
  onEdit,
  onDelete,
}: JobListingDetailsModalProps) {
  if (!listing) return null

  const status = statusConfig[listing.status] || { label: listing.status, variant: 'outline' as const }
  const role = listing.job_role
  const portal = listing.job_portal

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle>{role?.title || 'Job Listing'}</DialogTitle>
              <DialogDescription>
                {portal?.name || 'Job Portal'}
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={status.variant}>{status.label}</Badge>
              {onEdit && (
                <Button onClick={() => onEdit(listing)} size="sm" variant="outline">
                  Edit
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Listing Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-muted-foreground">Job Role:</span>
                    <p className="text-sm font-medium">{role?.title || '—'}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Portal:</span>
                    <p className="text-sm font-medium">{portal?.name || '—'}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Status:</span>
                    <p className="text-sm font-medium">{status.label}</p>
                  </div>
                  {listing.external_job_id && (
                    <div>
                      <span className="text-sm text-muted-foreground">External ID:</span>
                      <p className="text-sm font-medium">{listing.external_job_id}</p>
                    </div>
                  )}
                  {listing.posted_at && (
                    <div>
                      <span className="text-sm text-muted-foreground">Posted:</span>
                      <p className="text-sm font-medium">{format(new Date(listing.posted_at), 'MMM d, yyyy HH:mm')}</p>
                    </div>
                  )}
                  {listing.expires_at && (
                    <div>
                      <span className="text-sm text-muted-foreground">Expires:</span>
                      <p className="text-sm font-medium">{format(new Date(listing.expires_at), 'MMM d, yyyy HH:mm')}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-sm text-muted-foreground">Views:</span>
                    <p className="text-sm font-medium">{listing.views_count || 0}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Applications:</span>
                    <p className="text-sm font-medium">{listing.applications_count || 0}</p>
                  </div>
                  {listing.listing_url && (
                    <div className="col-span-2">
                      <span className="text-sm text-muted-foreground">Listing URL:</span>
                      <div className="flex items-center gap-2">
                        <a
                          href={listing.listing_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline flex items-center gap-1"
                        >
                          {listing.listing_url}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="details" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">Custom Description</CardTitle>
                  <RainbowButton onClick={() => toast.info('AI Generate Content - Coming soon!')}>
                    <Sparkles className="h-4 w-4" />
                    <span className="ml-2 text-xs">AI Generate</span>
                  </RainbowButton>
                </div>
              </CardHeader>
              <CardContent>
                {listing.custom_description ? (
                  <p className="text-sm whitespace-pre-wrap">{listing.custom_description}</p>
                ) : (
                  <p className="text-sm text-muted-foreground">No custom description. Using job role description.</p>
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
                {listing.notes ? (
                  <p className="text-sm whitespace-pre-wrap">{listing.notes}</p>
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

