import { RecentActivity } from '@/components/home/types'

export const recentActivities: RecentActivity[] = [
  {
    id: 'activity-1',
    type: 'task',
    title: 'Task Completed',
    description: 'John Doe completed "Review Q4 Sales Report"',
    user: {
      name: 'John Doe',
      avatar: undefined,
    },
    timestamp: '2 minutes ago',
    url: '/tasks',
  },
  {
    id: 'activity-2',
    type: 'lead',
    title: 'New Lead Created',
    description: 'Sarah Smith created a new lead "Acme Corporation"',
    user: {
      name: 'Sarah Smith',
      avatar: undefined,
    },
    timestamp: '15 minutes ago',
    url: '/crm/leads',
  },
  {
    id: 'activity-3',
    type: 'message',
    title: 'New Message',
    description: 'You received a message from Alice Johnson',
    user: {
      name: 'Alice Johnson',
      avatar: undefined,
    },
    timestamp: '1 hour ago',
    url: '/messages',
  },
  {
    id: 'activity-4',
    type: 'status',
    title: 'Status Updated',
    description: 'Lead "Tech Solutions Inc" moved to Qualified',
    user: {
      name: 'Mike Wilson',
      avatar: undefined,
    },
    timestamp: '2 hours ago',
    url: '/crm/leads',
  },
  {
    id: 'activity-5',
    type: 'file',
    title: 'File Uploaded',
    description: 'Emily Davis uploaded "Product Catalog 2024.pdf"',
    user: {
      name: 'Emily Davis',
      avatar: undefined,
    },
    timestamp: '3 hours ago',
    url: '/documents',
  },
  {
    id: 'activity-6',
    type: 'user',
    title: 'User Added',
    description: 'New user "Robert Brown" was added to the system',
    user: {
      name: 'Admin',
      avatar: undefined,
    },
    timestamp: '5 hours ago',
    url: '/users',
  },
]

