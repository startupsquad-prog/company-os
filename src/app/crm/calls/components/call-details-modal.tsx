'use client'

import { useState, useRef, useEffect } from 'react'
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
import { Star, Play, Pause, Volume2 } from 'lucide-react'
import { format } from 'date-fns'
import type { CallFull, CallType, CallStatus } from '@/lib/types/calls'
import { getDiceBearAvatar, getUserInitials } from '@/lib/utils/avatar'
import { cn } from '@/lib/utils'

interface CallDetailsModalProps {
  call: CallFull | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onEdit?: (call: CallFull) => void
  onDelete?: (call: CallFull) => void
}

const callTypeConfig: Record<CallType, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
  inbound: { label: 'Inbound', variant: 'default' },
  outbound: { label: 'Outbound', variant: 'secondary' },
  missed: { label: 'Missed', variant: 'destructive' },
}

const statusConfig: Record<CallStatus, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
  completed: { label: 'Completed', variant: 'default' },
  no_answer: { label: 'No Answer', variant: 'secondary' },
  busy: { label: 'Busy', variant: 'outline' },
  failed: { label: 'Failed', variant: 'destructive' },
  cancelled: { label: 'Cancelled', variant: 'destructive' },
}

// Audio Player Component
function AudioPlayer({ recordingUrl }: { recordingUrl: string | null }) {
  const [isPlaying, setIsPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    if (!recordingUrl) return

    // Create audio element when recordingUrl is available
    if (!audioRef.current) {
      audioRef.current = new Audio(recordingUrl)
    } else {
      audioRef.current.src = recordingUrl
    }

    const audio = audioRef.current

    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)
    const handleEnded = () => setIsPlaying(false)

    audio.addEventListener('play', handlePlay)
    audio.addEventListener('pause', handlePause)
    audio.addEventListener('ended', handleEnded)

    return () => {
      audio.removeEventListener('play', handlePlay)
      audio.removeEventListener('pause', handlePause)
      audio.removeEventListener('ended', handleEnded)
      // Clean up audio element
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [recordingUrl])

  if (!recordingUrl) {
    return (
      <div className="flex items-center justify-center p-8 border rounded-md bg-muted/50">
        <p className="text-sm text-muted-foreground">No recording available</p>
      </div>
    )
  }

  const handlePlayPause = () => {
    const audio = audioRef.current
    if (!audio) return

    if (isPlaying) {
      audio.pause()
    } else {
      audio.play().catch((error) => {
        console.error('Error playing audio:', error)
        setIsPlaying(false)
      })
    }
  }

  return (
    <Button
      onClick={handlePlayPause}
      variant="outline"
      size="sm"
      className="flex items-center gap-2 whitespace-nowrap flex-shrink-0"
    >
      {isPlaying ? (
        <>
          <Pause className="h-4 w-4 flex-shrink-0" />
          <span className="hidden sm:inline">Pause Recording</span>
          <span className="sm:hidden">Pause</span>
        </>
      ) : (
        <>
          <Play className="h-4 w-4 flex-shrink-0" />
          <span className="hidden sm:inline">Play Recording</span>
          <span className="sm:hidden">Play</span>
        </>
      )}
    </Button>
  )
}

// Star Rating Component
function StarRating({ rating, maxRating = 5, onRatingChange, readOnly = false }: {
  rating: number
  maxRating?: number
  onRatingChange?: (rating: number) => void
  readOnly?: boolean
}) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: maxRating }).map((_, i) => {
        const starValue = i + 1
        return (
          <button
            key={i}
            type="button"
            onClick={() => !readOnly && onRatingChange?.(starValue)}
            disabled={readOnly}
            className={cn(
              'transition-colors',
              readOnly ? 'cursor-default' : 'cursor-pointer hover:scale-110',
              starValue <= rating ? 'text-yellow-400' : 'text-muted-foreground'
            )}
          >
            <Star
              className={cn('h-5 w-5', starValue <= rating ? 'fill-current' : '')}
            />
          </button>
        )
      })}
      {!readOnly && (
        <span className="text-sm text-muted-foreground ml-2">{rating} / {maxRating}</span>
      )}
    </div>
  )
}

