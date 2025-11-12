import { VerticalLayout } from '@/components/vertical/vertical-layout'
import { NAV_OLDDEALS_USER } from '@/lib/navigation/configs/olddeals-nav'

export default function OlldealsUserLayout({ children }: { children: React.ReactNode }) {
  return <VerticalLayout config={NAV_OLDDEALS_USER}>{children}</VerticalLayout>
}

