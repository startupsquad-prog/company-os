import { AuthenticatedLayout } from '@/components/authenticated-layout'

export default function TicketsLayout({ children }: { children: React.ReactNode }) {
  return <AuthenticatedLayout>{children}</AuthenticatedLayout>
}

