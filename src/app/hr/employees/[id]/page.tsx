'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from '@/components/ui/breadcrumb'
import { ArrowLeft } from 'lucide-react'
import { PageLoader } from '@/components/ui/loader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

function EmployeeDetailPageContent() {
  const params = useParams()
  const router = useRouter()
  const employeeId = params.id as string
  const [employee, setEmployee] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchEmployee = async () => {
      try {
        const response = await fetch(`/api/employees/${employeeId}`)
        if (response.ok) {
          const data = await response.json()
          setEmployee(data)
        }
      } catch (error) {
        console.error('Error fetching employee:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchEmployee()
  }, [employeeId])

  if (loading) return <PageLoader />
  if (!employee) return null

  return (
    <div className="flex flex-1 flex-col min-w-0 h-full overflow-hidden">
      <div className="flex items-center gap-2 mb-4 flex-shrink-0">
        <Button variant="ghost" size="sm" onClick={() => router.push('/hr/employees')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/hr/employees">Employees</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbPage>{employee.profile?.first_name || 'Employee'}</BreadcrumbPage>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <Tabs defaultValue="overview" className="flex-1 flex flex-col min-h-0">
        <TabsList className="flex-shrink-0">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="contracts">Contracts</TabsTrigger>
          <TabsTrigger value="assets">Assets</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="flex-1 overflow-y-auto mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Employee Information</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">Employee details coming soon</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="flex-1 overflow-y-auto mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Documents</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Document management coming soon</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contracts" className="flex-1 overflow-y-auto mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Contracts</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Contract management coming soon</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assets" className="flex-1 overflow-y-auto mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Assets</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Asset management coming soon</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attendance" className="flex-1 overflow-y-auto mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Attendance History</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Attendance history coming soon</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default function EmployeeDetailPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <EmployeeDetailPageContent />
    </Suspense>
  )
}


