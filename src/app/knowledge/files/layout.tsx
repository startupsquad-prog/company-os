import { AuthenticatedLayout } from '@/components/authenticated-layout'

export default function FilesLayout({ children }: { children: React.ReactNode }) {
  return <AuthenticatedLayout>{children}</AuthenticatedLayout>
}

