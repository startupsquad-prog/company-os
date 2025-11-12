import type { VerticalNavConfig } from '../vertical-nav-types'

export const NAV_OLDDEALS_ADMIN: VerticalNavConfig = {
  topbarTitle: 'Olldeals Admin',
  basePath: '/olddeals/admin',
  sections: [
    {
      label: 'Dashboard',
      items: [
        { title: 'Overview', url: '/olddeals/admin', icon: 'LayoutDashboard' },
        { title: 'Analytics', url: '/olddeals/admin/analytics', icon: 'BarChart' },
      ],
    },
    {
      label: 'Deals',
      items: [
        { title: 'All Deals', url: '/olddeals/admin/deals', icon: 'Handshake' },
        { title: 'Active Deals', url: '/olddeals/admin/deals/active', icon: 'CheckSquare' },
        { title: 'Pending Deals', url: '/olddeals/admin/deals/pending', icon: 'Clock' },
        { title: 'Closed Deals', url: '/olddeals/admin/deals/closed', icon: 'Archive' },
      ],
    },
    {
      label: 'Negotiations',
      items: [
        { title: 'Ongoing', url: '/olddeals/admin/negotiations', icon: 'MessageSquare' },
        { title: 'History', url: '/olddeals/admin/negotiations/history', icon: 'History' },
      ],
    },
    {
      label: 'Users',
      items: [
        { title: 'All Users', url: '/olddeals/admin/users', icon: 'Users' },
        { title: 'Buyers', url: '/olddeals/admin/users/buyers', icon: 'UserCog' },
        { title: 'Sellers', url: '/olddeals/admin/users/sellers', icon: 'Building' },
      ],
    },
    {
      label: 'Settings',
      items: [
        { title: 'General', url: '/olddeals/admin/settings', icon: 'Settings' },
        { title: 'Notifications', url: '/olddeals/admin/settings/notifications', icon: 'Bell' },
        { title: 'Integrations', url: '/olddeals/admin/settings/integrations', icon: 'Plug' },
      ],
    },
  ],
}

export const NAV_OLDDEALS_USER: VerticalNavConfig = {
  topbarTitle: 'Olldeals',
  basePath: '/olddeals/user',
  sections: [
    {
      label: 'My Deals',
      items: [
        { title: 'Dashboard', url: '/olddeals/user', icon: 'Home' },
        { title: 'My Deals', url: '/olddeals/user/deals', icon: 'Handshake' },
        { title: 'Saved Deals', url: '/olddeals/user/saved', icon: 'Bookmark' },
        { title: 'Wishlist', url: '/olddeals/user/wishlist', icon: 'Heart' },
      ],
    },
    {
      label: 'Browse',
      items: [
        { title: 'All Deals', url: '/olddeals/user/browse', icon: 'Search' },
        { title: 'Categories', url: '/olddeals/user/categories', icon: 'Tag' },
        { title: 'Trending', url: '/olddeals/user/trending', icon: 'TrendingUp' },
      ],
    },
    {
      label: 'Account',
      items: [
        { title: 'Profile', url: '/olddeals/user/profile', icon: 'UserCog' },
        { title: 'Settings', url: '/olddeals/user/settings', icon: 'Settings' },
        { title: 'Help', url: '/olddeals/user/help', icon: 'HelpCircle' },
      ],
    },
  ],
}

