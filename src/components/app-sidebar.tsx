"use client"

import * as React from "react"
import {
  LayoutDashboard,
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
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavProjects } from "@/components/nav-projects"
import { TeamSwitcher } from "@/components/team-switcher"
import { AppDock } from "@/components/app-dock"
import { useRole } from "@/lib/roles/use-role"
import { useUserRole } from "@/lib/hooks/useUserRole"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"

// Module to project mapping
const moduleProjectMap: Record<string, { name: string; url: string; icon: React.ElementType }> = {
  crm: {
    name: "CRM",
    url: "/crm",
    icon: Users,
  },
  ats: {
    name: "ATS",
    url: "/ats",
    icon: FileText,
  },
  ops: {
    name: "Operations",
    url: "/ops",
    icon: ShoppingCart,
  },
  import_ops: {
    name: "Import Ops",
    url: "/import-ops",
    icon: Package,
  },
}

// Company OS data
const data = {
  teams: [
    {
      name: "Company OS",
      logo: Building2,
      plan: "Enterprise",
    },
    {
      name: "Sales Team",
      logo: Briefcase,
      plan: "Department",
    },
    {
      name: "Operations",
      logo: Users2,
      plan: "Department",
    },
  ],
}

// Get sidebar navigation items based on role and allowed modules
function getNavMainItems(
  role: 'employee' | 'manager' | 'admin' | 'superadmin' | null,
  allowedModules: string[] = []
) {
  const baseItems = []

  // Default to employee if role is null (loading state)
  const effectiveRole = role || 'employee'
  
  // Superadmin always has access to all modules
  const hasCrmAccess = effectiveRole === 'superadmin' || allowedModules.includes('crm')

  // Dashboard section - varies by role
  if (effectiveRole === 'employee') {
    // Employee: Only Overview (personal dashboard)
    baseItems.push({
      title: "Dashboard",
      url: "/dashboard",
      icon: LayoutDashboard,
      isActive: true,
      items: [
        {
          title: "Overview",
          url: "/dashboard",
        },
      ],
    })
  } else if (effectiveRole === 'manager') {
    // Manager: Overview and Analytics (department level)
    baseItems.push({
      title: "Dashboard",
      url: "/dashboard",
      icon: LayoutDashboard,
      isActive: true,
      items: [
        {
          title: "Overview",
          url: "/dashboard",
        },
        {
          title: "Analytics",
          url: "/dashboard/analytics",
        },
      ],
    })
  } else if (effectiveRole === 'admin' || effectiveRole === 'superadmin') {
    // Admin/Superadmin: Full dashboard access
    baseItems.push({
      title: "Dashboard",
      url: "/dashboard",
      icon: LayoutDashboard,
      isActive: true,
      items: [
        {
          title: "Overview",
          url: "/dashboard",
        },
        {
          title: "Analytics",
          url: "/dashboard/analytics",
        },
        {
          title: "Reports",
          url: "/dashboard/reports",
        },
      ],
    })
  }

  // Tasks section - varies by role
  if (effectiveRole === 'employee') {
    // Employee: Only "My Tasks" - no access to all tasks or department tasks
    baseItems.push({
      title: "Tasks",
      url: "/tasks?filter=my",
      icon: CheckSquare,
      items: [
        {
          title: "My Tasks",
          url: "/tasks?filter=my",
        },
      ],
    })
  } else if (effectiveRole === 'manager') {
    // Manager: My Tasks and Department Tasks (can see their department)
    baseItems.push({
      title: "Tasks",
      url: "/tasks?filter=my",
      icon: CheckSquare,
      items: [
        {
          title: "My Tasks",
          url: "/tasks?filter=my",
        },
        {
          title: "Department",
          url: "/tasks?filter=department",
        },
      ],
    })
  } else if (effectiveRole === 'admin' || effectiveRole === 'superadmin') {
    // Admin/Superadmin: All Tasks, My Tasks, Department
    baseItems.push({
      title: "Tasks",
      url: "/tasks",
      icon: CheckSquare,
      items: [
        {
          title: "All Tasks",
          url: "/tasks",
        },
        {
          title: "My Tasks",
          url: "/tasks?filter=my",
        },
        {
          title: "Department",
          url: "/tasks?filter=department",
        },
      ],
    })
  }

  // CRM section - only if user has CRM module access
  if (hasCrmAccess) {
    baseItems.push({
      title: "CRM",
      url: "/crm/leads",
      icon: Users,
      items: [
        {
          title: "Leads",
          url: "/crm/leads",
        },
        {
          title: "Opportunities",
          url: "/crm/opportunities",
        },
        {
          title: "Contacts",
          url: "/crm/contacts",
        },
        {
          title: "Companies",
          url: "/crm/companies",
        },
      ],
    })
  }

  // Knowledge section - available to all roles
  baseItems.push({
    title: "Knowledge",
    url: "/knowledge",
    icon: BookOpen,
    items: [
      {
        title: "SOPs",
        url: "/knowledge/sops",
      },
      {
        title: "Files",
        url: "/knowledge/files",
      },
      {
        title: "Documentation",
        url: "/knowledge/docs",
      },
    ],
  })

  // Settings section - varies by role
  if (effectiveRole === 'employee') {
    // Employee: Only personal settings (General)
    baseItems.push({
      title: "Settings",
      url: "/settings/general",
      icon: Settings2,
      items: [
        {
          title: "General",
          url: "/settings/general",
        },
      ],
    })
  } else if (effectiveRole === 'manager') {
    // Manager: General and Team (department level)
    baseItems.push({
      title: "Settings",
      url: "/settings/general",
      icon: Settings2,
      items: [
        {
          title: "General",
          url: "/settings/general",
        },
        {
          title: "Team",
          url: "/settings/team",
        },
      ],
    })
  } else if (effectiveRole === 'admin') {
    // Admin: General, Team, Permissions (but not RBAC)
    baseItems.push({
      title: "Settings",
      url: "/settings/general",
      icon: Settings2,
      items: [
        {
          title: "General",
          url: "/settings/general",
        },
        {
          title: "Team",
          url: "/settings/team",
        },
        {
          title: "Permissions",
          url: "/settings/permissions",
        },
      ],
    })
  } else if (effectiveRole === 'superadmin') {
    // Superadmin: Full settings access including RBAC
    baseItems.push({
      title: "Settings",
      url: "/settings/general",
      icon: Settings2,
      items: [
        {
          title: "General",
          url: "/settings/general",
        },
        {
          title: "Team",
          url: "/settings/team",
        },
        {
          title: "Permissions",
          url: "/settings/permissions",
        },
        {
          title: "RBAC",
          url: "/settings/rbac",
        },
      ],
    })
  }

  return baseItems
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { allowedModules } = useRole()
  const { role } = useUserRole()

  // Get role-based navigation items
  const navMainItems = React.useMemo(() => {
    return getNavMainItems(role, allowedModules)
  }, [role, allowedModules])

  // Filter projects based on allowed modules
  // common_util is always available (Tasks), so we filter other modules
  const projects = React.useMemo(() => {
    return allowedModules
      .filter(module => module !== 'common_util' && moduleProjectMap[module])
      .map(module => moduleProjectMap[module])
  }, [allowedModules])

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="gap-1 p-1.5">
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <AppDock />
      <SidebarContent>
        <NavMain items={navMainItems} />
        {projects.length > 0 && <NavProjects projects={projects} />}
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
