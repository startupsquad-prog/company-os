import { AuthenticatedLayout } from '@/components/authenticated-layout'

export default function PermissionsLayout({ children }: { children: React.ReactNode }) {
  return <AuthenticatedLayout>{children}</AuthenticatedLayout>
}

