'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useUser } from '@clerk/nextjs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { X, ChevronRight, ChevronLeft, Send, Mail } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import type { LeadFull, LeadStatus } from '@/lib/types/leads'

interface LeadUpdateFormProps {
  lead: LeadFull | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
  onCloseLead?: () => void
  initialClosingStatus?: 'won' | 'lost' | null
}

type UpdateStep = 'question' | 'tags' | 'callback' | 'closing' | 'message'

const updateQuestions = [
  {
    id: 'discussion',
    question: 'What did you discuss?',
    options: [
      { value: 'pricing', label: 'Pricing' },
      { value: 'features', label: 'Features' },
      { value: 'timeline', label: 'Timeline' },
      { value: 'requirements', label: 'Requirements' },
      { value: 'follow_up', label: 'Follow-up needed' },
      { value: 'other', label: 'Other' },
    ],
  },
  {
    id: 'outcome',
    question: 'What was the outcome?',
    options: [
      { value: 'positive', label: 'Positive - Moving forward' },
      { value: 'neutral', label: 'Neutral - Need more info' },
      { value: 'concerns', label: 'Concerns raised' },
      { value: 'no_response', label: 'No response' },
      { value: 'not_interested', label: 'Not interested' },
    ],
  },
  {
    id: 'next_action',
    question: 'What is the next action?',
    options: [
      { value: 'call', label: 'Schedule a call' },
      { value: 'email', label: 'Send email' },
      { value: 'quote', label: 'Send quotation' },
      { value: 'demo', label: 'Schedule demo' },
      { value: 'wait', label: 'Wait for response' },
      { value: 'close', label: 'Close the lead' },
    ],
  },
]

const commonTags = ['Hot', 'Warm', 'Cold', 'VIP', 'Urgent', 'Follow-up', 'Quote Sent', 'Demo Scheduled']

