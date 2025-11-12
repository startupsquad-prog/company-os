'use client'

import { Suspense } from 'react'
import { PageLoader } from '@/components/ui/loader'
import { PageAccessHeader } from '@/components/page-access/page-access-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

function EmployeeReportsPageContent() {
  return (
    <div className="flex flex-1 flex-col min-w-0 h-full overflow-hidden">
      <div className="flex items-center justify-between mb-3 flex-shrink-0">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Employee Reports</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Generate employee reports</p>
        </div>
        <PageAccessHeader pagePath="/hr/employees/reports" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Employee Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Employee reporting functionality coming soon</p>
        </CardContent>
      </Card>
    </div>
  )
}

export default function EmployeeReportsPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <EmployeeReportsPageContent />
    </Suspense>
  )
}


