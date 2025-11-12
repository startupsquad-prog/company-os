'use client'

import * as React from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Image from 'next/image'
import { ChevronsUpDown, LayoutDashboard, TrendingUp, UserCog, UserCheck, ShoppingCart, GraduationCap, BookOpen, Package, Bot, Check, Clock, Briefcase, Scale, Shield, User, Crown, Box, BarChart3, Lock } from 'lucide-react'
import { useGroupScope } from '@/lib/state/use-group-scope'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

interface NavGroup {
  label: string
  items: any[]
}

interface Module {
  id: string
  name: string
  description: string
  icon: LucideIcon
  groupLabel?: string
  defaultRoute?: string
}

// Module definitions with default routes
const OK_MODULES: Module[] = [
  {
    id: 'crm',
    name: 'OK CRM',
    description: 'Customer Relationship Management',
    icon: TrendingUp,
    groupLabel: 'Sales',
    defaultRoute: '/crm/leads',
  },
  {
    id: 'hr',
    name: 'OK HR',
    description: 'Human Resources & Recruitment',
    icon: UserCog,
    groupLabel: 'Recruitment',
    defaultRoute: '/hr/dashboard',
  },
  {
    id: 'ops',
    name: 'OK Ops',
    description: 'Operations & Order Management',
    icon: ShoppingCart,
    groupLabel: 'Operations',
    defaultRoute: '/ops',
  },
  {
    id: 'train',
    name: 'OK Train',
    description: 'Training & Development',
    icon: GraduationCap,
    groupLabel: 'Common Modules',
    defaultRoute: '/knowledge/articles',
  },
  {
    id: 'books',
    name: 'OK Books',
    description: 'Accounting & Finance',
    icon: BookOpen,
    groupLabel: 'Common Modules',
    defaultRoute: '/knowledge/docs',
  },
  {
    id: 'orders',
    name: 'OK Orders',
    description: 'Order Processing & Fulfillment',
    icon: Package,
    groupLabel: 'Operations',
    defaultRoute: '/ops',
  },
  {
    id: 'agents',
    name: 'OK Agents',
    description: 'AI Agents & Automation',
    icon: Bot,
    groupLabel: 'Common Modules',
    defaultRoute: '/dashboard',
  },
  // Vertical Modules
  {
    id: 'usdrop-admin',
    name: 'USDrop Admin',
    description: 'USDrop Platform Administration',
    icon: Shield,
    groupLabel: 'Verticals',
    defaultRoute: '/usdrop/admin',
  },
  {
    id: 'usdrop-user',
    name: 'USDrop User',
    description: 'USDrop User Workspace',
    icon: User,
    groupLabel: 'Verticals',
    defaultRoute: '/usdrop/user',
  },
  {
    id: 'usdrop-free',
    name: 'USDrop Free',
    description: 'USDrop Free Tier Access',
    icon: User,
    groupLabel: 'Verticals',
    defaultRoute: '/usdrop/free',
  },
  {
    id: 'usdrop-pro',
    name: 'USDrop Pro',
    description: 'USDrop Pro Tier Access',
    icon: Crown,
    groupLabel: 'Verticals',
    defaultRoute: '/usdrop/pro',
  },
  {
    id: 'olddeals-admin',
    name: 'Olldeals Admin',
    description: 'Olldeals Administration',
    icon: Briefcase,
    groupLabel: 'Verticals',
    defaultRoute: '/olddeals/admin',
  },
  {
    id: 'olddeals-user',
    name: 'Olldeals User',
    description: 'Olldeals User Portal',
    icon: Briefcase,
    groupLabel: 'Verticals',
    defaultRoute: '/olddeals/user',
  },
  {
    id: 'legalnations-admin',
    name: 'LegalNations Admin',
    description: 'Legal Operations & Compliance',
    icon: Scale,
    groupLabel: 'Verticals',
    defaultRoute: '/legalnations/admin',
  },
  {
    id: 'legalnations-client',
    name: 'LegalNations Client',
    description: 'LegalNations Client Portal',
    icon: Scale,
    groupLabel: 'Verticals',
    defaultRoute: '/legalnations/client',
  },
  {
    id: 'faire-usa',
    name: 'Faire USA',
    description: 'Faire USA Administration',
    icon: ShoppingCart,
    groupLabel: 'Verticals',
    defaultRoute: '/faire/orders',
  },
  {
    id: 'dashboards-reports',
    name: 'Dashboards & Reports',
    description: 'Analytics, Insights & Reporting',
    icon: BarChart3,
    groupLabel: 'Verticals',
    defaultRoute: '/dashboard/reports',
  },
  // SuperAdmin Module
  {
    id: 'superadmin',
    name: 'SuperAdmin Control Panel',
    description: 'System Administration & Control',
    icon: Lock,
    groupLabel: 'Administration',
    defaultRoute: '/admin/control-panel',
  },
]