export function LeadUpdateForm({
  lead,
  open,
  onOpenChange,
  onSuccess,
  onCloseLead,
  initialClosingStatus,
}: LeadUpdateFormProps) {
  const { user } = useUser()
  const [currentStep, setCurrentStep] = useState<UpdateStep>(initialClosingStatus ? 'closing' : 'question')
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [tags, setTags] = useState<string[]>([])
  const [customTag, setCustomTag] = useState('')
  const [callbackDate, setCallbackDate] = useState('')
  const [callbackTime, setCallbackTime] = useState('')
  const [notes, setNotes] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [isClosing, setIsClosing] = useState(!!initialClosingStatus)
  const [showMessageOptions, setShowMessageOptions] = useState(!!initialClosingStatus)
  const [whatsappTemplates, setWhatsappTemplates] = useState<any[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const [emailTemplates, setEmailTemplates] = useState<any[]>([])
  const [selectedEmailTemplate, setSelectedEmailTemplate] = useState<string>('')
  const [pendingClosingStatus, setPendingClosingStatus] = useState<'won' | 'lost' | null>(initialClosingStatus || null)
  
  const radioGroupRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Fetch templates when dialog opens (for closing step)
  useEffect(() => {
    if (open && (showMessageOptions || isClosing || initialClosingStatus)) {
      const fetchTemplates = async () => {
        try {
          const [whatsappResponse, emailResponse] = await Promise.all([
            fetch('/api/unified/message-templates?type=whatsapp&category=closing'),
            fetch('/api/unified/message-templates?type=email&category=closing'),
          ])

          if (whatsappResponse.ok) {
            const whatsappData = await whatsappResponse.json()
            setWhatsappTemplates(whatsappData.templates || [])
          }

          if (emailResponse.ok) {
            const emailData = await emailResponse.json()
            setEmailTemplates(emailData.templates || [])
          }
        } catch (error) {
          console.error('Error fetching templates:', error)
        }
      }

      fetchTemplates()
    }
  }, [open, showMessageOptions, isClosing, initialClosingStatus])

  useEffect(() => {
    if (open && initialClosingStatus) {
      // If opening with closing status, start at closing step
      setCurrentStep('closing')
      setIsClosing(true)
      setShowMessageOptions(true)
      setPendingClosingStatus(initialClosingStatus)
    } else if (!open) {
      // Reset form when dialog closes
      setCurrentStep('question')
      setCurrentQuestionIndex(0)
      setAnswers({})
      setTags([])
      setCustomTag('')
      setCallbackDate('')
      setCallbackTime('')
      setNotes('')
      setSelectedTags([])
      setIsClosing(false)
      setShowMessageOptions(false)
      setSelectedTemplate('')
      setSelectedEmailTemplate('')
      setPendingClosingStatus(null)
    }
  }, [open, initialClosingStatus])

  const handleAnswer = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }))
    
    // Check if user selected "Close the lead"
    if (questionId === 'next_action' && value === 'close') {
      setIsClosing(true)
    }
  }

  const handleSubmit = useCallback(async () => {
    if (!lead || !user) return

    try {
      // Create interaction
      const interactionData = {
        entity_type: 'lead',
        entity_id: lead.id,
        type: 'note',
        subject: updateQuestions.find((q) => q.id === 'discussion')?.question,
        notes: notes || Object.entries(answers).map(([key, value]) => {
          const question = updateQuestions.find((q) => q.id === key)
          return `${question?.question}: ${question?.options.find((o) => o.value === value)?.label || value}`
        }).join('\n'),
        outcome: answers.outcome || undefined,
        created_by: user.id,
        meta: {
          discussion: answers.discussion,
          next_action: answers.next_action,
          tags: selectedTags,
          callback_date: callbackDate ? `${callbackDate}${callbackTime ? ` ${callbackTime}` : ''}` : undefined,
        },
      }

      const interactionResponse = await fetch('/api/unified/interactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(interactionData),
      })

      if (!interactionResponse.ok) {
        throw new Error('Failed to create interaction')
      }

      // Update lead tags if any
      if (selectedTags.length > 0) {
        const currentTags = lead.tags || []
        const updatedTags = [...new Set([...currentTags, ...selectedTags])]
        
        await fetch(`/api/unified/leads/${lead.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tags: updatedTags }),
        })
      }

      // Update lead status if closing
      if (isClosing) {
        const closeStatus = answers.outcome === 'positive' ? 'won' : 'lost'
        await fetch(`/api/unified/leads/${lead.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: closeStatus }),
        })
      }

      toast.success('Update logged successfully')
      onSuccess?.()
      onOpenChange(false)
    } catch (error) {
      console.error('Error submitting update:', error)
      toast.error('Failed to log update')
    }
  }, [lead, user, notes, answers, selectedTags, callbackDate, callbackTime, isClosing, onSuccess, onOpenChange])

  const handleNext = useCallback(() => {
    const currentQuestion = updateQuestions[currentQuestionIndex]
    
    if (currentStep === 'question') {
      if (!answers[currentQuestion.id]) {
        toast.error('Please select an option')
        return
      }

      // Check if we should show closing step
      if (currentQuestion.id === 'next_action' && answers[currentQuestion.id] === 'close') {
        setCurrentStep('closing')
        return
      }

      // Move to next question or next step
      if (currentQuestionIndex < updateQuestions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1)
      } else {
        setCurrentStep('tags')
      }
    } else if (currentStep === 'tags') {
      setCurrentStep('callback')
    } else if (currentStep === 'callback') {
      handleSubmit()
    } else if (currentStep === 'closing') {
      setShowMessageOptions(true)
    }
  }, [currentStep, currentQuestionIndex, answers, handleSubmit])

  // Keyboard navigation
  useEffect(() => {
    if (!open) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault()
        if (currentStep === 'question' && radioGroupRef.current) {
          const radios = radioGroupRef.current.querySelectorAll<HTMLButtonElement>('button[role="radio"]')
          const currentIndex = Array.from(radios).findIndex((r) => r.getAttribute('aria-checked') === 'true')
          let nextIndex = currentIndex

          if (e.key === 'ArrowDown') {
            nextIndex = currentIndex < radios.length - 1 ? currentIndex + 1 : 0
          } else {
            nextIndex = currentIndex > 0 ? currentIndex - 1 : radios.length - 1
          }

          radios[nextIndex]?.click()
          radios[nextIndex]?.focus()
        }
      } else if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handleNext()
      } else if (e.key === 'Escape') {
        onOpenChange(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, currentStep, currentQuestionIndex, answers, onOpenChange, handleNext])

  // Auto-focus on input fields
  useEffect(() => {
    if (open) {
      if (currentStep === 'tags' && inputRef.current) {
        setTimeout(() => inputRef.current?.focus(), 100)
      } else if (currentStep === 'callback' && inputRef.current) {
        setTimeout(() => inputRef.current?.focus(), 100)
      } else if (currentStep === 'closing' && textareaRef.current) {
        setTimeout(() => textareaRef.current?.focus(), 100)
      }
    }
  }, [open, currentStep])

  const handlePrevious = () => {
    if (currentStep === 'tags') {
      setCurrentStep('question')
      setCurrentQuestionIndex(updateQuestions.length - 1)
    } else if (currentStep === 'callback') {
      setCurrentStep('tags')
    } else if (currentStep === 'closing') {
      setCurrentStep('question')
      setCurrentQuestionIndex(updateQuestions.length - 1)
      setIsClosing(false)
      setShowMessageOptions(false)
    }
  }

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    )
  }

  const addCustomTag = () => {
    if (customTag.trim() && !selectedTags.includes(customTag.trim())) {
      setSelectedTags((prev) => [...prev, customTag.trim()])
      setCustomTag('')
    }
  }


  const handleCloseLead = async (status: 'won' | 'lost') => {
    if (!lead) return

    try {
      await fetch(`/api/unified/leads/${lead.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })

      toast.success(`Lead marked as ${status === 'won' ? 'Won' : 'Lost'}`)
      onCloseLead?.()
      onSuccess?.()
      onOpenChange(false)
    } catch (error) {
      console.error('Error closing lead:', error)
      toast.error('Failed to close lead')
    }
  }

  // Replace template variables with actual values
  const replaceTemplateVariables = (template: string, lead: LeadFull): string => {
    if (!template || !lead) return template
    
    return template
      .replace(/\{\{lead_name\}\}/g, lead.contact?.name || '')
      .replace(/\{\{company_name\}\}/g, lead.company?.name || '')
      .replace(/\{\{value\}\}/g, lead.value ? `$${lead.value.toLocaleString()}` : '')
      .replace(/\{\{status\}\}/g, lead.status || '')
      .replace(/\{\{source\}\}/g, lead.source || '')
  }

  const handleSendWhatsApp = () => {
    if (!lead?.contact?.phone) {
      toast.error('Phone number not available')
      return
    }
    
    const phone = lead.contact.phone.replace(/\D/g, '')
    let message = ''
    
    // Use selected template if available
    if (selectedTemplate) {
      const template = whatsappTemplates.find((t) => t.id === selectedTemplate)
      if (template) {
        message = replaceTemplateVariables(template.content, lead)
      }
    }
    
    // Open WhatsApp with phone number and message
    const url = message
      ? `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
      : `https://wa.me/${phone}`
    window.open(url, '_blank')
  }

  const handleSendEmail = () => {
    if (!lead?.contact?.email) {
      toast.error('Email not available')
      return
    }
    
    let subject = ''
    let body = ''
    
    // Use selected template if available
    if (selectedEmailTemplate) {
      const template = emailTemplates.find((t) => t.id === selectedEmailTemplate)
      if (template) {
        subject = template.subject ? replaceTemplateVariables(template.subject, lead) : ''
        body = replaceTemplateVariables(template.content, lead)
      }
    }
    
    // Open email client
    const mailtoLink = `mailto:${lead.contact.email}${subject ? `?subject=${encodeURIComponent(subject)}` : ''}${body ? `${subject ? '&' : '?'}body=${encodeURIComponent(body)}` : ''}`
    window.location.href = mailtoLink
  }

  if (!lead) return null

  const currentQuestion = updateQuestions[currentQuestionIndex]
  const canProceed = currentStep === 'question' ? answers[currentQuestion.id] : true

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isClosing ? 'Close Lead' : 'Log Update'}
          </DialogTitle>
          <DialogDescription>
            {isClosing
              ? 'Add final notes and send a message if needed'
              : 'Quickly log what happened with this lead'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Question Step */}
          {currentStep === 'question' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                <span>Step {currentQuestionIndex + 1} of {updateQuestions.length}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onOpenChange(false)}
                  className="h-6 px-2"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-3">
                <Label className="text-base font-medium">{currentQuestion.question}</Label>
                <RadioGroup
                  ref={radioGroupRef}
                  value={answers[currentQuestion.id] || ''}
                  onValueChange={(value) => handleAnswer(currentQuestion.id, value)}
                  className="space-y-2"
                >
                  {currentQuestion.options.map((option) => (
                    <div key={option.value} className="flex items-center space-x-2">
                      <RadioGroupItem value={option.value} id={option.value} />
                      <Label
                        htmlFor={option.value}
                        className="flex-1 cursor-pointer font-normal py-2 px-3 rounded-md hover:bg-muted transition-colors"
                      >
                        {option.label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            </div>
          )}

          {/* Tags Step */}
          {currentStep === 'tags' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium">Add Tags (Optional)</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onOpenChange(false)}
                  className="h-6 px-2"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex flex-wrap gap-2">
                {commonTags.map((tag) => (
                  <Badge
                    key={tag}
                    variant={selectedTags.includes(tag) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => toggleTag(tag)}
                  >
                    {tag}
                    {selectedTags.includes(tag) && <X className="ml-1 h-3 w-3" />}
                  </Badge>
                ))}
              </div>

              <div className="flex gap-2">
                <Input
                  ref={inputRef}
                  placeholder="Add custom tag"
                  value={customTag}
                  onChange={(e) => setCustomTag(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addCustomTag()
                    }
                  }}
                />
                <Button onClick={addCustomTag} size="sm">
                  Add
                </Button>
              </div>
            </div>
          )}

          {/* Callback Step */}
          {currentStep === 'callback' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium">Next Callback (Optional)</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onOpenChange(false)}
                  className="h-6 px-2"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="callback-date">Date</Label>
                  <Input
                    ref={inputRef}
                    id="callback-date"
                    type="date"
                    value={callbackDate}
                    onChange={(e) => setCallbackDate(e.target.value)}
                    min={format(new Date(), 'yyyy-MM-dd')}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="callback-time">Time</Label>
                  <Input
                    id="callback-time"
                    type="time"
                    value={callbackTime}
                    onChange={(e) => setCallbackTime(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Additional Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Add any additional notes..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}

          {/* Closing Step */}
          {currentStep === 'closing' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium">Closing Notes</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onOpenChange(false)}
                  className="h-6 px-2"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-2">
                <Label htmlFor="closing-notes">Final Notes</Label>
                <Textarea
                  ref={textareaRef}
                  id="closing-notes"
                  placeholder="Add closing notes..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                />
              </div>

              {showMessageOptions && (
                <div className="space-y-3 pt-4 border-t">
                  <Label className="text-sm font-medium">Send Message (Optional)</Label>
                  
                  {lead.contact?.phone && whatsappTemplates.length > 0 && (
                    <div className="space-y-2">
                      <Label htmlFor="whatsapp-template" className="text-xs">WhatsApp Template</Label>
                      <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                        <SelectTrigger id="whatsapp-template">
                          <SelectValue placeholder="Select template (optional)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">None</SelectItem>
                          {whatsappTemplates.map((template) => (
                            <SelectItem key={template.id} value={template.id}>
                              {template.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        variant="outline"
                        onClick={handleSendWhatsApp}
                        className="w-full"
                      >
                        <Send className="mr-2 h-4 w-4" />
                        Send WhatsApp
                      </Button>
                    </div>
                  )}

                  {lead.contact?.email && emailTemplates.length > 0 && (
                    <div className="space-y-2">
                      <Label htmlFor="email-template" className="text-xs">Email Template</Label>
                      <Select value={selectedEmailTemplate} onValueChange={setSelectedEmailTemplate}>
                        <SelectTrigger id="email-template">
                          <SelectValue placeholder="Select template (optional)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">None</SelectItem>
                          {emailTemplates.map((template) => (
                            <SelectItem key={template.id} value={template.id}>
                              {template.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        variant="outline"
                        onClick={handleSendEmail}
                        className="w-full"
                      >
                        <Mail className="mr-2 h-4 w-4" />
                        Send Email
                      </Button>
                    </div>
                  )}

                  {(!lead.contact?.phone || whatsappTemplates.length === 0) && 
                   (!lead.contact?.email || emailTemplates.length === 0) && (
                    <p className="text-xs text-muted-foreground">
                      No templates available. You can still close the lead.
                    </p>
                  )}
                </div>
              )}

              <div className="flex gap-2 pt-4 border-t">
                {pendingClosingStatus ? (
                  <Button
                    variant={pendingClosingStatus === 'won' ? 'default' : 'destructive'}
                    onClick={() => handleCloseLead(pendingClosingStatus)}
                    className="flex-1"
                  >
                    Mark as {pendingClosingStatus === 'won' ? 'Won' : 'Lost'}
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="default"
                      onClick={() => handleCloseLead('won')}
                      className="flex-1"
                    >
                      Mark as Won
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => handleCloseLead('lost')}
                      className="flex-1"
                    >
                      Mark as Lost
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          {currentStep !== 'closing' && (
            <div className="flex justify-between pt-4 border-t">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentStep === 'question' && currentQuestionIndex === 0}
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                Previous
              </Button>
              <Button onClick={handleNext} disabled={!canProceed}>
                {currentStep === 'callback' ? 'Submit' : 'Next'}
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

