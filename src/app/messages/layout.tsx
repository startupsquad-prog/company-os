import { AuthenticatedLayout } from '@/components/authenticated-layout'

export default function MessagesLayout({ children }: { children: React.ReactNode }) {
  return <AuthenticatedLayout>{children}</AuthenticatedLayout>
}

