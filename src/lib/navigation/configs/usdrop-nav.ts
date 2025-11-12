import type { VerticalNavConfig } from '../vertical-nav-types'

export const NAV_USDROP_ADMIN: VerticalNavConfig = {
  topbarTitle: 'USDrop Admin',
  basePath: '/usdrop/admin',
  sections: [
    {
      label: 'Overview',
      items: [
        { title: 'Dashboard', url: '/usdrop/admin', icon: 'LayoutDashboard' },
        { title: 'Health & Incidents', url: '/usdrop/admin/health', icon: 'Activity' },
      ],
    },
    {
      label: 'Users & Plans',
      items: [
        { title: 'Users', url: '/usdrop/admin/users', icon: 'Users' },
        { title: 'Subscriptions', url: '/usdrop/admin/subscriptions', icon: 'CreditCard' },
        { title: 'Entitlements', url: '/usdrop/admin/entitlements', icon: 'KeyRound', soon: true },
      ],
    },
    {
      label: 'Catalog & Research',
      items: [
        { title: 'Product Research (AI)', url: '/usdrop/admin/research', icon: 'Search' },
        { title: 'Sources & Integrations', url: '/usdrop/admin/integrations', icon: 'Plug' },
        { title: 'Compliance Rules', url: '/usdrop/admin/compliance', icon: 'ShieldCheck', soon: true },
      ],
    },
    {
      label: 'Ops',
      items: [
        { title: 'Jobs & Queues', url: '/usdrop/admin/jobs', icon: 'Server' },
        { title: 'Webhooks', url: '/usdrop/admin/webhooks', icon: 'Webhook' },
        { title: 'Logs', url: '/usdrop/admin/logs', icon: 'ListTree' },
      ],
    },
    {
      label: 'Settings',
      items: [
        { title: 'General', url: '/usdrop/admin/settings', icon: 'Settings' },
        { title: 'RBAC & Permissions', url: '/usdrop/admin/rbac', icon: 'Lock' },
        { title: 'Billing', url: '/usdrop/admin/billing', icon: 'Receipt' },
      ],
    },
  ],
}

export const NAV_USDROP_USER: VerticalNavConfig = {
  topbarTitle: 'USDrop',
  basePath: '/usdrop/user',
  planBadge: 'free', // Will be dynamic based on user's plan
  sections: [
    {
      label: 'My Workspace',
      items: [
        { title: 'Home', url: '/usdrop/user', icon: 'Home' },
        { title: 'Winning Products', url: '/usdrop/user/winning', icon: 'Trophy' },
        { title: 'Research (AI)', url: '/usdrop/user/research', icon: 'Search' },
        { title: 'Saved Lists', url: '/usdrop/user/lists', icon: 'Bookmark' },
      ],
    },
    {
      label: 'Store Ops',
      items: [
        { title: 'Shopify Connect', url: '/usdrop/user/shopify', icon: 'Store' },
        { title: 'Import to Store', url: '/usdrop/user/import', icon: 'Download' },
        { title: 'Listings Optimizer (AI)', url: '/usdrop/user/listings', icon: 'Sparkles' },
        { title: 'Orders', url: '/usdrop/user/orders', icon: 'Receipt' },
      ],
    },
    {
      label: 'Insights',
      items: [
        { title: 'Trends & Alerts', url: '/usdrop/user/trends', icon: 'TrendingUp', soon: true },
        { title: 'Profit Calculator', url: '/usdrop/user/profit', icon: 'Calculator' },
      ],
    },
    {
      label: 'Account',
      items: [
        { title: 'Plan & Billing', url: '/usdrop/user/billing', icon: 'CreditCard' },
        { title: 'Integrations', url: '/usdrop/user/integrations', icon: 'Plug' },
        { title: 'Help Center', url: '/usdrop/user/help', icon: 'HelpCircle' },
      ],
    },
  ],
}

