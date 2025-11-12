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
import type { JobRoleFull, JobRoleStatus } from '@/lib/types/recruitment'

interface JobRoleDetailsModalProps {
  role: JobRoleFull | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onEdit?: (role: JobRoleFull) => void
  onDelete?: (role: JobRoleFull) => void
}

const statusConfig: Record<JobRoleStatus, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
  active: { label: 'Active', variant: 'default' },
  inactive: { label: 'Inactive', variant: 'outline' },
  archived: { label: 'Archived', variant: 'destructive' },
}

export function JobRoleDetailsModal({
  role,
  open,
  onOpenChange,
  onEdit,
  onDelete,
}: JobRoleDetailsModalProps) {
  if (!role) return null

  const status = statusConfig[role.status] || { label: role.status, variant: 'outline' as const }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle>{role.title}</DialogTitle>
              <DialogDescription>
                {role.department || 'Job Role'}
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={status.variant}>{status.label}</Badge>
              {onEdit && (
                <Button onClick={() => onEdit(role)} size="sm" variant="outline">
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
                <CardTitle className="text-sm">Role Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-muted-foreground">Department:</span>
                    <p className="text-sm font-medium">{role.department || '—'}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Location:</span>
                    <p className="text-sm font-medium">{role.location || '—'}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Employment Type:</span>
                    <p className="text-sm font-medium">{role.employment_type || '—'}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Experience Required:</span>
                    <p className="text-sm font-medium">
                      {role.experience_required_years ? `${role.experience_required_years} years` : '—'}
                    </p>
                  </div>
                  {(role.salary_range_min || role.salary_range_max) && (
                    <div className="col-span-2">
                      <span className="text-sm text-muted-foreground">Salary Range:</span>
                      <p className="text-sm font-medium">
                        {role.currency || 'INR'} {role.salary_range_min || '—'} - {role.salary_range_max || '—'}
                      </p>
                    </div>
                  )}
                  <div>
                    <span className="text-sm text-muted-foreground">Active Listings:</span>
                    <p className="text-sm font-medium">{role.active_listings_count || 0}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Total Applications:</span>
                    <p className="text-sm font-medium">{role.total_applications_count || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="details" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">Description</CardTitle>
                  <RainbowButton onClick={() => toast.info('AI Enhance Description - Coming soon!')}>
                    <Sparkles className="h-4 w-4" />
                    <span className="ml-2 text-xs">AI Enhance</span>
                  </RainbowButton>
                </div>
              </CardHeader>
              <CardContent>
                {role.description ? (
                  <p className="text-sm whitespace-pre-wrap">{role.description}</p>
                ) : (
                  <p className="text-sm text-muted-foreground">No description available.</p>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Requirements</CardTitle>
              </CardHeader>
              <CardContent>
                {role.requirements ? (
                  <p className="text-sm whitespace-pre-wrap">{role.requirements}</p>
                ) : (
                  <p className="text-sm text-muted-foreground">No requirements specified.</p>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Responsibilities</CardTitle>
              </CardHeader>
              <CardContent>
                {role.responsibilities ? (
                  <p className="text-sm whitespace-pre-wrap">{role.responsibilities}</p>
                ) : (
                  <p className="text-sm text-muted-foreground">No responsibilities specified.</p>
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
                {role.notes ? (
                  <p className="text-sm whitespace-pre-wrap">{role.notes}</p>
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

