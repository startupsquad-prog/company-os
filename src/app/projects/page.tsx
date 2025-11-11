'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { ProjectCard } from './components/project-card'
import { ProjectForm } from './components/project-form'
import { ProjectDetailsModal } from './components/project-details-modal'
import { useUserRole } from '@/lib/hooks/useUserRole'
import { createClient } from '@/lib/supabase/client'
import type { ProjectFull, ProjectFormData } from '@/lib/types/projects'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'
import { useUser } from '@clerk/nextjs'
import { useVerticalScope } from '@/lib/state/use-vertical-scope'
import { PageLoader } from '@/components/ui/loader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'

function ProjectsPageContent() {
  const searchParams = useSearchParams()
  const { verticalScope } = useVerticalScope()
  const { role, isLoading: roleLoading } = useUserRole()
  const { user: clerkUser } = useUser()
  const [projects, setProjects] = useState<ProjectFull[]>([])
  const [loading, setLoading] = useState(true)
  const [initialLoading, setInitialLoading] = useState(true)
  const [selectedProject, setSelectedProject] = useState<ProjectFull | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<ProjectFull | null>(null)
  const [search, setSearch] = useState('')
  const [statusOptions, setStatusOptions] = useState<{ label: string; value: string }[]>([])
  const [categoryOptions, setCategoryOptions] = useState<{ label: string; value: string }[]>([])
  const [departmentOptions, setDepartmentOptions] = useState<{ label: string; value: string }[]>([])

  // Fetch projects
  const fetchProjects = useCallback(async () => {
    if (roleLoading || !role) return

    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: '1',
        pageSize: '100',
        view: 'grid',
        ...(search ? { search } : {}),
        ...(verticalScope && verticalScope !== 'all' ? { verticalId: verticalScope } : {}),
      })

      const response = await fetch(`/api/unified/projects?${params.toString()}`)
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData.error || `HTTP ${response.status}: ${response.statusText}`
        console.error('Projects API error:', errorMessage, errorData)
        throw new Error(errorMessage)
      }

      const result = await response.json()
      setProjects(result.data || [])
    } catch (error) {
      console.error('Error fetching projects:', error)
      toast.error('Failed to load projects')
    } finally {
      setLoading(false)
      setInitialLoading(false)
    }
  }, [roleLoading, role, search, verticalScope])

  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  // Fetch enum options
  useEffect(() => {
    async function fetchOptions() {
      try {
        const supabase = createClient()

        // Fetch status and category from enum_registry
        const { data: enums } = await (supabase as any)
          .from('enum_registry')
          .select('*')
          .in('category', ['project_status', 'project_category'])
          .order('order_no')

        if (enums) {
          const statusEnums = enums.filter((e: any) => e.category === 'project_status')
          const categoryEnums = enums.filter((e: any) => e.category === 'project_category')

          setStatusOptions(
            statusEnums.map((e: any) => ({
              label: e.label,
              value: e.key,
            }))
          )

          setCategoryOptions(
            categoryEnums.map((e: any) => ({
              label: e.label,
              value: e.key,
            }))
          )
        }

        // Fetch departments
        const { data: departments } = await (supabase as any)
          .from('departments')
          .select('id, name')
          .is('deleted_at', null)
          .order('name')

        if (departments) {
          setDepartmentOptions(
            departments.map((d: any) => ({
              label: d.name,
              value: d.id,
            }))
          )
        }
      } catch (error) {
        console.error('Error fetching options:', error)
      }
    }

    fetchOptions()
  }, [])

  // Handle project form submission
  const handleSubmitProject = useCallback(
    async (data: ProjectFormData) => {
      try {
        if (!clerkUser?.id) {
          toast.error('Please log in to create projects')
          throw new Error('Not authenticated')
        }

        // Get profile for Clerk user
        const profileResponse = await fetch(
          `/api/unified/users?search=${encodeURIComponent(clerkUser.emailAddresses[0]?.emailAddress || '')}`
        )
        const profileData = await profileResponse.json()
        const profile = profileData.data?.find(
          (u: any) => u.email === clerkUser.emailAddresses[0]?.emailAddress
        )

        if (!profile) {
          toast.error('User profile not found. Please contact support.')
          throw new Error('Profile not found')
        }

        if (editingProject) {
          // Update existing project
          const response = await fetch(`/api/unified/projects/${editingProject.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: data.name,
              description: data.description,
              category: data.category,
              status: data.status,
              start_date: data.start_date?.toISOString(),
              due_date: data.due_date?.toISOString(),
              department_id: data.department_id,
              vertical_key: data.vertical_key,
              updated_by: profile.id,
              members: data.members,
            }),
          })

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}))
            throw new Error(errorData.error || 'Failed to update project')
          }

          toast.success('Project updated')
        } else {
          // Create new project
          const response = await fetch('/api/unified/projects', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: data.name,
              description: data.description,
              category: data.category,
              status: data.status || 'planning',
              start_date: data.start_date?.toISOString(),
              due_date: data.due_date?.toISOString(),
              department_id: data.department_id,
              vertical_key: data.vertical_key,
              created_by: profile.id,
              updated_by: profile.id,
              members: data.members,
            }),
          })

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}))
            throw new Error(errorData.error || 'Failed to create project')
          }

          toast.success('Project created')
        }

        setFormOpen(false)
        setEditingProject(null)
        fetchProjects()
      } catch (error) {
        console.error('Error saving project:', error)
        toast.error(editingProject ? 'Failed to update project' : 'Failed to create project')
        throw error
      }
    },
    [editingProject, fetchProjects, clerkUser?.id]
  )

  const handleDeleteProject = async (project: ProjectFull) => {
    if (!confirm('Are you sure you want to delete this project?')) return

    try {
      const response = await fetch(`/api/unified/projects/${project.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to delete project')
      }

      toast.success('Project deleted')
      fetchProjects()
    } catch (error) {
      console.error('Error deleting project:', error)
      toast.error('Failed to delete project')
    }
  }

  if (roleLoading) {
    return <PageLoader />
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
          <p className="text-sm text-muted-foreground mt-1">List of your ongoing projects</p>
        </div>
        <Button
          onClick={() => {
            setEditingProject(null)
            setFormOpen(true)
          }}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          New Project
        </Button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <Input
          placeholder="Search projects..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {/* Projects Grid */}
      {initialLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="h-full">
              <CardContent className="p-6">
                <Skeleton className="h-6 w-3/4 mb-4" />
                <Skeleton className="h-4 w-1/2 mb-4" />
                <Skeleton className="h-2 w-full mb-4" />
                <div className="flex items-center justify-between">
                  <Skeleton className="h-8 w-20" />
                  <Skeleton className="h-6 w-16" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No projects found</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => {
              setEditingProject(null)
              setFormOpen(true)
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Your First Project
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onClick={() => {
                setSelectedProject(project)
                setDetailsOpen(true)
              }}
            />
          ))}
        </div>
      )}

      <ProjectDetailsModal
        project={selectedProject}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        onEdit={(project) => {
          setEditingProject(project)
          setDetailsOpen(false)
          setFormOpen(true)
        }}
        onDelete={handleDeleteProject}
      />

      <ProjectForm
        project={editingProject}
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open)
          if (!open) {
            setEditingProject(null)
          }
        }}
        onSubmit={handleSubmitProject}
        statusOptions={statusOptions}
        categoryOptions={categoryOptions}
        departmentOptions={departmentOptions}
      />
    </>
  )
}

export default function ProjectsPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <ProjectsPageContent />
    </Suspense>
  )
}

