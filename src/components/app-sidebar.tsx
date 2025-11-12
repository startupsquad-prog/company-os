'use client'

import * as React from 'react'
import {
  LayoutDashboard,
  Home,
  CheckSquare,
  BookOpen,
  FileText,
  ShoppingCart,
  Package,
  Settings2,
  Briefcase,
  Users2,
  UserPlus,
  Building,
  BriefcaseBusiness,
  Phone,
  FileCheck,
  MessageSquare,
  Mail,
  Calendar,
  Ticket,
  FolderOpen,
  CreditCard,
  Clock,
  ShoppingBag,
  UserCog,
  FolderKanban,
  Lock,
  Globe,
  List,
  UserCheck,
  TrendingUp,
} from 'lucide-react'

import { NavMain } from '@/components/nav-main'
import { OKSuiteModuleSelector } from '@/components/ok-suite-module-selector'
import { AppDock } from '@/components/app-dock'
import { useRole } from '@/lib/roles/use-role'
import { useUserRole } from '@/lib/hooks/useUserRole'
import { useGroupScope } from '@/lib/state/use-group-scope'
import { Sidebar, SidebarContent, SidebarHeader, SidebarRail } from '@/components/ui/sidebar'

// Pages that exist and are functional
const EXISTING_PAGES = new Set([
  // Core
  '/home',
  '/dashboard',
  '/dashboard/analytics',
  '/dashboard/reports',
  '/tasks',
  '/projects',
  // Recruitment (ATS)
  '/hr/dashboard',
  '/hr/candidates',
  '/hr/interviews',
  '/hr/calls',
  '/hr/evaluations',
  '/hr/job-portals',
  '/hr/job-roles',
  '/hr/job-listings',
  '/hr/employees',
  '/hr/employees/reports',
  '/hr/attendance',
  '/hr/attendance/summary',
  // HR
  '/employees',
  '/hr/attendance',
  '/documents',
  // Sales (CRM)
  '/crm/leads',
  '/crm/opportunities',
  '/crm/quotations',
  '/crm/contacts',
  '/crm/companies',
  '/crm/products',
  '/crm/calls',
  '/crm/marketing-assets',
  // Operations
  '/ops',
  '/import-ops',
  // Common Modules
  '/knowledge/articles',
  '/knowledge/sops',
  '/knowledge/files',
  '/knowledge/docs',
  '/messages',
  '/mail',
  '/calendar',
  '/tickets',
  '/subscriptions',
  '/password-manager',
  // Settings & Admin
  '/settings/general',
  '/settings/permissions',
  '/settings/rbac',
  '/settings/team',
  '/users',
])

function normalizeRoleName(input?: string | null):
  | 'employee'
  | 'manager'
  | 'admin'
  | 'superadmin'
  | null {
  if (!input) return null
  const v = String(input).toLowerCase()
  if (['superadmin', 'super_admin', 'owner', 'root'].includes(v)) return 'superadmin'
  if (['admin', 'administrator'].includes(v)) return 'admin'
  if (['manager', 'mgr'].includes(v)) return 'manager'
  if (['employee', 'user', 'member', 'staff'].includes(v)) return 'employee'
  return null
}

