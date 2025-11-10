import { AuthenticatedLayout } from '@/components/authenticated-layout'

export default function AttendanceLayout({ children }: { children: React.ReactNode }) {
  return <AuthenticatedLayout>{children}</AuthenticatedLayout>
}

