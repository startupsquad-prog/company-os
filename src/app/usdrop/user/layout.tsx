import { VerticalLayout } from '@/components/vertical/vertical-layout'
import { NAV_USDROP_USER } from '@/lib/navigation/configs/usdrop-nav'

export default function USDropUserLayout({ children }: { children: React.ReactNode }) {
  return <VerticalLayout config={NAV_USDROP_USER}>{children}</VerticalLayout>
}

