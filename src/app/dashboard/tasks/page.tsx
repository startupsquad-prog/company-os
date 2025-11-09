import { redirect } from 'next/navigation'

// Redirect /dashboard/tasks to /tasks
export default function DashboardTasksPage() {
  redirect('/tasks')
}
