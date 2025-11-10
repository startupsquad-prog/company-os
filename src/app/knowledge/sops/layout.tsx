import { AuthenticatedLayout } from '@/components/authenticated-layout'

export default function SOPsLayout({ children }: { children: React.ReactNode }) {
  return <AuthenticatedLayout>{children}</AuthenticatedLayout>
}

