import { VerticalLayout } from '@/components/vertical/vertical-layout'
import { NAV_LEGALNATIONS_ADMIN } from '@/lib/navigation/configs/legalnations-nav'

export default function LegalNationsAdminLayout({ children }: { children: React.ReactNode }) {
  return <VerticalLayout config={NAV_LEGALNATIONS_ADMIN}>{children}</VerticalLayout>
}

