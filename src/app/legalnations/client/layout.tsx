import { VerticalLayout } from '@/components/vertical/vertical-layout'
import { NAV_LEGALNATIONS_CLIENT } from '@/lib/navigation/configs/legalnations-nav'

export default function LegalNationsClientLayout({ children }: { children: React.ReactNode }) {
  return <VerticalLayout config={NAV_LEGALNATIONS_CLIENT}>{children}</VerticalLayout>
}