export function CallDetailsModal({
  call,
  open,
  onOpenChange,
  onEdit,
  onDelete,
}: CallDetailsModalProps) {
  if (!call) return null

  const callType = callTypeConfig[call.call_type] || { label: call.call_type, variant: 'outline' as const }
  const status = call.status ? statusConfig[call.status] : { label: 'Unknown', variant: 'outline' as const }
  
  const contact = call.contact || call.lead?.contact
  const contactName = contact?.name || 'Unknown'
  const contactEmail = contact?.email || ''
  const contactPhone = contact?.phone || call.phone_number || ''
  const contactAvatarSeed = contactName !== 'Unknown' ? contactName : contactEmail || call.id
  const contactAvatarUrl = getDiceBearAvatar(contactAvatarSeed)
  const contactInitials = contactName !== 'Unknown' 
    ? contactName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '?'

  const caller = call.caller
  const callerName = caller ? [caller.first_name, caller.last_name].filter(Boolean).join(' ') || caller.email || 'Unknown' : 'Unknown'
  const callerEmail = caller?.email || ''
  const callerPhone = caller?.phone || ''
  const callerAvatarSeed = callerName !== 'Unknown' ? callerName : callerEmail || call.caller_id || ''
  const callerAvatarUrl = caller?.avatar_url || getDiceBearAvatar(callerAvatarSeed)
  const callerInitials = getUserInitials(caller?.first_name, caller?.last_name, caller?.email)

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '—'
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  const transcription = call.meta?.transcription
  const aiFeedback = call.meta?.ai_feedback

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
                    <Badge variant={callType.variant} className="text-xs whitespace-nowrap">{callType.label}</Badge>
                    {call.status && <Badge variant={status.variant} className="text-xs whitespace-nowrap">{status.label}</Badge>}
                  </div>
                </DialogTitle>
                <DialogDescription className="text-xs mt-0.5 sm:mt-1">
                  Call details and analysis
                </DialogDescription>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {call.recording_url && (
                <AudioPlayer recordingUrl={call.recording_url} />
              )}
              {onEdit && (
                <Button onClick={() => onEdit(call)} size="sm" variant="outline" className="flex-shrink-0 whitespace-nowrap">
                  Edit
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <Tabs defaultValue="overview" className="w-full h-full flex flex-col min-w-0">
            <div className="px-4 sm:px-6 pt-3 sm:pt-4 pb-2 flex-shrink-0 border-b">
              <TabsList className="w-full sm:w-auto grid grid-cols-3 sm:inline-flex">
                <TabsTrigger value="overview" className="text-xs sm:text-sm">Overview</TabsTrigger>
                <TabsTrigger value="transcription" className="text-xs sm:text-sm">Transcription</TabsTrigger>
                <TabsTrigger value="ai-feedback" className="text-xs sm:text-sm">AI Feedback</TabsTrigger>
              </TabsList>
            </div>

            <div className="flex-1 overflow-y-auto min-h-0 overflow-x-hidden px-4 sm:px-6 py-3 sm:py-4">
              <TabsContent value="overview" className="mt-0 space-y-3 sm:space-y-4">

                {/* Call Information */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <Card className="min-w-0">
                    <CardHeader className="pb-2 sm:pb-3">
                      <CardTitle className="text-xs sm:text-sm">Client Name</CardTitle>
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
                      <CardTitle className="text-xs sm:text-sm">Employee Name</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {caller ? (
                        <>
                          <div className="flex items-center gap-2 min-w-0">
                            <Avatar className="h-8 w-8 flex-shrink-0">
                              <AvatarImage src={callerAvatarUrl} alt={callerName} />
                              <AvatarFallback className="text-xs">{callerInitials}</AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col min-w-0 flex-1">
                              <span className="text-xs sm:text-sm font-medium truncate">{callerName}</span>
                              {callerPhone && (
                                <span className="text-xs text-muted-foreground truncate">{callerPhone}</span>
                              )}
                            </div>
                          </div>
                          {callerEmail && (
                            <p className="text-xs text-muted-foreground truncate break-all">{callerEmail}</p>
                          )}
                        </>
                      ) : (
                        <p className="text-xs sm:text-sm text-muted-foreground">—</p>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Call Details */}
                <Card className="min-w-0">
                  <CardHeader className="pb-2 sm:pb-3">
                    <CardTitle className="text-xs sm:text-sm">Call Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 sm:space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                      <div className="min-w-0">
                        <span className="text-xs sm:text-sm text-muted-foreground">Duration:</span>
                        <span className="ml-2 text-xs sm:text-sm font-medium whitespace-nowrap">{formatDuration(call.duration_seconds)}</span>
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs sm:text-sm text-muted-foreground">Phone Number:</span>
                        <span className="ml-2 text-xs sm:text-sm font-medium truncate block">{call.phone_number || '—'}</span>
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs sm:text-sm text-muted-foreground">Started:</span>
                        <span className="ml-2 text-xs sm:text-sm font-medium truncate block">
                          {call.started_at ? format(new Date(call.started_at), 'MMM d, yyyy HH:mm') : '—'}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs sm:text-sm text-muted-foreground">Ended:</span>
                        <span className="ml-2 text-xs sm:text-sm font-medium truncate block">
                          {call.ended_at ? format(new Date(call.ended_at), 'MMM d, yyyy HH:mm') : '—'}
                        </span>
                      </div>
                      {call.outcome && (
                        <div className="min-w-0 sm:col-span-2">
                          <span className="text-xs sm:text-sm text-muted-foreground">Outcome:</span>
                          <span className="ml-2 text-xs sm:text-sm font-medium truncate block">{call.outcome}</span>
                        </div>
                      )}
                      {call.subject && (
                        <div className="min-w-0 sm:col-span-2">
                          <span className="text-xs sm:text-sm text-muted-foreground">Subject:</span>
                          <span className="ml-2 text-xs sm:text-sm font-medium break-words block">{call.subject}</span>
                        </div>
                      )}
                    </div>
                    {call.notes && (
                      <div className="min-w-0">
                        <span className="text-xs sm:text-sm text-muted-foreground block mb-1">Notes:</span>
                        <p className="text-xs sm:text-sm whitespace-pre-wrap break-words">{call.notes}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="transcription" className="mt-0 space-y-3 sm:space-y-4">
                <Card className="min-w-0">
                  <CardHeader className="pb-2 sm:pb-3">
                    <CardTitle className="text-xs sm:text-sm">Raw Transcription</CardTitle>
                  </CardHeader>
                  <CardContent className="max-h-[calc(100vh-400px)] sm:max-h-[500px] overflow-y-auto overflow-x-hidden">
                    {transcription?.raw ? (
                      <p className="text-xs sm:text-sm whitespace-pre-wrap break-words">{transcription.raw}</p>
                    ) : (
                      <p className="text-xs sm:text-sm text-muted-foreground">No raw transcription available</p>
                    )}
                  </CardContent>
                </Card>

                <Card className="min-w-0">
                  <CardHeader className="pb-2 sm:pb-3">
                    <CardTitle className="text-xs sm:text-sm">Conversational Format (AI Refined)</CardTitle>
                  </CardHeader>
                  <CardContent className="max-h-[calc(100vh-400px)] sm:max-h-[500px] overflow-y-auto overflow-x-hidden">
                    {transcription?.conversational ? (
                      <p className="text-xs sm:text-sm whitespace-pre-wrap break-words">{transcription.conversational}</p>
                    ) : (
                      <p className="text-xs sm:text-sm text-muted-foreground">No conversational transcription available</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="ai-feedback" className="mt-0 space-y-3 sm:space-y-4">
                {aiFeedback ? (
                  <>
                    {/* Ratings Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <Card className="min-w-0">
                        <CardHeader className="pb-2 sm:pb-3">
                          <CardTitle className="text-xs sm:text-sm">Satisfaction Rating</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <StarRating
                            rating={aiFeedback.satisfaction_rating || 0}
                            readOnly
                          />
                        </CardContent>
                      </Card>

                      <Card className="min-w-0">
                        <CardHeader className="pb-2 sm:pb-3">
                          <CardTitle className="text-xs sm:text-sm">Professionalism Rating</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <StarRating
                            rating={aiFeedback.professionalism_rating || 0}
                            readOnly
                          />
                        </CardContent>
                      </Card>

                      <Card className="min-w-0">
                        <CardHeader className="pb-2 sm:pb-3">
                          <CardTitle className="text-xs sm:text-sm">Responsiveness Rating</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <StarRating
                            rating={aiFeedback.responsiveness_rating || 0}
                            readOnly
                          />
                        </CardContent>
                      </Card>

                      <Card className="min-w-0">
                        <CardHeader className="pb-2 sm:pb-3">
                          <CardTitle className="text-xs sm:text-sm">Overall Rating</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <StarRating
                            rating={aiFeedback.overall_rating || 0}
                            readOnly
                          />
                        </CardContent>
                      </Card>
                    </div>

                    {/* Single Select Fields */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <Card className="min-w-0">
                        <CardHeader className="pb-2 sm:pb-3">
                          <CardTitle className="text-xs sm:text-sm">Call Quality</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <Badge variant="outline" className="truncate inline-block max-w-full">{aiFeedback.call_quality || '—'}</Badge>
                        </CardContent>
                      </Card>

                      <Card className="min-w-0">
                        <CardHeader className="pb-2 sm:pb-3">
                          <CardTitle className="text-xs sm:text-sm">Customer Interest</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <Badge variant="outline" className="truncate inline-block max-w-full">{aiFeedback.customer_interest || '—'}</Badge>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Sentiment and Details */}
                    {aiFeedback.sentiment && (
                      <Card className="min-w-0">
                        <CardHeader className="pb-2 sm:pb-3">
                          <CardTitle className="text-xs sm:text-sm">Sentiment</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <Badge variant="outline" className="truncate inline-block max-w-full">{aiFeedback.sentiment}</Badge>
                        </CardContent>
                      </Card>
                    )}

                    {/* Key Points */}
                    {aiFeedback.key_points && aiFeedback.key_points.length > 0 && (
                      <Card className="min-w-0">
                        <CardHeader className="pb-2 sm:pb-3">
                          <CardTitle className="text-xs sm:text-sm">Key Points</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="list-disc list-inside space-y-1 text-xs sm:text-sm break-words">
                            {aiFeedback.key_points.map((point, i) => (
                              <li key={i} className="break-words">{point}</li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    )}

                    {/* Action Items */}
                    {aiFeedback.action_items && aiFeedback.action_items.length > 0 && (
                      <Card className="min-w-0">
                        <CardHeader className="pb-2 sm:pb-3">
                          <CardTitle className="text-xs sm:text-sm">Action Items</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="list-disc list-inside space-y-1 text-xs sm:text-sm break-words">
                            {aiFeedback.action_items.map((item, i) => (
                              <li key={i} className="break-words">{item}</li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    )}

                    {/* Next Steps */}
                    {aiFeedback.next_steps && (
                      <Card className="min-w-0">
                        <CardHeader className="pb-2 sm:pb-3">
                          <CardTitle className="text-xs sm:text-sm">Next Steps</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-xs sm:text-sm whitespace-pre-wrap break-words">{aiFeedback.next_steps}</p>
                        </CardContent>
                      </Card>
                    )}
                  </>
                ) : (
                  <Card className="min-w-0">
                    <CardContent className="py-6 sm:py-8">
                      <p className="text-xs sm:text-sm text-muted-foreground text-center">
                        No AI feedback available for this call
                      </p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  )
}

