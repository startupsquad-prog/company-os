import { AuthenticatedLayout } from '@/components/authenticated-layout'

export default function DebugUserLayout({ children }: { children: React.ReactNode }) {
  return <AuthenticatedLayout>{children}</AuthenticatedLayout>
}