// Group to default route mapping
const groupDefaultRoutes: Record<string, string> = {
  'Core': '/dashboard',
  'Recruitment': '/hr/dashboard',
  'Employee Management': '/employees',
  'Attendance & Leave': '/hr/attendance',
  'Sales': '/crm/leads',
  'Operations': '/ops',
  'Common Modules': '/knowledge/articles',
  'Settings & Admin': '/settings/general',
  'Verticals': '/usdrop/user',
  'Administration': '/admin/control-panel',
}

// Icon mapping for existing groups
const groupIcons: Record<string, LucideIcon> = {
  'Core': LayoutDashboard,
  'Recruitment': UserCheck,
  'Employee Management': UserCog,
  'Attendance & Leave': Clock,
  'Sales': TrendingUp,
  'Operations': ShoppingCart,
  'Common Modules': BookOpen,
  'Settings & Admin': LayoutDashboard,
  'Verticals': BarChart3,
  'Administration': Lock,
}

// Description mapping for existing groups
const groupDescriptions: Record<string, string> = {
  'Core': 'Dashboard, Tasks, Projects',
  'Recruitment': 'Candidates, Interviews, Job Listings',
  'Employee Management': 'Employee Management, Reports, Documents',
  'Attendance & Leave': 'Attendance Tracking, Leave Requests',
  'Sales': 'Leads, Opportunities, CRM',
  'Operations': 'Orders, Shipments, Payments',
  'Common Modules': 'Knowledge, Communication, Tools',
  'Settings & Admin': 'Configuration & Access Control',
  'Verticals': 'Vertical-Specific Modules & Platforms',
  'Administration': 'System Administration & Control',
}

