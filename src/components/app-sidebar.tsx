'use client'

import * as React from 'react'
import {
  LayoutDashboard,
  Home,
  CheckSquare,
  BookOpen,
  Users,
  FileText,
  ShoppingCart,
  Package,
  Settings2,
  Building2,
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
  Megaphone,
  BarChart3,
  Clock,
  ShoppingBag,
  UserCog,
  type LucideIcon,
} from 'lucide-react'

import { NavMain } from '@/components/nav-main'
import { NavProjects } from '@/components/nav-projects'
import { VerticalSwitcher } from '@/components/vertical-switcher'
import { AppDock } from '@/components/app-dock'
import { useRole } from '@/lib/roles/use-role'
import { useUserRole } from '@/lib/hooks/useUserRole'
import { Sidebar, SidebarContent, SidebarHeader, SidebarRail } from '@/components/ui/sidebar'

// Pages that exist and are functional
const EXISTING_PAGES = new Set([
  '/home',
  '/dashboard',
  '/tasks',
  '/users',
  '/employees',
  '/crm/leads',
  '/crm/products',
  '/crm/quotations',
  '/crm/calls',
  '/crm/marketing-assets',
  '/knowledge/articles',
  '/messages',
  '/mail',
  '/calendar',
  '/tickets',
  '/documents',
  '/hr/attendance',
  '/subscriptions',
])

// Module to project mapping
const moduleProjectMap: Record<string, { name: string; url: string; icon: LucideIcon; comingSoon?: boolean }> = {
  crm: {
    name: 'CRM',
    url: '/crm/leads',
    icon: Users,
  },
  ats: {
    name: 'ATS',
    url: '/ats',
    icon: FileText,
    comingSoon: !EXISTING_PAGES.has('/ats'),
  },
  ops: {
    name: 'Operations',
    url: '/ops',
    icon: ShoppingCart,
    comingSoon: !EXISTING_PAGES.has('/ops'),
  },
  import_ops: {
    name: 'Import Ops',
    url: '/import-ops',
    icon: Package,
    comingSoon: !EXISTING_PAGES.has('/import-ops'),
  },
}

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

// Get sidebar navigation items - organized into concise groups for superadmin
function getNavGroups(
  role: 'employee' | 'manager' | 'admin' | 'superadmin' | null,
  allowedModules: string[] = []
) {
  const groups = []

  // TEMPORARY: Show full sidebar to everyone (bypass role checks)
  // TODO: Remove this and restore role-based access after fixing role detection
  const effectiveRole = 'superadmin' // Force superadmin for now
  const hasCrmAccess = true // Force CRM access for now

  // ============================================================================
  // MAIN - Core functionality (single items, no dropdowns)
  // ============================================================================
  groups.push({
    label: 'Main',
    items: [
      {
        title: 'Home',
        url: '/home',
        icon: Home,
        isActive: true,
      },
      {
        title: 'Dashboard',
        url: '/dashboard',
        icon: LayoutDashboard,
      },
      {
        title: 'Tasks',
        url: '/tasks',
        icon: CheckSquare,
      },
    ],
  })

  // ============================================================================
  // PEOPLE - User & Employee Management (grouped)
  // ============================================================================
  groups.push({
    label: 'People',
    items: [
      {
        title: 'Users',
        url: '/users',
        icon: UserPlus,
      },
      {
        title: 'Employees',
        url: '/employees',
        icon: UserCog,
      },
    ],
  })

  // ============================================================================
  // CRM - Organized with smart grouping
  // ============================================================================
  if (hasCrmAccess) {
    groups.push({
      label: 'CRM',
      items: [
        {
          title: 'Leads',
          url: '/crm/leads',
          icon: Users,
        },
        {
          title: 'Sales',
          url: '/crm/opportunities',
          icon: Briefcase,
          items: [
            {
              title: 'Opportunities',
              url: '/crm/opportunities',
              comingSoon: !EXISTING_PAGES.has('/crm/opportunities'),
            },
            {
              title: 'Quotations',
              url: '/crm/quotations',
              comingSoon: !EXISTING_PAGES.has('/crm/quotations'),
            },
          ],
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
          comingSoon: !EXISTING_PAGES.has('/crm/products'),
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
  }

  // ============================================================================
  // KNOWLEDGE - Grouped
  // ============================================================================
  groups.push({
    label: 'Knowledge',
    items: [
      {
        title: 'Knowledge Base',
        url: '/knowledge/articles',
        icon: BookOpen,
        comingSoon: !EXISTING_PAGES.has('/knowledge/articles'),
      },
      {
        title: 'Resources',
        url: '/knowledge/sops',
        icon: FolderOpen,
        items: [
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
    ],
  })

  // ============================================================================
  // COMMUNICATION - Single items
  // ============================================================================
  groups.push({
    label: 'Communication',
    items: [
      {
        title: 'Messages',
        url: '/messages',
        icon: MessageSquare,
        comingSoon: !EXISTING_PAGES.has('/messages'),
      },
      {
        title: 'Mail',
        url: '/mail',
        icon: Mail,
        comingSoon: !EXISTING_PAGES.has('/mail'),
      },
      {
        title: 'Calendar',
        url: '/calendar',
        icon: Calendar,
        comingSoon: !EXISTING_PAGES.has('/calendar'),
      },
    ],
  })

  // ============================================================================
  // OPERATIONS - Grouped
  // ============================================================================
  groups.push({
    label: 'Operations',
    items: [
      {
        title: 'Tickets',
        url: '/tickets',
        icon: Ticket,
        comingSoon: !EXISTING_PAGES.has('/tickets'),
      },
      {
        title: 'Documents',
        url: '/documents',
        icon: FileText,
        comingSoon: !EXISTING_PAGES.has('/documents'),
      },
      {
        title: 'HR',
        url: '/hr/attendance',
        icon: Clock,
        comingSoon: !EXISTING_PAGES.has('/hr/attendance'),
      },
      {
        title: 'Subscriptions',
        url: '/subscriptions',
        icon: CreditCard,
        comingSoon: !EXISTING_PAGES.has('/subscriptions'),
      },
    ],
  })

  // ============================================================================
  // SETTINGS - Grouped
  // ============================================================================
  groups.push({
    label: 'Settings',
    items: [
      {
        title: 'General',
        url: '/settings/general',
        icon: Settings2,
        comingSoon: !EXISTING_PAGES.has('/settings/general'),
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
        comingSoon: !EXISTING_PAGES.has('/settings/team'),
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
  const navGroups = React.useMemo(() => {
    const groups = getNavGroups(effectiveRoleForNav, allowedModules)
    return groups
  }, [effectiveRoleForNav, allowedModules])

  // Filter projects based on allowed modules
  // TEMPORARY: Show all projects to everyone
  const projects = React.useMemo(() => {
    // Show all projects to everyone for now
    return Object.values(moduleProjectMap)
  }, [])

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="gap-1 p-1.5">
        <VerticalSwitcher />
      </SidebarHeader>
      <AppDock />
      <SidebarContent>
        <NavMain groups={navGroups} />
        {projects.length > 0 && <NavProjects projects={projects} />}
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
