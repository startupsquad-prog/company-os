import { AuthenticatedLayout } from '@/components/authenticated-layout'

export default function RBACLayout({ children }: { children: React.ReactNode }) {
  return <AuthenticatedLayout>{children}</AuthenticatedLayout>
}

