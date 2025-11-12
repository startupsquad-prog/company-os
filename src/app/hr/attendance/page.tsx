'use client'

import { useState, useEffect, Suspense } from 'react'
import { PageLoader } from '@/components/ui/loader'
import { PageAccessHeader } from '@/components/page-access/page-access-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Clock } from 'lucide-react'

function AttendancePageContent() {
  return (
    <div className="flex flex-1 flex-col min-w-0 h-full overflow-hidden">
      <div className="flex items-center justify-between mb-3 flex-shrink-0">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Attendance</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Track employee attendance</p>
        </div>
        <PageAccessHeader pagePath="/hr/attendance" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Attendance Tracking</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Attendance tracking functionality coming soon</p>
        </CardContent>
      </Card>
    </div>
  )
}

export default function AttendancePage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <AttendancePageContent />
    </Suspense>
  )
}


