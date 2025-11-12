import { VerticalLayout } from '@/components/vertical/vertical-layout'
import { NAV_FAIRE_ADMIN } from '@/lib/navigation/configs/faire-nav'

export default function FaireLayout({ children }: { children: React.ReactNode }) {
  return <VerticalLayout config={NAV_FAIRE_ADMIN}>{children}</VerticalLayout>
}

