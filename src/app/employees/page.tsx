'use client'

import { Suspense } from 'react'
import EmployeesPageContent from './components/employees-page-content'
import { PageLoader } from '@/components/ui/loader'

export default function EmployeesPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <EmployeesPageContent />
    </Suspense>
  )
}

