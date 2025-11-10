import { AuthenticatedLayout } from '@/components/authenticated-layout'

export default function ImportOpsLayout({ children }: { children: React.ReactNode }) {
  return <AuthenticatedLayout>{children}</AuthenticatedLayout>
}

