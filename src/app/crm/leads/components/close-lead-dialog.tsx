'use client'

import { useState, useRef } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Upload, X, Image as ImageIcon } from 'lucide-react'
import { toast } from 'sonner'
import confetti from 'canvas-confetti'
import type { LeadFull } from '@/lib/types/leads'

interface CloseLeadDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  lead: LeadFull | null
  status: 'won' | 'lost'
  onConfirm: (data: {
    amount?: number
    service?: string
    screenshot?: File
  }) => Promise<void>
}

export function CloseLeadDialog({
  open,
  onOpenChange,
  lead,
  status,
  onConfirm,
}: CloseLeadDialogProps) {
  const [amount, setAmount] = useState('')
  const [service, setService] = useState('')
  const [screenshot, setScreenshot] = useState<File | null>(null)
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const submitButtonRef = useRef<HTMLButtonElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please upload an image file')
        return
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB')
        return
      }
      setScreenshot(file)
      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setScreenshotPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemoveScreenshot = () => {
    setScreenshot(null)
    setScreenshotPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!amount.trim()) {
      toast.error('Amount is required')
      return
    }
    
    if (!service.trim()) {
      toast.error('Service is required')
      return
    }

    if (!screenshot) {
      toast.error('Screenshot is required')
      return
    }

    setIsSubmitting(true)
    try {
      // Fire confetti BEFORE the async operation completes
      // This ensures it fires immediately when button is clicked
      if (submitButtonRef.current) {
        const rect = submitButtonRef.current.getBoundingClientRect()
        const x = rect.left + rect.width / 2
        const y = rect.top + rect.height / 2

        // Fire confetti immediately
        confetti({
          particleCount: 100,
          spread: 70,
          origin: {
            x: x / window.innerWidth,
            y: y / window.innerHeight,
          },
          colors: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'],
        })
      }

      await onConfirm({
        amount: parseFloat(amount),
        service: service.trim(),
        screenshot,
      })

      // Reset form
      setAmount('')
      setService('')
      setScreenshot(null)
      setScreenshotPreview(null)
      onOpenChange(false)
    } catch (error) {
      console.error('Error closing lead:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      setAmount('')
      setService('')
      setScreenshot(null)
      setScreenshotPreview(null)
      onOpenChange(false)
    }
  }

  if (!lead) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {status === 'won' ? 'Mark Lead as Won' : 'Mark Lead as Lost'}
          </DialogTitle>
          <DialogDescription>
            Please provide the following information to close this lead.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* Amount */}
            <div className="grid gap-2">
              <Label htmlFor="amount">
                Amount <span className="text-destructive">*</span>
              </Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                required
                disabled={isSubmitting}
              />
            </div>

            {/* Service */}
            <div className="grid gap-2">
              <Label htmlFor="service">
                Service <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="service"
                value={service}
                onChange={(e) => setService(e.target.value)}
                placeholder="Describe the service provided..."
                rows={3}
                required
                disabled={isSubmitting}
              />
            </div>

            {/* Screenshot */}
            <div className="grid gap-2">
              <Label htmlFor="screenshot">
                Attach Screenshot <span className="text-destructive">*</span>
              </Label>
              {screenshotPreview ? (
                <div className="relative border rounded-md p-2">
                  <img
                    src={screenshotPreview}
                    alt="Screenshot preview"
                    className="w-full h-auto max-h-48 object-contain rounded"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute top-2 right-2 h-6 w-6 p-0"
                    onClick={handleRemoveScreenshot}
                    disabled={isSubmitting}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="border-2 border-dashed rounded-md p-6 text-center">
                  <input
                    ref={fileInputRef}
                    type="file"
                    id="screenshot"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                    disabled={isSubmitting}
                    required
                  />
                  <label
                    htmlFor="screenshot"
                    className="cursor-pointer flex flex-col items-center gap-2"
                  >
                    <ImageIcon className="h-8 w-8 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      Click to upload or drag and drop
                    </span>
                    <span className="text-xs text-muted-foreground">
                      PNG, JPG, GIF up to 5MB
                    </span>
                  </label>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              ref={submitButtonRef}
              type="submit"
              disabled={isSubmitting || !amount.trim() || !service.trim() || !screenshot}
            >
              {isSubmitting ? 'Submitting...' : status === 'won' ? 'Mark as Won' : 'Mark as Lost'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

