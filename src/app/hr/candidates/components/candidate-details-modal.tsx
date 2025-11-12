'use client'

import { useState, useEffect } from 'react'
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
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { format } from 'date-fns'
import { useRouter } from 'next/navigation'
import { ExternalLink, Calendar, Phone, FileText, Plus, Sparkles } from 'lucide-react'
import { RainbowButton } from '@/components/ui/rainbow-button'
import { toast } from 'sonner'
import type { CandidateFull, CandidateStatus, CandidateSource } from '@/lib/types/recruitment'
import { getDiceBearAvatar, getUserInitials } from '@/lib/utils/avatar'
import { createClient } from '@/lib/supabase/client'

interface CandidateDetailsModalProps {
  candidate: CandidateFull | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onEdit?: (candidate: CandidateFull) => void
  onDelete?: (candidate: CandidateFull) => void
}

const statusConfig: Record<CandidateStatus, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
  new: { label: 'New', variant: 'outline' },
  screening: { label: 'Screening', variant: 'default' },
  shortlisted: { label: 'Shortlisted', variant: 'default' },
  interviewing: { label: 'Interviewing', variant: 'secondary' },
  offered: { label: 'Offered', variant: 'secondary' },
  hired: { label: 'Hired', variant: 'default' },
  rejected: { label: 'Rejected', variant: 'destructive' },
  withdrawn: { label: 'Withdrawn', variant: 'destructive' },
}

const sourceConfig: Record<CandidateSource, { label: string }> = {
  website: { label: 'Website' },
  referral: { label: 'Referral' },
  linkedin: { label: 'LinkedIn' },
  indeed: { label: 'Indeed' },
  other: { label: 'Other' },
}

