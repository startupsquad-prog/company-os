import { AuthenticatedLayout } from '@/components/authenticated-layout'

export default function ATSLayout({ children }: { children: React.ReactNode }) {
  return <AuthenticatedLayout>{children}</AuthenticatedLayout>
}