// Get sidebar navigation items - organized by business functions for superadmin
function getNavGroups(
  role: 'employee' | 'manager' | 'admin' | 'superadmin' | null,
  allowedModules: string[] = []
) {
  const groups = []

  // TEMPORARY: Show full sidebar to everyone (bypass role checks)
  // TODO: Remove this and restore role-based access after fixing role detection
  const effectiveRole = 'superadmin' // Force superadmin for now

  // ============================================================================
  // GROUP 1: CORE - Always visible, most used
  // ============================================================================
  groups.push({
    label: 'Core',
    items: [
      {
        title: 'Home',
        url: '/home',
        icon: Home,
      },
      {
        title: 'Dashboard',
        url: '/dashboard',
        icon: LayoutDashboard,
        items: [
          {
            title: 'Overview',
            url: '/dashboard',
            comingSoon: !EXISTING_PAGES.has('/dashboard'),
          },
          {
            title: 'Analytics',
            url: '/dashboard/analytics',
            comingSoon: !EXISTING_PAGES.has('/dashboard/analytics'),
          },
          {
            title: 'Reports',
            url: '/dashboard/reports',
            comingSoon: !EXISTING_PAGES.has('/dashboard/reports'),
          },
        ],
      },
      {
        title: 'Tasks',
        url: '/tasks',
        icon: CheckSquare,
      },
      {
        title: 'Projects',
        url: '/projects',
        icon: FolderKanban,
      },
    ],
  })

  // ============================================================================
  // GROUP 2: RECRUITMENT
  // ============================================================================
  groups.push({
    label: 'Recruitment',
    items: [
      {
        title: 'Dashboard',
        url: '/hr/dashboard',
        icon: LayoutDashboard,
        comingSoon: !EXISTING_PAGES.has('/hr/dashboard'),
      },
      {
        title: 'Candidates',
        url: '/hr/candidates',
        icon: UserCheck,
        comingSoon: !EXISTING_PAGES.has('/hr/candidates'),
      },
      {
        title: 'Interviews',
        url: '/hr/interviews',
        icon: Calendar,
        comingSoon: !EXISTING_PAGES.has('/hr/interviews'),
      },
      {
        title: 'Calls',
        url: '/hr/calls',
        icon: Phone,
        comingSoon: !EXISTING_PAGES.has('/hr/calls'),
      },
      {
        title: 'Evaluations',
        url: '/hr/evaluations',
        icon: FileCheck,
        comingSoon: !EXISTING_PAGES.has('/hr/evaluations'),
      },
      {
        title: 'Job Portals',
        url: '/hr/job-portals',
        icon: Globe,
        comingSoon: !EXISTING_PAGES.has('/hr/job-portals'),
      },
      {
        title: 'Job Roles',
        url: '/hr/job-roles',
        icon: Briefcase,
        comingSoon: !EXISTING_PAGES.has('/hr/job-roles'),
      },
      {
        title: 'Job Listings',
        url: '/hr/job-listings',
        icon: List,
        comingSoon: !EXISTING_PAGES.has('/hr/job-listings'),
      },
    ],
  })

  // ============================================================================
  // GROUP 3: EMPLOYEE MANAGEMENT
  // ============================================================================
  groups.push({
    label: 'Employee Management',
    items: [
      {
        title: 'Employees',
        url: '/employees',
        icon: UserCog,
        comingSoon: !EXISTING_PAGES.has('/employees'),
      },
      {
        title: 'HR Employees',
        url: '/hr/employees',
        icon: Users2,
        comingSoon: !EXISTING_PAGES.has('/hr/employees'),
      },
      {
        title: 'Employee Reports',
        url: '/hr/employees/reports',
        icon: FileText,
        comingSoon: !EXISTING_PAGES.has('/hr/employees/reports'),
      },
      {
        title: 'Documents',
        url: '/documents',
        icon: FileText,
      },
    ],
  })

  // ============================================================================
  // GROUP 4: ATTENDANCE & LEAVE
  // ============================================================================
  groups.push({
    label: 'Attendance & Leave',
    items: [
      {
        title: 'Attendance',
        url: '/hr/attendance',
        icon: Clock,
        comingSoon: !EXISTING_PAGES.has('/hr/attendance'),
      },
      {
        title: 'Attendance Summary',
        url: '/hr/attendance/summary',
        icon: FileText,
        comingSoon: !EXISTING_PAGES.has('/hr/attendance/summary'),
      },
      {
        title: 'Leave Requests',
        url: '/hr/leave-requests',
        icon: FileCheck,
        comingSoon: !EXISTING_PAGES.has('/hr/leave-requests'),
      },
    ],
  })

  // ============================================================================
  // GROUP 4: SALES (CRM)
  // ============================================================================
  groups.push({
    label: 'Sales',
    items: [
      {
        title: 'Leads',
        url: '/crm/leads',
        icon: TrendingUp,
      },
      {
        title: 'Opportunities',
        url: '/crm/opportunities',
        icon: Briefcase,
      },
      {
        title: 'Quotations',
        url: '/crm/quotations',
        icon: FileCheck,
      },
      {
        title: 'Contacts',
        url: '/crm/contacts',
        icon: Building,
        items: [
          {
            title: 'Contacts',
            url: '/crm/contacts',
            comingSoon: !EXISTING_PAGES.has('/crm/contacts'),
          },
          {
            title: 'Companies',
            url: '/crm/companies',
            comingSoon: !EXISTING_PAGES.has('/crm/companies'),
          },
        ],
      },
      {
        title: 'Products',
        url: '/crm/products',
        icon: ShoppingBag,
      },
      {
        title: 'Activities',
        url: '/crm/calls',
        icon: Phone,
        items: [
          {
            title: 'Calls',
            url: '/crm/calls',
            comingSoon: !EXISTING_PAGES.has('/crm/calls'),
          },
          {
            title: 'Marketing Assets',
            url: '/crm/marketing-assets',
            comingSoon: !EXISTING_PAGES.has('/crm/marketing-assets'),
          },
        ],
      },
    ],
  })

  // ============================================================================
  // GROUP 4: OPERATIONS (USA Order Management)
  // ============================================================================
  groups.push({
    label: 'Operations',
    items: [
      {
        title: 'Orders',
        url: '/ops/orders',
        icon: ShoppingCart,
        comingSoon: !EXISTING_PAGES.has('/ops/orders'),
      },
      {
        title: 'Shipments',
        url: '/ops/shipments',
        icon: Package,
        comingSoon: !EXISTING_PAGES.has('/ops/shipments'),
      },
      {
        title: 'Quotations',
        url: '/ops/quotations',
        icon: FileCheck,
        comingSoon: !EXISTING_PAGES.has('/ops/quotations'),
      },
      {
        title: 'Payments',
        url: '/ops/payments',
        icon: CreditCard,
        comingSoon: !EXISTING_PAGES.has('/ops/payments'),
      },
    ],
  })

  // ============================================================================
  // GROUP 5: COMMON MODULES - Shared tools across all
  // ============================================================================
  groups.push({
    label: 'Common Modules',
    items: [
      {
        title: 'Knowledge',
        url: '/knowledge/articles',
        icon: BookOpen,
        items: [
          {
            title: 'Articles',
            url: '/knowledge/articles',
            comingSoon: !EXISTING_PAGES.has('/knowledge/articles'),
          },
          {
            title: 'SOPs',
            url: '/knowledge/sops',
            comingSoon: !EXISTING_PAGES.has('/knowledge/sops'),
          },
          {
            title: 'Files',
            url: '/knowledge/files',
            comingSoon: !EXISTING_PAGES.has('/knowledge/files'),
          },
          {
            title: 'Documentation',
            url: '/knowledge/docs',
            comingSoon: !EXISTING_PAGES.has('/knowledge/docs'),
          },
        ],
      },
      {
        title: 'Communication',
        url: '/messages',
        icon: MessageSquare,
        items: [
          {
            title: 'Messages',
            url: '/messages',
            comingSoon: !EXISTING_PAGES.has('/messages'),
          },
          {
            title: 'Mail',
            url: '/mail',
            comingSoon: !EXISTING_PAGES.has('/mail'),
          },
          {
            title: 'Calendar',
            url: '/calendar',
            comingSoon: !EXISTING_PAGES.has('/calendar'),
          },
        ],
      },
      {
        title: 'Tickets',
        url: '/tickets',
        icon: Ticket,
      },
      {
        title: 'Subscriptions',
        url: '/subscriptions',
        icon: CreditCard,
      },
      {
        title: 'Password Manager',
        url: '/password-manager',
        icon: Lock,
      },
    ],
  })

  // ============================================================================
  // GROUP 6: SETTINGS & ADMIN
  // ============================================================================
  groups.push({
    label: 'Settings & Admin',
    items: [
      {
        title: 'General',
        url: '/settings/general',
        icon: Settings2,
      },
      {
        title: 'Access Control',
        url: '/settings/permissions',
        icon: BriefcaseBusiness,
        items: [
          {
            title: 'Permissions',
            url: '/settings/permissions',
            comingSoon: !EXISTING_PAGES.has('/settings/permissions'),
          },
          {
            title: 'RBAC',
            url: '/settings/rbac',
            comingSoon: !EXISTING_PAGES.has('/settings/rbac'),
          },
        ],
      },
      {
        title: 'Team',
        url: '/settings/team',
        icon: Users2,
      },
      {
        title: 'Users',
        url: '/users',
        icon: UserPlus,
      },
    ],
  })

  return groups
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { allowedModules, activeRole } = useRole()
  const { role, isLoading: roleLoading } = useUserRole()

  // Use activeRole from RoleContext as fallback if useUserRole hasn't loaded yet
  // activeRole has role_name which we can use
  const effectiveRoleForNav = React.useMemo(() => {
    const primary = normalizeRoleName(role)
    if (primary) return primary
    const fallback = normalizeRoleName(activeRole?.role_name)
    if (fallback) return fallback
    return null
  }, [role, activeRole])

  // Get role-based navigation groups
  const allNavGroups = React.useMemo(() => {
    const groups = getNavGroups(effectiveRoleForNav, allowedModules)
    return groups
  }, [effectiveRoleForNav, allowedModules])

  // Get selected group from state
  const { selectedGroup } = useGroupScope()

  // Filter groups based on selected group
  // When in HR context (Recruitment), also show Employee Management and Attendance & Leave
  const navGroups = React.useMemo(() => {
    if (selectedGroup === 'all') {
      return allNavGroups
    }
    
    // HR-related groups that should be shown together
    const hrGroups = ['Recruitment', 'Employee Management', 'Attendance & Leave']
    
    if (hrGroups.includes(selectedGroup)) {
      // Show all HR-related groups when any HR group is selected
      return allNavGroups.filter((group) => hrGroups.includes(group.label))
    }
    
    return allNavGroups.filter((group) => group.label === selectedGroup)
  }, [allNavGroups, selectedGroup])

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="gap-1 p-1.5">
        <OKSuiteModuleSelector groups={allNavGroups} />
      </SidebarHeader>
      <AppDock />
      <SidebarContent>
        <NavMain groups={navGroups} />
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
