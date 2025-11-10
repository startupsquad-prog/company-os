import { format, addDays } from 'date-fns'

export interface UpcomingDeadline {
  id: string
  title: string
  type: 'task' | 'meeting' | 'delivery' | 'deadline'
  dueDate: Date
  priority: 'high' | 'medium' | 'low'
  status: 'pending' | 'in-progress' | 'completed'
  assignee?: string
  url?: string
}

export const upcomingDeadlines: UpcomingDeadline[] = [
  {
    id: 'deadline-1',
    title: 'Review Q4 Sales Report',
    type: 'task',
    dueDate: addDays(new Date(), 2),
    priority: 'high',
    status: 'pending',
    assignee: 'John Doe',
    url: '/tasks',
  },
  {
    id: 'deadline-2',
    title: 'Client Presentation - Acme Corp',
    type: 'meeting',
    dueDate: addDays(new Date(), 3),
    priority: 'high',
    status: 'pending',
    assignee: 'Sarah Smith',
    url: '/calendar',
  },
  {
    id: 'deadline-3',
    title: 'Product Launch Documentation',
    type: 'delivery',
    dueDate: addDays(new Date(), 5),
    priority: 'medium',
    status: 'in-progress',
    assignee: 'Emily Davis',
    url: '/documents',
  },
  {
    id: 'deadline-4',
    title: 'Monthly Team Review',
    type: 'meeting',
    dueDate: addDays(new Date(), 7),
    priority: 'medium',
    status: 'pending',
    assignee: 'Mike Wilson',
    url: '/calendar',
  },
  {
    id: 'deadline-5',
    title: 'Budget Planning for Q1',
    type: 'deadline',
    dueDate: addDays(new Date(), 10),
    priority: 'high',
    status: 'pending',
    assignee: 'Robert Brown',
    url: '/tasks',
  },
]