// Page name and capabilities mapping
const pageInfo: Record<string, { name: string; capabilities: string }> = {
  // Core
  '/home': { name: 'Home', capabilities: 'Dashboard, Overview, Quick Access' },
  '/dashboard': { name: 'Dashboard', capabilities: 'Analytics, Reports, Metrics, Insights' },
  '/dashboard/analytics': { name: 'Analytics', capabilities: 'Data Analysis, Charts, Trends, Performance' },
  '/dashboard/reports': { name: 'Reports', capabilities: 'Generate Reports, Export Data, Insights' },
  '/tasks': { name: 'Tasks', capabilities: 'Create Tasks, Assign Work, Track Progress, Manage Deadlines' },
  '/projects': { name: 'Projects', capabilities: 'Manage Projects, Track Milestones, Team Collaboration' },
  
  // Recruitment (HR)
  '/hr/dashboard': { name: 'HR Dashboard', capabilities: 'Recruitment Overview, Statistics, Quick Actions' },
  '/hr/candidates': { name: 'Candidates', capabilities: 'Manage Candidates, Track Applications, Resume Analysis, Screening' },
  '/hr/interviews': { name: 'Interviews', capabilities: 'Schedule Interviews, Track Feedback, Generate Questions, Evaluation' },
  '/hr/calls': { name: 'Calls', capabilities: 'Log Calls, Transcribe Conversations, Analyze Sentiment, Track Outcomes' },
  '/hr/evaluations': { name: 'Evaluations', capabilities: 'Review Candidates, Rate Performance, Generate Feedback, Recommendations' },
  '/hr/job-portals': { name: 'Job Portals', capabilities: 'Manage Portals, Sync Listings, Track Performance, API Integration' },
  '/hr/job-roles': { name: 'Job Roles', capabilities: 'Define Roles, Create Job Descriptions, Set Requirements, Salary Ranges' },
  '/hr/job-listings': { name: 'Job Listings', capabilities: 'Post Jobs, Optimize Listings, Track Applications, Manage Openings' },
  '/hr/employees': { name: 'Employees', capabilities: 'Manage Employees, View Profiles, Track Performance, Assign Roles' },
  '/hr/employees/reports': { name: 'Employee Reports', capabilities: 'Generate Reports, Analytics, Performance Metrics' },
  '/hr/attendance': { name: 'Attendance', capabilities: 'Track Attendance, Check-in/out, View History, Manage Sessions' },
  '/hr/attendance/summary': { name: 'Attendance Summary', capabilities: 'View Summaries, Statistics, Reports, Analytics' },
  
  // Sales (CRM)
  '/crm/leads': { name: 'Leads', capabilities: 'Manage Leads, Track Pipeline, Convert Opportunities, Follow-ups' },
  '/crm/opportunities': { name: 'Opportunities', capabilities: 'Track Deals, Manage Pipeline, Forecast Revenue, Close Deals' },
  '/crm/quotations': { name: 'Quotations', capabilities: 'Create Quotes, Send Proposals, Track Status, Convert to Orders' },
  '/crm/contacts': { name: 'Contacts', capabilities: 'Manage Contacts, View History, Communication, Relationships' },
  '/crm/companies': { name: 'Companies', capabilities: 'Manage Companies, View Details, Track Interactions, Relationships' },
  '/crm/products': { name: 'Products', capabilities: 'Manage Products, Variants, Collections, Pricing, Inventory' },
  '/crm/calls': { name: 'Calls', capabilities: 'Log Calls, Record Conversations, Track Outcomes, Schedule Follow-ups' },
  '/crm/marketing-assets': { name: 'Marketing Assets', capabilities: 'Manage Assets, Share Materials, Track Usage, Organize Files' },
  
  // Operations
  '/ops': { name: 'Operations', capabilities: 'Manage Orders, Track Shipments, Process Payments, Handle Quotations' },
  '/import-ops': { name: 'Import Operations', capabilities: 'Manage Imports, Track Shipments, Handle Documentation, Process Orders' },
  
  // Common Modules
  '/knowledge/articles': { name: 'Knowledge Articles', capabilities: 'Create Articles, Organize Content, Search Knowledge, Share Information' },
  '/knowledge/sops': { name: 'SOPs', capabilities: 'Manage Procedures, Create Documents, Track Versions, Share Guidelines' },
  '/knowledge/files': { name: 'Files', capabilities: 'Store Files, Organize Documents, Share Resources, Manage Assets' },
  '/knowledge/docs': { name: 'Docs', capabilities: 'Create Documents, Collaborate, Version Control, Share Knowledge' },
  '/messages': { name: 'Messages', capabilities: 'Send Messages, Thread Conversations, Team Communication, Notifications' },
  '/mail': { name: 'Mail', capabilities: 'Send Emails, Manage Inbox, Track Communications, Email Templates' },
  '/calendar': { name: 'Calendar', capabilities: 'Schedule Events, View Calendar, Manage Appointments, Set Reminders' },
  '/tickets': { name: 'Tickets', capabilities: 'Create Tickets, Track Issues, Assign Tasks, Resolve Problems' },
  '/subscriptions': { name: 'Subscriptions', capabilities: 'Manage Subscriptions, Track Renewals, Monitor Usage, Handle Billing' },
  '/password-manager': { name: 'Password Manager', capabilities: 'Store Passwords, Manage Credentials, Secure Access, Organize Accounts' },
  '/documents': { name: 'Documents', capabilities: 'Manage Documents, Organize Files, Share Resources, Track Versions' },
  '/employees': { name: 'Employees', capabilities: 'Manage Employees, View Profiles, Track Performance, Assign Roles' },
  
  // Settings & Admin
  '/settings/general': { name: 'General Settings', capabilities: 'Configure Settings, Manage Preferences, System Configuration' },
  '/settings/permissions': { name: 'Permissions', capabilities: 'Manage Permissions, Set Access Control, Configure Roles' },
  '/settings/rbac': { name: 'RBAC', capabilities: 'Role-Based Access Control, Manage Roles, Assign Permissions, Configure Access' },
  '/settings/team': { name: 'Team', capabilities: 'Manage Team, Add Members, Assign Roles, Configure Access' },
  '/users': { name: 'Users', capabilities: 'Manage Users, Invite Members, Assign Roles, Configure Access' },
}

