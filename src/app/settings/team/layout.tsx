import { AuthenticatedLayout } from '@/components/authenticated-layout'

export default function TeamSettingsLayout({ children }: { children: React.ReactNode }) {
  return <AuthenticatedLayout>{children}</AuthenticatedLayout>
}