export function CandidateDetailsModal({
  candidate,
  open,
  onOpenChange,
  onEdit,
  onDelete,
}: CandidateDetailsModalProps) {
  const router = useRouter()
  const [applications, setApplications] = useState<any[]>([])
  const [interviews, setInterviews] = useState<any[]>([])
  const [calls, setCalls] = useState<any[]>([])
  const [evaluations, setEvaluations] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (candidate && open) {
      fetchRelatedData()
    }
  }, [candidate, open])

  const fetchRelatedData = async () => {
    if (!candidate) return

    setLoading(true)
    try {
      const supabase = createClient()
      
      // Fetch applications
      const { data: appsData } = await (supabase as any)
        .schema('ats')
        .from('applications')
        .select('*')
        .eq('candidate_id', candidate.id)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })

      // Fetch interviews
      const { data: interviewsData } = await (supabase as any)
        .schema('ats')
        .from('interviews')
        .select('*')
        .eq('candidate_id', candidate.id)
        .is('deleted_at', null)
        .order('scheduled_at', { ascending: false })

      // Fetch calls
      const { data: callsData } = await (supabase as any)
        .schema('ats')
        .from('calls')
        .select('*')
        .eq('candidate_id', candidate.id)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })

      // Fetch evaluations
      const { data: evaluationsData } = await (supabase as any)
        .schema('ats')
        .from('evaluations')
        .select('*')
        .eq('candidate_id', candidate.id)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })

      setApplications(appsData || [])
      setInterviews(interviewsData || [])
      setCalls(callsData || [])
      setEvaluations(evaluationsData || [])
    } catch (error) {
      console.error('Error fetching related data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!candidate) return null

  const contact = candidate.contact
  const contactName = contact?.name || 'Unknown'
  const contactEmail = contact?.email || ''
  const contactPhone = contact?.phone || ''
  const contactAvatarSeed = contactName !== 'Unknown' ? contactName : contactEmail || candidate.id
  const contactAvatarUrl = getDiceBearAvatar(contactAvatarSeed)
  const contactInitials = contactName !== 'Unknown' 
    ? getUserInitials(contactName.split(' ')[0], contactName.split(' ').slice(1).join(' '), contactEmail)
    : '?'

  const recruiter = candidate.recruiter
  const recruiterName = recruiter 
    ? `${recruiter.first_name || ''} ${recruiter.last_name || ''}`.trim() || recruiter.email || 'Unknown'
    : 'Not assigned'

  const status = statusConfig[candidate.status] || { label: candidate.status, variant: 'outline' as const }
  const source = candidate.source ? sourceConfig[candidate.source] : null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="!max-w-[calc(100vw-2rem)] sm:!max-w-4xl !max-h-[calc(100vh-2rem)] sm:!max-h-[90vh] flex flex-col !p-0 gap-0 !overflow-hidden w-[calc(100vw-2rem)] sm:w-auto"
      >
        <DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4 flex-shrink-0 border-b">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
              <Avatar className="h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0">
                <AvatarImage src={contactAvatarUrl} alt={contactName} />
                <AvatarFallback className="text-xs sm:text-sm">{contactInitials}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <DialogTitle className="flex flex-wrap items-center gap-2 text-sm sm:text-base md:text-lg">
                  <span className="truncate">{contactName}</span>
                  <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                    <Badge variant={status.variant} className="text-xs whitespace-nowrap">{status.label}</Badge>
                    {source && <Badge variant="outline" className="text-xs whitespace-nowrap">{source.label}</Badge>}
                  </div>
                </DialogTitle>
                <DialogDescription className="text-xs mt-0.5 sm:mt-1">
                  Candidate details and recruitment history
                </DialogDescription>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {onEdit && (
                <Button onClick={() => onEdit(candidate)} size="sm" variant="outline" className="flex-shrink-0 whitespace-nowrap">
                  Edit
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <Tabs defaultValue="overview" className="w-full h-full flex flex-col min-w-0">
            <div className="px-4 sm:px-6 pt-3 sm:pt-4 pb-2 flex-shrink-0 border-b">
              <TabsList className="w-full sm:w-auto grid grid-cols-6 sm:inline-flex">
                <TabsTrigger value="overview" className="text-xs sm:text-sm">Overview</TabsTrigger>
                <TabsTrigger value="applications" className="text-xs sm:text-sm">
                  Applications ({applications.length})
                </TabsTrigger>
                <TabsTrigger value="interviews" className="text-xs sm:text-sm">
                  Interviews ({interviews.length})
                </TabsTrigger>
                <TabsTrigger value="calls" className="text-xs sm:text-sm">
                  Calls ({calls.length})
                </TabsTrigger>
                <TabsTrigger value="evaluations" className="text-xs sm:text-sm">
                  Evaluations ({evaluations.length})
                </TabsTrigger>
                <TabsTrigger value="ai-insights" className="text-xs sm:text-sm">
                  <Sparkles className="h-3 w-3 sm:mr-1" />
                  <span className="hidden sm:inline">AI Insights</span>
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="flex-1 overflow-y-auto min-h-0 overflow-x-hidden px-4 sm:px-6 py-3 sm:py-4">
              <TabsContent value="overview" className="mt-0 space-y-3 sm:space-y-4">
                <div className="flex items-center justify-end mb-2">
                  <RainbowButton onClick={() => toast.info('AI Generate Summary - Coming soon!')}>
                    <Sparkles className="h-4 w-4" />
                    <span className="ml-2 text-xs">AI Summary</span>
                  </RainbowButton>
                </div>
                {/* Contact Information */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <Card className="min-w-0">
                    <CardHeader className="pb-2 sm:pb-3">
                      <CardTitle className="text-xs sm:text-sm">Contact Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <Avatar className="h-8 w-8 flex-shrink-0">
                          <AvatarImage src={contactAvatarUrl} alt={contactName} />
                          <AvatarFallback className="text-xs">{contactInitials}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col min-w-0 flex-1">
                          <span className="text-xs sm:text-sm font-medium truncate">{contactName}</span>
                          {contactPhone && (
                            <span className="text-xs text-muted-foreground truncate">{contactPhone}</span>
                          )}
                        </div>
                      </div>
                      {contactEmail && (
                        <p className="text-xs text-muted-foreground truncate break-all">{contactEmail}</p>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="min-w-0">
                    <CardHeader className="pb-2 sm:pb-3">
                      <CardTitle className="text-xs sm:text-sm">Recruiter</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xs sm:text-sm">{recruiterName}</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Candidate Details */}
                <Card className="min-w-0">
                  <CardHeader className="pb-2 sm:pb-3">
                    <CardTitle className="text-xs sm:text-sm">Candidate Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 sm:space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                      <div className="min-w-0">
                        <span className="text-xs sm:text-sm text-muted-foreground">Status:</span>
                        <span className="ml-2 text-xs sm:text-sm font-medium">{status.label}</span>
                      </div>
                      {source && (
                        <div className="min-w-0">
                          <span className="text-xs sm:text-sm text-muted-foreground">Source:</span>
                          <span className="ml-2 text-xs sm:text-sm font-medium">{source.label}</span>
                        </div>
                      )}
                      <div className="min-w-0">
                        <span className="text-xs sm:text-sm text-muted-foreground">Created:</span>
                        <span className="ml-2 text-xs sm:text-sm font-medium truncate block">
                          {format(new Date(candidate.created_at), 'MMM d, yyyy')}
                        </span>
                      </div>
                      {candidate.resume_url && (
                        <div className="min-w-0 sm:col-span-2">
                          <span className="text-xs sm:text-sm text-muted-foreground">Resume:</span>
                          <a href={candidate.resume_url} target="_blank" rel="noopener noreferrer" className="ml-2 text-xs sm:text-sm text-primary hover:underline break-all">
                            View Resume
                          </a>
                        </div>
                      )}
                      {candidate.cover_letter_url && (
                        <div className="min-w-0 sm:col-span-2">
                          <span className="text-xs sm:text-sm text-muted-foreground">Cover Letter:</span>
                          <a href={candidate.cover_letter_url} target="_blank" rel="noopener noreferrer" className="ml-2 text-xs sm:text-sm text-primary hover:underline break-all">
                            View Cover Letter
                          </a>
                        </div>
                      )}
                    </div>
                    {candidate.notes && (
                      <div className="min-w-0">
                        <span className="text-xs sm:text-sm text-muted-foreground block mb-1">Notes:</span>
                        <p className="text-xs sm:text-sm whitespace-pre-wrap break-words">{candidate.notes}</p>
                      </div>
                    )}
                    {candidate.tags && candidate.tags.length > 0 && (
                      <div className="min-w-0">
                        <span className="text-xs sm:text-sm text-muted-foreground block mb-1">Tags:</span>
                        <div className="flex flex-wrap gap-1">
                          {candidate.tags.map((tag, i) => (
                            <Badge key={i} variant="outline" className="text-xs">{tag}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="applications" className="mt-0 space-y-3 sm:space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {applications.length} application{applications.length !== 1 ? 's' : ''}
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      onOpenChange(false)
                      router.push(`/hr/applications?candidate_id=${candidate.id}`)
                    }}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    <span className="text-xs">New Application</span>
                  </Button>
                </div>
                {loading ? (
                  <p className="text-xs sm:text-sm text-muted-foreground">Loading applications...</p>
                ) : applications.length > 0 ? (
                  <div className="space-y-2">
                    {applications.map((app) => (
                      <Card 
                        key={app.id} 
                        className="min-w-0 cursor-pointer hover:bg-accent transition-colors"
                        onClick={() => {
                          onOpenChange(false)
                          router.push(`/hr/applications?application_id=${app.id}`)
                        }}
                      >
                        <CardContent className="pt-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-xs sm:text-sm font-medium truncate">
                                  {app.job_title || 'Application'}
                                </p>
                                <ExternalLink className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(app.created_at), 'MMM d, yyyy')}
                              </p>
                            </div>
                            <Badge variant="outline" className="ml-2 flex-shrink-0">{app.status}</Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-xs sm:text-sm text-muted-foreground mb-3">No applications found</p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        onOpenChange(false)
                        router.push(`/hr/applications?candidate_id=${candidate.id}`)
                      }}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Create Application
                    </Button>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="interviews" className="mt-0 space-y-3 sm:space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {interviews.length} interview{interviews.length !== 1 ? 's' : ''}
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      onOpenChange(false)
                      router.push(`/hr/interviews?candidate_id=${candidate.id}`)
                    }}
                  >
                    <Calendar className="h-3 w-3 mr-1" />
                    <span className="text-xs">Schedule Interview</span>
                  </Button>
                </div>
                {loading ? (
                  <p className="text-xs sm:text-sm text-muted-foreground">Loading interviews...</p>
                ) : interviews.length > 0 ? (
                  <div className="space-y-2">
                    {interviews.map((interview) => (
                      <Card 
                        key={interview.id} 
                        className="min-w-0 cursor-pointer hover:bg-accent transition-colors"
                        onClick={() => {
                          onOpenChange(false)
                          router.push(`/hr/interviews?interview_id=${interview.id}`)
                        }}
                      >
                        <CardContent className="pt-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                                <p className="text-xs sm:text-sm font-medium truncate">
                                  {interview.interview_type}
                                </p>
                                <ExternalLink className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {interview.scheduled_at 
                                  ? format(new Date(interview.scheduled_at), 'MMM d, yyyy HH:mm')
                                  : 'Not scheduled'}
                              </p>
                            </div>
                            <Badge variant="outline" className="ml-2 flex-shrink-0">{interview.status}</Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-xs sm:text-sm text-muted-foreground mb-3">No interviews found</p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        onOpenChange(false)
                        router.push(`/hr/interviews?candidate_id=${candidate.id}`)
                      }}
                    >
                      <Calendar className="h-3 w-3 mr-1" />
                      Schedule Interview
                    </Button>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="calls" className="mt-0 space-y-3 sm:space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {calls.length} call{calls.length !== 1 ? 's' : ''}
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      onOpenChange(false)
                      router.push(`/hr/calls?candidate_id=${candidate.id}`)
                    }}
                  >
                    <Phone className="h-3 w-3 mr-1" />
                    <span className="text-xs">Log Call</span>
                  </Button>
                </div>
                {loading ? (
                  <p className="text-xs sm:text-sm text-muted-foreground">Loading calls...</p>
                ) : calls.length > 0 ? (
                  <div className="space-y-2">
                    {calls.map((call) => (
                      <Card 
                        key={call.id} 
                        className="min-w-0 cursor-pointer hover:bg-accent transition-colors"
                        onClick={() => {
                          onOpenChange(false)
                          router.push(`/hr/calls?call_id=${call.id}`)
                        }}
                      >
                        <CardContent className="pt-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <Phone className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                                <p className="text-xs sm:text-sm font-medium truncate">
                                  {call.call_type}
                                </p>
                                <ExternalLink className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {call.call_date 
                                  ? format(new Date(call.call_date), 'MMM d, yyyy HH:mm')
                                  : format(new Date(call.created_at), 'MMM d, yyyy')}
                                {call.duration_minutes && ` • ${call.duration_minutes} min`}
                              </p>
                            </div>
                            <Badge variant="outline" className="ml-2 flex-shrink-0">{call.status}</Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-xs sm:text-sm text-muted-foreground mb-3">No calls found</p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        onOpenChange(false)
                        router.push(`/hr/calls?candidate_id=${candidate.id}`)
                      }}
                    >
                      <Phone className="h-3 w-3 mr-1" />
                      Log Call
                    </Button>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="evaluations" className="mt-0 space-y-3 sm:space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {evaluations.length} evaluation{evaluations.length !== 1 ? 's' : ''}
                  </p>
                </div>
                {loading ? (
                  <p className="text-xs sm:text-sm text-muted-foreground">Loading evaluations...</p>
                ) : evaluations.length > 0 ? (
                  <div className="space-y-2">
                    {evaluations.map((evaluation) => (
                      <Card 
                        key={evaluation.id} 
                        className="min-w-0 cursor-pointer hover:bg-accent transition-colors"
                        onClick={() => {
                          onOpenChange(false)
                          router.push(`/hr/evaluations?evaluation_id=${evaluation.id}`)
                        }}
                      >
                        <CardContent className="pt-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <FileText className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                                <p className="text-xs sm:text-sm font-medium truncate">
                                  Evaluation
                                </p>
                                <ExternalLink className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(evaluation.created_at), 'MMM d, yyyy')}
                                {evaluation.overall_rating && ` • Rating: ${evaluation.overall_rating}/5`}
                              </p>
                            </div>
                            <Badge variant="outline" className="ml-2 flex-shrink-0">{evaluation.recommendation}</Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs sm:text-sm text-muted-foreground">No evaluations found</p>
                )}
              </TabsContent>

              <TabsContent value="ai-insights" className="mt-0 space-y-3 sm:space-y-4">
                <Card className="min-w-0">
                  <CardHeader className="pb-2 sm:pb-3">
                    <CardTitle className="text-xs sm:text-sm flex items-center gap-2">
                      <Sparkles className="h-4 w-4" />
                      AI Candidate Insights
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-center py-8">
                      <Sparkles className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                      <p className="text-xs sm:text-sm text-muted-foreground mb-2">
                        AI Insights - Coming soon!
                      </p>
                      <p className="text-xs text-muted-foreground/70">
                        This will provide AI-powered analysis of the candidate's resume, interview performance, and overall fit.
                      </p>
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-4"
                        onClick={() => {
                          // TODO: Implement AI Candidate Insights
                          console.log('AI Candidate Insights for candidate:', candidate.id)
                        }}
                      >
                        <Sparkles className="h-3 w-3 mr-1" />
                        Generate AI Insights
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  )
}

