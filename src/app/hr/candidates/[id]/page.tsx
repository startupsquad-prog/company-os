'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from '@/components/ui/breadcrumb'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { Edit, ArrowLeft, Phone, Calendar, FileText, ExternalLink } from 'lucide-react'
import type { CandidateFull } from '@/lib/types/recruitment'
import { getDiceBearAvatar, getUserInitials } from '@/lib/utils/avatar'
import { PageLoader } from '@/components/ui/loader'
import { CandidateForm } from '../components/candidate-form'
import { CandidateTopbarActions } from '../components/candidate-topbar-actions'
import { useUser } from '@clerk/nextjs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
  new: { label: 'New', variant: 'outline' },
  screening: { label: 'Screening', variant: 'default' },
  shortlisted: { label: 'Shortlisted', variant: 'default' },
  interviewing: { label: 'Interviewing', variant: 'secondary' },
  offered: { label: 'Offered', variant: 'secondary' },
  hired: { label: 'Hired', variant: 'default' },
  rejected: { label: 'Rejected', variant: 'destructive' },
  withdrawn: { label: 'Withdrawn', variant: 'destructive' },
}

function CandidateDetailPageContent() {
  const params = useParams()
  const router = useRouter()
  const { user } = useUser()
  const candidateId = params.id as string

  const [candidate, setCandidate] = useState<CandidateFull | null>(null)
  const [loading, setLoading] = useState(true)
  const [allCandidates, setAllCandidates] = useState<CandidateFull[]>([])
  const [updateFormOpen, setUpdateFormOpen] = useState(false)
  const [applications, setApplications] = useState<any[]>([])
  const [interviews, setInterviews] = useState<any[]>([])
  const [calls, setCalls] = useState<any[]>([])
  const [evaluations, setEvaluations] = useState<any[]>([])

  const fetchCandidate = useCallback(async () => {
    if (!candidateId) return

    try {
      setLoading(true)
      const response = await fetch(`/api/recruitment/candidates/${candidateId}`)

      if (!response.ok) {
        if (response.status === 404) {
          toast.error('Candidate not found')
          router.push('/hr/candidates')
          return
        }
        throw new Error('Failed to fetch candidate')
      }

      const result = await response.json()
      if (result.data) {
        setCandidate(result.data as CandidateFull)
      }
    } catch (error: any) {
      console.error('Error fetching candidate:', error)
      toast.error(error.message || 'Failed to load candidate')
      router.push('/hr/candidates')
    } finally {
      setLoading(false)
    }
  }, [candidateId, router])

  const fetchRelatedData = useCallback(async () => {
    if (!candidateId) return

    try {
      const [appsRes, intRes, callsRes, evalRes] = await Promise.all([
        fetch(`/api/recruitment/applications?candidate_id=${candidateId}`),
        fetch(`/api/recruitment/interviews?candidate_id=${candidateId}`),
        fetch(`/api/recruitment/calls?candidate_id=${candidateId}`),
        fetch(`/api/recruitment/evaluations?candidate_id=${candidateId}`),
      ])

      if (appsRes.ok) {
        const appsData = await appsRes.json()
        setApplications(appsData.applications || [])
      }
      if (intRes.ok) {
        const intData = await intRes.json()
        setInterviews(intData.interviews || [])
      }
      if (callsRes.ok) {
        const callsData = await callsRes.json()
        setCalls(callsData.calls || [])
      }
      if (evalRes.ok) {
        const evalData = await evalRes.json()
        setEvaluations(evalData.evaluations || [])
      }
    } catch (error) {
      console.error('Error fetching related data:', error)
    }
  }, [candidateId])

  useEffect(() => {
    fetchCandidate()
    fetchRelatedData()
  }, [fetchCandidate, fetchRelatedData])

  if (loading) {
    return <PageLoader />
  }

  if (!candidate) {
    return null
  }

  const contact = candidate.contact
  const contactName = contact?.name || 'Unnamed Candidate'
  const contactEmail = contact?.email || ''
  const contactPhone = contact?.phone || ''
  const avatarSeed = contactName !== 'Unnamed Candidate' ? contactName : contactEmail || candidate.id
  const avatarUrl = getDiceBearAvatar(avatarSeed)
  const initials = contactName !== 'Unnamed Candidate'
    ? getUserInitials(contactName.split(' ')[0], contactName.split(' ').slice(1).join(' '), contactEmail)
    : '?'
  
  const status = statusConfig[candidate.status] || { label: candidate.status, variant: 'outline' as const }

  return (
    <div className="flex flex-1 flex-col min-w-0 h-full overflow-hidden">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-4 flex-shrink-0">
        <Button variant="ghost" size="sm" onClick={() => router.push('/hr/candidates')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/hr/candidates">Candidates</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbPage>{contactName}</BreadcrumbPage>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between mb-4 flex-shrink-0">
        <div className="flex items-start gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={avatarUrl} alt={contactName} />
            <AvatarFallback className="text-lg">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-semibold">{contactName}</h1>
              <Badge variant={status.variant}>{status.label}</Badge>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              {contactEmail && (
                <span>{contactEmail}</span>
              )}
              {contactPhone && (
                <span>{contactPhone}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Topbar Actions */}
      <div className="mb-6 flex-shrink-0">
        <CandidateTopbarActions
          candidate={candidate}
          onEdit={() => setUpdateFormOpen(true)}
          onScheduleInterview={() => router.push(`/hr/interviews?candidate_id=${candidate.id}`)}
          onLogCall={() => router.push(`/hr/calls?candidate_id=${candidate.id}`)}
          onAddApplication={() => router.push(`/hr/applications?candidate_id=${candidate.id}`)}
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="flex-1 flex flex-col min-h-0">
        <TabsList className="flex-shrink-0">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="applications">Applications ({applications.length})</TabsTrigger>
          <TabsTrigger value="interviews">Interviews ({interviews.length})</TabsTrigger>
          <TabsTrigger value="calls">Calls ({calls.length})</TabsTrigger>
          <TabsTrigger value="evaluations">Evaluations ({evaluations.length})</TabsTrigger>
          <TabsTrigger value="resume">Resume</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="flex-1 overflow-y-auto mt-4">
          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Candidate Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-muted-foreground">Status</span>
                    <p className="text-sm font-medium">{status.label}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Source</span>
                    <p className="text-sm font-medium">{candidate.source || '—'}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Created</span>
                    <p className="text-sm font-medium">{format(new Date(candidate.created_at), 'MMM d, yyyy')}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Updated</span>
                    <p className="text-sm font-medium">{format(new Date(candidate.updated_at), 'MMM d, yyyy')}</p>
                  </div>
                </div>
                {candidate.tags && candidate.tags.length > 0 && (
                  <div>
                    <span className="text-sm text-muted-foreground">Tags</span>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {candidate.tags.map((tag, idx) => (
                        <Badge key={idx} variant="secondary">{tag}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="applications" className="flex-1 overflow-y-auto mt-4">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground">
              {applications.length} application{applications.length !== 1 ? 's' : ''}
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => router.push(`/hr/applications?candidate_id=${candidate.id}`)}
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              View All
            </Button>
          </div>
          <div className="space-y-2">
            {applications.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground mb-3">No applications found</p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => router.push(`/hr/applications?candidate_id=${candidate.id}`)}
                >
                  Create Application
                </Button>
              </div>
            ) : (
              applications.map((app) => (
                <Card 
                  key={app.id}
                  className="cursor-pointer hover:bg-accent transition-colors"
                  onClick={() => router.push(`/hr/applications?application_id=${app.id}`)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{app.job_title || 'Application'}</p>
                          <p className="text-sm text-muted-foreground">
                            {app.applied_at ? format(new Date(app.applied_at), 'MMM d, yyyy') : '—'}
                          </p>
                        </div>
                        <ExternalLink className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      </div>
                      <Badge className="ml-2 flex-shrink-0">{app.status}</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="interviews" className="flex-1 overflow-y-auto mt-4">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground">
              {interviews.length} interview{interviews.length !== 1 ? 's' : ''}
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => router.push(`/hr/interviews?candidate_id=${candidate.id}`)}
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              View All
            </Button>
          </div>
          <div className="space-y-2">
            {interviews.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground mb-3">No interviews found</p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => router.push(`/hr/interviews?candidate_id=${candidate.id}`)}
                >
                  Schedule Interview
                </Button>
              </div>
            ) : (
              interviews.map((int) => (
                <Card 
                  key={int.id}
                  className="cursor-pointer hover:bg-accent transition-colors"
                  onClick={() => router.push(`/hr/interviews?interview_id=${int.id}`)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{int.interview_type}</p>
                          <p className="text-sm text-muted-foreground">
                            {int.scheduled_at ? format(new Date(int.scheduled_at), 'MMM d, yyyy HH:mm') : '—'}
                          </p>
                        </div>
                        <ExternalLink className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      </div>
                      <Badge className="ml-2 flex-shrink-0">{int.status}</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="calls" className="flex-1 overflow-y-auto mt-4">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground">
              {calls.length} call{calls.length !== 1 ? 's' : ''}
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => router.push(`/hr/calls?candidate_id=${candidate.id}`)}
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              View All
            </Button>
          </div>
          <div className="space-y-2">
            {calls.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground mb-3">No calls found</p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => router.push(`/hr/calls?candidate_id=${candidate.id}`)}
                >
                  Log Call
                </Button>
              </div>
            ) : (
              calls.map((call) => (
                <Card 
                  key={call.id}
                  className="cursor-pointer hover:bg-accent transition-colors"
                  onClick={() => router.push(`/hr/calls?call_id=${call.id}`)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{call.call_type}</p>
                          <p className="text-sm text-muted-foreground">
                            {call.call_date ? format(new Date(call.call_date), 'MMM d, yyyy') : '—'}
                            {call.duration_minutes && ` • ${call.duration_minutes} min`}
                          </p>
                        </div>
                        <ExternalLink className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      </div>
                      <Badge className="ml-2 flex-shrink-0">{call.status}</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="evaluations" className="flex-1 overflow-y-auto mt-4">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground">
              {evaluations.length} evaluation{evaluations.length !== 1 ? 's' : ''}
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => router.push(`/hr/evaluations?candidate_id=${candidate.id}`)}
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              View All
            </Button>
          </div>
          <div className="space-y-2">
            {evaluations.length === 0 ? (
              <p className="text-sm text-muted-foreground">No evaluations found</p>
            ) : (
              evaluations.map((eval) => (
                <Card 
                  key={eval.id}
                  className="cursor-pointer hover:bg-accent transition-colors"
                  onClick={() => router.push(`/hr/evaluations?evaluation_id=${eval.id}`)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">Evaluation</p>
                          <p className="text-sm text-muted-foreground">
                            {eval.created_at ? format(new Date(eval.created_at), 'MMM d, yyyy') : '—'}
                            {eval.overall_rating && ` • Rating: ${eval.overall_rating}/5`}
                          </p>
                        </div>
                        <ExternalLink className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      </div>
                      <Badge className="ml-2 flex-shrink-0">{eval.recommendation}</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="resume" className="flex-1 overflow-y-auto mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Resume</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Resume upload functionality coming soon</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notes" className="flex-1 overflow-y-auto mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">{candidate.notes || 'No notes available'}</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <CandidateForm
        candidate={candidate}
        open={updateFormOpen}
        onOpenChange={setUpdateFormOpen}
        onSubmit={async (data) => {
          try {
            const response = await fetch(`/api/recruitment/candidates/${candidate.id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                ...data,
                updated_at: new Date().toISOString(),
              }),
            })

            if (!response.ok) {
              throw new Error('Failed to update candidate')
            }

            toast.success('Candidate updated successfully')
            await fetchCandidate()
            setUpdateFormOpen(false)
          } catch (error: any) {
            toast.error(error.message || 'Failed to update candidate')
          }
        }}
      />
    </div>
  )
}

export default function CandidateDetailPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <CandidateDetailPageContent />
    </Suspense>
  )
}


