'use client'

import { ShieldCheck } from 'lucide-react'
import { ComingSoonBadge } from '@/components/coming-soon-badge'

export default function RBACSettingsPage() {
  return (
    <div className="flex flex-1 flex-col min-w-0 h-full overflow-hidden">
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold tracking-tight">RBAC</h1>
          <ComingSoonBadge />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="text-center py-12 text-muted-foreground">
          <ShieldCheck className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Role-Based Access Control coming soon</p>
          <p className="text-sm mt-2">Database schema and RLS policies are ready</p>
        </div>
      </div>
    </div>
  )
}

