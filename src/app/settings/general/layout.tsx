import { AuthenticatedLayout } from '@/components/authenticated-layout'

export default function GeneralSettingsLayout({ children }: { children: React.ReactNode }) {
  return <AuthenticatedLayout>{children}</AuthenticatedLayout>
}

