'use client'

import { ScrollArea } from '@/components/ui/scroll-area'
import { EmailContent } from './types'

interface EmailViewerContentProps {
  email: EmailContent | null
}

export function EmailViewerContent({ email }: EmailViewerContentProps) {
  if (!email) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground min-h-0">
        <div className="text-center">
          <p className="text-sm">No email selected</p>
          <p className="text-xs mt-1">Select an email from the list to view</p>
        </div>
      </div>
    )
  }

  return (
    <ScrollArea className="flex-1 min-h-0">
      <div className="px-6 py-4">
        <div className="prose prose-sm max-w-none dark:prose-invert">
          <div className="whitespace-pre-wrap text-sm leading-relaxed">
            {email.body}
          </div>
        </div>
        {email.attachments && email.attachments.length > 0 && (
          <div className="mt-6 pt-6 border-t">
            <div className="text-sm font-medium mb-2">Attachments</div>
            <div className="space-y-2">
              {email.attachments.map((attachment, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 p-2 rounded-md border hover:bg-accent cursor-pointer"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">
                      {attachment.name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {attachment.size}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </ScrollArea>
  )
}