export function OKSuiteModuleSelector({ groups }: { groups?: NavGroup[] }) {
  const pathname = usePathname()
  const router = useRouter()
  const { selectedGroup, setSelectedGroup } = useGroupScope()
  const [open, setOpen] = React.useState(false)
  // Track the specific module that was selected (for display purposes)
  const [selectedModuleId, setSelectedModuleId] = React.useState<string | null>(null)

  // Helper function to find active module by path
  const findActiveModuleByPath = React.useCallback((path: string): Module | null => {
    // Try to match pathname with module default routes
    for (const module of OK_MODULES) {
      if (module.defaultRoute && path.startsWith(module.defaultRoute)) {
        return module
      }
    }
    
    // Also check if pathname matches any group's default route
    for (const [groupLabel, defaultRoute] of Object.entries(groupDefaultRoutes)) {
      if (path.startsWith(defaultRoute)) {
        const module = OK_MODULES.find((m) => m.groupLabel === groupLabel)
        if (module) return module
      }
    }
    
    return null
  }, [])

  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && (e.key.toLowerCase() === 'g')) {
        e.preventDefault()
        setOpen((o) => !o)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  // Find active module by path (memoized to prevent re-renders)
  // findActiveModuleByPath is stable (useCallback with empty deps), so we only need pathname
  const activeModuleByPath = React.useMemo(() => findActiveModuleByPath(pathname), [pathname]) // eslint-disable-line react-hooks/exhaustive-deps

  // Sync selectedModuleId when pathname or selectedGroup changes (but avoid infinite loops)
  React.useEffect(() => {
    if (selectedGroup === 'all') {
      setSelectedModuleId((prev) => prev !== null ? null : prev)
      return
    }

    // Find active module based on current pathname
    const activeModule = activeModuleByPath
    
    // If we have an active module that matches the selected group, use it
    if (activeModule && activeModule.groupLabel === selectedGroup) {
      setSelectedModuleId((prev) => prev !== activeModule.id ? activeModule.id : prev)
      return
    }

    // Check if current selectedModuleId is still valid for this group using functional update
    setSelectedModuleId((prev) => {
      if (prev) {
        const currentModule = OK_MODULES.find((m) => m.id === prev)
        if (currentModule && currentModule.groupLabel === selectedGroup) {
          // Current selection is still valid, don't change
          return prev
        }
      }

      // Find the first module that matches the group
      const matchingModule = OK_MODULES.find((m) => m.groupLabel === selectedGroup)
      return matchingModule ? matchingModule.id : prev
    })
  }, [selectedGroup, pathname, activeModuleByPath]) // Removed selectedModuleId from deps to prevent loops

  // Get current group info
  const currentGroup = groups?.find((g) => g.label === selectedGroup) || groups?.[0]
  const currentIcon = groupIcons[selectedGroup] || LayoutDashboard
  const currentDescription = groupDescriptions[selectedGroup] || 'All Modules'

  // Find module for display - prefer the specifically selected module, then active module by path, then fall back to first match for group
  const displayModule = React.useMemo(() => {
    if (selectedModuleId) {
      const module = OK_MODULES.find((m) => m.id === selectedModuleId)
      if (module) return module
    }
    return activeModuleByPath || OK_MODULES.find((m) => m.groupLabel === selectedGroup)
  }, [selectedModuleId, activeModuleByPath, selectedGroup])
  
  // Show active module name (from OK_MODULES list), not page name
  const displayName = selectedGroup === 'all'
    ? 'OKSuite'
    : displayModule 
      ? displayModule.name 
      : selectedGroup
  
  // Show module description, not page capabilities
  const displaySubtitle = selectedGroup === 'all' 
    ? 'All Modules' 
    : displayModule 
      ? displayModule.description 
      : currentDescription

  const handleModuleSelect = (module: Module) => {
    // If module has a defaultRoute, navigate directly to it
    if (module.defaultRoute) {
      setSelectedModuleId(module.id) // Store the specific module ID for display
      if (module.groupLabel) {
        setSelectedGroup(module.groupLabel)
      }
      router.push(module.defaultRoute)
      setOpen(false)
      return
    }
    
    // Fallback: Find the group that matches this module (for Company OS modules)
    if (groups && groups.length > 0) {
      const matchingGroup = groups.find((g) => g.label === module.groupLabel)
      if (matchingGroup) {
        setSelectedGroup(matchingGroup.label)
        setSelectedModuleId(module.id) // Store the specific module ID for display
        
        // Navigate to the module's default route or group default
        const route = module.defaultRoute || groupDefaultRoutes[matchingGroup.label] || '/dashboard'
        router.push(route)
        setOpen(false)
        return
      }
    }
    
    // Final fallback: navigate to dashboard
    setSelectedGroup('all')
    setSelectedModuleId(null)
    router.push('/dashboard')
    setOpen(false)
  }

  const handleAllModules = () => {
    setSelectedGroup('all')
    setSelectedModuleId(null)
    router.push('/home')
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="lg"
          className={cn(
            'h-12 gap-2 whitespace-nowrap bg-gradient-to-b from-[#4A4A4A] to-[#363636] text-white font-medium shadow-none border-none hover:from-[#4A4A4A] hover:to-[#363636] hover:text-white data-[state=open]:bg-gradient-to-b data-[state=open]:from-[#4A4A4A] data-[state=open]:to-[#363636] data-[state=open]:text-white',
            'px-3'
          )}
        >
          <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-white/10 text-white">
            {selectedGroup === 'all' ? (
              <LayoutDashboard className="size-4" />
            ) : displayModule ? (
              React.createElement(displayModule.icon, { className: 'size-4' })
            ) : (
              React.createElement(currentIcon, { className: 'size-4' })
            )}
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-semibold text-white">{displayName}</span>
            <span className="truncate text-xs text-white/80">{displaySubtitle}</span>
          </div>
          <ChevronsUpDown className="ml-auto h-3.5 w-3.5 text-[#CCCCCC]" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        align="start" 
        side="bottom"
        sideOffset={8}
        className="w-[calc(100vw-2rem)] sm:w-[800px] lg:w-[900px] bg-[#1A1A1A] border-[#2A2A2A] text-white p-0 overflow-hidden max-h-[calc(100vh-4rem)] flex flex-col"
      >
         {/* Top Section: Image and Modules (1:2 split) */}
         <div className="flex max-h-[320px] sm:max-h-[360px]">
          {/* Left Section - Image with Overlay Tiles (1/3 width) */}
          <div className="hidden lg:block flex-[1] flex-shrink-0 border-r border-[#2A2A2A] bg-[#1F1F1F] p-2.5 sm:p-3">
             <div className="relative w-full h-full max-h-[280px] sm:max-h-[320px] rounded-lg overflow-hidden">
              {/* Background Image */}
              <div className="absolute inset-0">
                <Image
                  src="/44.png"
                  alt="OK Suite"
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 0vw, 300px"
                  priority
                />
              </div>
              
              {/* Overlay Tiles */}
              <div className="relative h-full flex flex-col justify-start items-center gap-3 p-3">
                {/* OKSuite Card */}
                <Card
                  className={cn(
                    'cursor-pointer transition-all hover:bg-white/10 border-white/20 bg-black/40 backdrop-blur-sm w-full',
                    selectedGroup === 'all' && 'bg-white/15 border-white/30'
                  )}
                  onClick={handleAllModules}
                >
                  <CardContent className="p-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-white/20 text-white flex-shrink-0">
                        <LayoutDashboard className="size-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h3 className="font-semibold text-white text-xs leading-tight">OKSuite</h3>
                          {selectedGroup === 'all' && (
                            <Check className="h-3.5 w-3.5 text-white flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-[10px] text-white/80 mt-0.5 line-clamp-2 leading-tight">Access all modules</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                {OK_MODULES.filter(m => m.id === 'dashboards-reports' || m.id === 'superadmin').map((module) => {
                  const isSelected = selectedModuleId === module.id
                  const isGroupSelected = module.groupLabel === selectedGroup
                  return (
                    <Card
                      key={module.id}
                      className={cn(
                        'cursor-pointer transition-all hover:bg-white/10 border-white/20 bg-black/40 backdrop-blur-sm w-full',
                        isGroupSelected && 'bg-white/15 border-white/30'
                      )}
                      onClick={() => {
                        handleModuleSelect(module)
                      }}
                    >
                      <CardContent className="p-2.5">
                        <div className="flex items-center gap-2.5">
                          <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-white/20 text-white flex-shrink-0">
                            <module.icon className="size-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <h3 className="font-semibold text-white text-xs leading-tight">{module.name}</h3>
                              {isSelected && (
                                <Check className="h-3.5 w-3.5 text-white flex-shrink-0" />
                              )}
                            </div>
                            <p className="text-[10px] text-white/80 mt-0.5 line-clamp-2 leading-tight">{module.description}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Right Section - Existing Modules (2/3 width) */}
          <div className="flex-[2] p-3 sm:p-4 overflow-y-auto min-w-0">
            {/* Module Grid - Four Columns */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-2.5">
              {/* Existing Modules (first 7) */}
              {OK_MODULES.slice(0, 7).map((module) => {
                // Check if this specific module is selected (by ID), not just the group
                const isSelected = selectedModuleId === module.id
                // Also check if module's group matches selected group for highlighting
                const isGroupSelected = module.groupLabel === selectedGroup
                return (
                  <Card
                    key={module.id}
                    className={cn(
                      'cursor-pointer transition-all hover:bg-[#252525] border-[#2A2A2A] bg-[#1F1F1F]',
                      isGroupSelected && 'bg-[#2A2A2A] border-[#3A3A3A]'
                    )}
                    onClick={() => {
                      handleModuleSelect(module)
                    }}
                  >
                    <CardContent className="p-2 sm:p-2.5">
                      <div className="flex items-start gap-2">
                        <div className="flex aspect-square size-6 sm:size-7 items-center justify-center rounded-lg bg-white/10 text-white flex-shrink-0">
                          <module.icon className="size-3 sm:size-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1 sm:gap-1.5">
                            <h3 className="font-semibold text-white text-[10px] sm:text-xs">{module.name}</h3>
                            {isSelected && (
                              <Check className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-white flex-shrink-0" />
                            )}
                          </div>
                          <p className="text-[9px] sm:text-[10px] text-white/60 mt-0.5 line-clamp-2">{module.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        </div>

        {/* Separator - Full Width */}
        <div className="relative my-3 mx-4 sm:mx-6">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-[#2A2A2A]"></span>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-[#1A1A1A] px-2 text-white/40">Vertical Modules</span>
          </div>
        </div>

        {/* Bottom Section: Vertical Modules (Full Width) */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto min-w-0">
          {/* New Modules Grid (remaining modules, excluding dashboards-reports and superadmin) - 2 rows × 5 columns */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-2.5">
            {OK_MODULES.slice(7).filter(m => m.id !== 'dashboards-reports' && m.id !== 'superadmin').map((module) => {
              // Check if this specific module is selected (by ID), not just the group
              const isSelected = selectedModuleId === module.id
              // Also check if module's group matches selected group for highlighting
              const isGroupSelected = module.groupLabel === selectedGroup
              return (
                <Card
                  key={module.id}
                  className={cn(
                    'cursor-pointer transition-all hover:bg-[#252525] border-[#2A2A2A] bg-[#1F1F1F]',
                    isGroupSelected && 'bg-[#2A2A2A] border-[#3A3A3A]',
                    module.id === 'superadmin' && 'ring-2 ring-[#4A9EFF] border-[#4A9EFF]/50 bg-[#1F2A3A]/30'
                  )}
                  onClick={() => {
                    handleModuleSelect(module)
                  }}
                >
                  <CardContent className="p-2 sm:p-2.5">
                    <div className="flex flex-col items-center text-center gap-1.5">
                      <div className="flex aspect-square size-7 sm:size-8 items-center justify-center rounded-lg bg-white/10 text-white">
                        <module.icon className="size-3.5 sm:size-4" />
                      </div>
                      <div className="flex-1 min-w-0 w-full">
                        <div className="flex items-center justify-center gap-1">
                          <h3 className="font-semibold text-white text-[10px] sm:text-xs leading-tight">{module.name}</h3>
                          {isSelected && (
                            <Check className="h-3 w-3 text-white flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-[9px] sm:text-[10px] text-white/60 mt-0.5 line-clamp-2 leading-tight">{module.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

