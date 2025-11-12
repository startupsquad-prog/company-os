import { AuthenticatedLayout } from '@/components/authenticated-layout'

export default function CRMLayout({ children }: { children: React.ReactNode }) {
  return <AuthenticatedLayout>{children}</AuthenticatedLayout>
}







