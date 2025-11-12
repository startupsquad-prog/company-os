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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { RainbowButton } from '@/components/ui/rainbow-button'
import { Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import type { InterviewFull, InterviewType, InterviewStatus } from '@/lib/types/recruitment'

interface InterviewDetailsModalProps {
  interview: InterviewFull | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onEdit?: (interview: InterviewFull) => void
  onDelete?: (interview: InterviewFull) => void
}

const typeConfig: Record<InterviewType, { label: string }> = {
  phone_screen: { label: 'Phone Screen' },
  technical: { label: 'Technical' },
  behavioral: { label: 'Behavioral' },
  panel: { label: 'Panel' },
  final: { label: 'Final' },
  other: { label: 'Other' },
}

const statusConfig: Record<InterviewStatus, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
  scheduled: { label: 'Scheduled', variant: 'outline' },
  in_progress: { label: 'In Progress', variant: 'default' },
  completed: { label: 'Completed', variant: 'default' },
  cancelled: { label: 'Cancelled', variant: 'destructive' },
  no_show: { label: 'No Show', variant: 'destructive' },
}

export function InterviewDetailsModal({
  interview,
  open,
  onOpenChange,
  onEdit,
  onDelete,
}: InterviewDetailsModalProps) {
  if (!interview) return null

  const candidate = interview.candidate
  const candidateName = candidate?.contact?.name || 'Unknown'
  const type = typeConfig[interview.interview_type] || { label: interview.interview_type }
  const status = statusConfig[interview.status] || { label: interview.status, variant: 'outline' as const }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle>{type.label} Interview</DialogTitle>
              <DialogDescription>{candidateName}</DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={status.variant}>{status.label}</Badge>
              <RainbowButton onClick={() => toast.info('AI Generate Email - Coming soon!')}>
                <Sparkles className="h-4 w-4" />
                <span className="ml-2 text-xs">AI Email</span>
              </RainbowButton>
              {onEdit && (
                <Button onClick={() => onEdit(interview)} size="sm" variant="outline">
                  Edit
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="evaluation">Evaluation</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Interview Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-muted-foreground">Type:</span>
                    <p className="text-sm font-medium">{type.label}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Status:</span>
                    <p className="text-sm font-medium">{status.label}</p>
                  </div>
                  {interview.scheduled_at && (
                    <div>
                      <span className="text-sm text-muted-foreground">Scheduled At:</span>
                      <p className="text-sm font-medium">
                        {format(new Date(interview.scheduled_at), 'MMM d, yyyy HH:mm')}
                      </p>
                    </div>
                  )}
                  {interview.duration_minutes && (
                    <div>
                      <span className="text-sm text-muted-foreground">Duration:</span>
                      <p className="text-sm font-medium">{interview.duration_minutes} minutes</p>
                    </div>
                  )}
                  {interview.location && (
                    <div className="col-span-2">
                      <span className="text-sm text-muted-foreground">Location:</span>
                      <p className="text-sm font-medium">{interview.location}</p>
                    </div>
                  )}
                </div>
                {interview.interviewers && interview.interviewers.length > 0 && (
                  <div>
                    <span className="text-sm text-muted-foreground">Interviewers:</span>
                    <div className="mt-1 space-y-1">
                      {interview.interviewers.map((interviewer, i) => (
                        <p key={i} className="text-sm">
                          {interviewer.first_name} {interviewer.last_name} ({interviewer.email})
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="evaluation" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Evaluation</CardTitle>
              </CardHeader>
              <CardContent>
                {interview.feedback_summary ? (
                  <p className="text-sm whitespace-pre-wrap">{interview.feedback_summary}</p>
                ) : (
                  <p className="text-sm text-muted-foreground">No evaluation available yet.</p>
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
                {interview.notes ? (
                  <p className="text-sm whitespace-pre-wrap">{interview.notes}</p>
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

