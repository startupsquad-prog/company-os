import { AuthenticatedLayout } from '@/components/authenticated-layout'

export default function PasswordManagerLayout({ children }: { children: React.ReactNode }) {
  return <AuthenticatedLayout>{children}</AuthenticatedLayout>
}

