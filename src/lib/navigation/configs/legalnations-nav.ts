import type { VerticalNavConfig } from '../vertical-nav-types'

export const NAV_LEGALNATIONS_ADMIN: VerticalNavConfig = {
  topbarTitle: 'LegalNations Admin',
  basePath: '/legalnations/admin',
  sections: [
    {
      label: 'Dashboard',
      items: [
        { title: 'Overview', url: '/legalnations/admin', icon: 'LayoutDashboard' },
        { title: 'Analytics', url: '/legalnations/admin/analytics', icon: 'BarChart' },
      ],
    },
    {
      label: 'Cases',
      items: [
        { title: 'All Cases', url: '/legalnations/admin/cases', icon: 'FileText' },
        { title: 'Active Cases', url: '/legalnations/admin/cases/active', icon: 'Clock' },
        { title: 'Closed Cases', url: '/legalnations/admin/cases/closed', icon: 'Archive' },
      ],
    },
    {
      label: 'Documents',
      items: [
        { title: 'All Documents', url: '/legalnations/admin/documents', icon: 'FileText' },
        { title: 'Templates', url: '/legalnations/admin/documents/templates', icon: 'FileCheck' },
        { title: 'Archive', url: '/legalnations/admin/documents/archive', icon: 'Archive' },
      ],
    },
    {
      label: 'Compliance',
      items: [
        { title: 'Rules & Regulations', url: '/legalnations/admin/compliance', icon: 'ShieldCheck' },
        { title: 'Audits', url: '/legalnations/admin/compliance/audits', icon: 'FileCheck' },
        { title: 'Reports', url: '/legalnations/admin/compliance/reports', icon: 'BarChart' },
      ],
    },
    {
      label: 'Settings',
      items: [
        { title: 'General', url: '/legalnations/admin/settings', icon: 'Settings' },
        { title: 'Users & Roles', url: '/legalnations/admin/settings/users', icon: 'Users' },
        { title: 'Integrations', url: '/legalnations/admin/settings/integrations', icon: 'Plug' },
      ],
    },
  ],
}

export const NAV_LEGALNATIONS_CLIENT: VerticalNavConfig = {
  topbarTitle: 'LegalNations',
  basePath: '/legalnations/client',
  sections: [
    {
      label: 'My Cases',
      items: [
        { title: 'Dashboard', url: '/legalnations/client', icon: 'Home' },
        { title: 'My Cases', url: '/legalnations/client/cases', icon: 'FileText' },
        { title: 'Case Status', url: '/legalnations/client/cases/status', icon: 'CheckSquare' },
      ],
    },
    {
      label: 'Documents',
      items: [
        { title: 'My Documents', url: '/legalnations/client/documents', icon: 'FileText' },
        { title: 'Shared Documents', url: '/legalnations/client/documents/shared', icon: 'Share' },
        { title: 'Upload', url: '/legalnations/client/documents/upload', icon: 'Upload' },
      ],
    },
    {
      label: 'Communication',
      items: [
        { title: 'Messages', url: '/legalnations/client/messages', icon: 'MessageSquare' },
        { title: 'Appointments', url: '/legalnations/client/appointments', icon: 'Calendar' },
      ],
    },
    {
      label: 'Account',
      items: [
        { title: 'Profile', url: '/legalnations/client/profile', icon: 'UserCog' },
        { title: 'Settings', url: '/legalnations/client/settings', icon: 'Settings' },
        { title: 'Help', url: '/legalnations/client/help', icon: 'HelpCircle' },
      ],
    },
  ],
}

