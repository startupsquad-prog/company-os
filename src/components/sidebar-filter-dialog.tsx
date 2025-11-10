'use client'

import * as React from 'react'
import { Check, Building2, Users, Building } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useMultiFilter } from '@/lib/state/use-multi-filter'
import { useVerticalScope } from '@/lib/state/use-vertical-scope'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

type Vertical = {
  id: string
  name: string
  code: string
}

type Department = {
  id: string
  name: string
}

interface SidebarFilterDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SidebarFilterDialog({ open, onOpenChange }: SidebarFilterDialogProps) {
  const supabase = createClient()
  const { verticalScope, setVerticalScope } = useVerticalScope()
  const {
    selectedVertical,
    selectedDepartment,
    selectedEnterprise,
    setSelectedVertical,
    setSelectedDepartment,
    setSelectedEnterprise,
  } = useMultiFilter()

  // Initialize with defaults if not set
  React.useEffect(() => {
    if (selectedEnterprise === null) {
      setSelectedEnterprise('company-os')
    }
    if (selectedVertical === null) {
      setSelectedVertical('all')
    }
    if (selectedDepartment === null) {
      setSelectedDepartment('all')
    }
  }, [selectedEnterprise, selectedVertical, selectedDepartment, setSelectedEnterprise, setSelectedVertical, setSelectedDepartment])

  const [verticals, setVerticals] = React.useState<Vertical[]>([])
  const [departments, setDepartments] = React.useState<Department[]>([])
  const [loading, setLoading] = React.useState(true)

  // Fetch verticals
  React.useEffect(() => {
    const fetchVerticals = async () => {
      const { data, error } = await supabase
        .from('core.verticals')
        .select('id, name, code')
        .eq('is_active', true)
        .order('name', { ascending: true })

      if (!error && data) {
        setVerticals([{ id: 'all', name: 'All Verticals', code: 'all' }, ...(data as any)])
      }
    }
    fetchVerticals()
  }, [supabase])

  // Fetch departments
  React.useEffect(() => {
    const fetchDepartments = async () => {
      const { data, error } = await supabase
        .from('core.departments')
        .select('id, name')
        .is('deleted_at', null)
        .order('name', { ascending: true })

      if (!error && data) {
        setDepartments([{ id: 'all', name: 'All Departments' }, ...(data as any)])
        setLoading(false)
      } else {
        setLoading(false)
      }
    }
    fetchDepartments()
  }, [supabase])

  // Sync vertical selection with vertical scope
  React.useEffect(() => {
    if (selectedVertical && selectedVertical !== 'all') {
      setVerticalScope(selectedVertical)
    } else if (selectedVertical === 'all') {
      setVerticalScope('all')
    }
  }, [selectedVertical, setVerticalScope])

  const handleVerticalSelect = (verticalId: string) => {
    if (verticalId === selectedVertical) {
      // Deselect if clicking the same option
      setSelectedVertical('all')
      setVerticalScope('all')
    } else {
      setSelectedVertical(verticalId)
      if (verticalId !== 'all') {
        setVerticalScope(verticalId)
      } else {
        setVerticalScope('all')
      }
    }
  }

  const handleDepartmentSelect = (departmentId: string) => {
    if (departmentId === selectedDepartment) {
      // Deselect if clicking the same option
      setSelectedDepartment('all')
    } else {
      setSelectedDepartment(departmentId)
    }
  }

  const handleEnterpriseSelect = () => {
    // Company OS Enterprise is always selected by default
    // This is just for visual consistency
    setSelectedEnterprise('company-os')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-[500px] max-h-[80vh] overflow-hidden flex flex-col p-0"
        style={{
          maxWidth: 'calc(100vw - 2rem)',
          maxHeight: 'calc(100vh - 5rem)',
        }}
      >
        <DialogHeader className="px-6 pt-6 pb-4 flex-shrink-0">
          <DialogTitle className="text-xl font-semibold">Filter View</DialogTitle>
          <DialogDescription>
            Choose your filters to customize what you see in the portal
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 px-6 overflow-y-auto">
          <div className="space-y-6 pb-6">
            {/* Company OS Enterprise - Always Selected */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold">Enterprise</h3>
              </div>
              <div className="space-y-2 pl-6">
                <button
                  type="button"
                  onClick={handleEnterpriseSelect}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors',
                    'hover:bg-accent hover:text-accent-foreground',
                    selectedEnterprise === 'company-os'
                      ? 'bg-accent text-accent-foreground'
                      : 'bg-transparent'
                  )}
                >
                  <div
                    className={cn(
                      'flex h-4 w-4 items-center justify-center rounded border-2 transition-colors',
                      selectedEnterprise === 'company-os'
                        ? 'border-primary bg-primary'
                        : 'border-muted-foreground/50'
                    )}
                  >
                    {selectedEnterprise === 'company-os' && (
                      <Check className="h-3 w-3 text-primary-foreground" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium">Company OS Enterprise</div>
                    <div className="text-xs text-muted-foreground">
                      Your default portal view
                    </div>
                  </div>
                </button>
              </div>
            </div>

            <Separator />

            {/* Vertical Filter */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Building className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold">Vertical</h3>
              </div>
              <div className="space-y-2 pl-6">
                {loading ? (
                  <div className="text-sm text-muted-foreground">Loading...</div>
                ) : (
                  verticals.map((vertical) => (
                    <button
                      key={vertical.id}
                      type="button"
                      onClick={() => handleVerticalSelect(vertical.id)}
                      className={cn(
                        'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors',
                        'hover:bg-accent hover:text-accent-foreground',
                        selectedVertical === vertical.id
                          ? 'bg-accent text-accent-foreground'
                          : 'bg-transparent'
                      )}
                    >
                      <div
                        className={cn(
                          'flex h-4 w-4 items-center justify-center rounded border-2 transition-colors',
                          selectedVertical === vertical.id
                            ? 'border-primary bg-primary'
                            : 'border-muted-foreground/50'
                        )}
                      >
                        {selectedVertical === vertical.id && (
                          <Check className="h-3 w-3 text-primary-foreground" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium">{vertical.name}</div>
                        {vertical.code !== 'all' && (
                          <div className="text-xs text-muted-foreground">{vertical.code}</div>
                        )}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>

            <Separator />

            {/* Department Filter */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold">Department</h3>
              </div>
              <div className="space-y-2 pl-6">
                {loading ? (
                  <div className="text-sm text-muted-foreground">Loading...</div>
                ) : (
                  departments.map((department) => (
                    <button
                      key={department.id}
                      type="button"
                      onClick={() => handleDepartmentSelect(department.id)}
                      className={cn(
                        'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors',
                        'hover:bg-accent hover:text-accent-foreground',
                        selectedDepartment === department.id
                          ? 'bg-accent text-accent-foreground'
                          : 'bg-transparent'
                      )}
                    >
                      <div
                        className={cn(
                          'flex h-4 w-4 items-center justify-center rounded border-2 transition-colors',
                          selectedDepartment === department.id
                            ? 'border-primary bg-primary'
                            : 'border-muted-foreground/50'
                        )}
                      >
                        {selectedDepartment === department.id && (
                          <Check className="h-3 w-3 text-primary-foreground" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium">{department.name}</div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 pb-6 pt-4 flex-shrink-0 border-t">
          <Button
            onClick={() => onOpenChange(false)}
            className="w-full"
            variant="default"
          >
            Apply Filters
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

