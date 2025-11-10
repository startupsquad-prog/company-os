import { AuthenticatedLayout } from '@/components/authenticated-layout'

export default function CalendarLayout({ children }: { children: React.ReactNode }) {
  return <AuthenticatedLayout>{children}</AuthenticatedLayout>
}

