'use client'

import { FileText } from 'lucide-react'

export function DocumentTable() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
        <h3 className="text-lg font-semibold mb-2">Documents feature coming soon</h3>
        <p className="text-sm text-muted-foreground">
          Document management functionality will be available in a future update.
        </p>
      </div>
    </div>
  )
}

