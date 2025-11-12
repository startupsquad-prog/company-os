import type { VerticalNavConfig } from '../vertical-nav-types'

export const NAV_FAIRE_ADMIN: VerticalNavConfig = {
  topbarTitle: 'Faire USA',
  basePath: '/faire',
  sections: [
    {
      label: 'Dashboard',
      items: [
        { title: 'Overview', url: '/faire', icon: 'LayoutDashboard' },
        { title: 'Analytics', url: '/faire/analytics', icon: 'BarChart', soon: true },
      ],
    },
    {
      label: 'Orders',
      items: [
        { title: 'All Orders', url: '/faire/orders', icon: 'ShoppingCart' },
        { title: 'Pending', url: '/faire/orders/pending', icon: 'Clock' },
        { title: 'Processing', url: '/faire/orders/processing', icon: 'Package' },
        { title: 'Completed', url: '/faire/orders/completed', icon: 'CheckSquare' },
      ],
    },
    {
      label: 'Products',
      items: [
        { title: 'All Products', url: '/faire/products', icon: 'Package' },
        { title: 'Inventory', url: '/faire/products/inventory', icon: 'Database' },
        { title: 'Categories', url: '/faire/products/categories', icon: 'Tag' },
      ],
    },
    {
      label: 'Settings',
      items: [
        { title: 'General', url: '/faire/settings', icon: 'Settings' },
        { title: 'Shipping', url: '/faire/settings/shipping', icon: 'Truck' },
        { title: 'Integrations', url: '/faire/settings/integrations', icon: 'Plug' },
      ],
    },
  ],
}

