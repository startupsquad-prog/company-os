'use client'

import { Suspense } from 'react'
import { PageLoader } from '@/components/ui/loader'
import { PageAccessHeader } from '@/components/page-access/page-access-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

function AttendanceSummaryPageContent() {
  return (
    <div className="flex flex-1 flex-col min-w-0 h-full overflow-hidden">
      <div className="flex items-center justify-between mb-3 flex-shrink-0">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Attendance Summary</h1>
          <p className="text-xs text-muted-foreground mt-0.5">View attendance reports</p>
        </div>
        <PageAccessHeader pagePath="/hr/attendance/summary" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Attendance Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Attendance summary reports coming soon</p>
        </CardContent>
      </Card>
    </div>
  )
}

export default function AttendanceSummaryPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <AttendanceSummaryPageContent />
    </Suspense>
  )
}


