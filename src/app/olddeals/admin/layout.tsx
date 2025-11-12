import { VerticalLayout } from '@/components/vertical/vertical-layout'
import { NAV_OLDDEALS_ADMIN } from '@/lib/navigation/configs/olddeals-nav'

export default function OlldealsAdminLayout({ children }: { children: React.ReactNode }) {
  return <VerticalLayout config={NAV_OLDDEALS_ADMIN}>{children}</VerticalLayout>
}

