import { VerticalLayout } from '@/components/vertical/vertical-layout'
import { NAV_USDROP_ADMIN } from '@/lib/navigation/configs/usdrop-nav'

export default function USDropAdminLayout({ children }: { children: React.ReactNode }) {
  return <VerticalLayout config={NAV_USDROP_ADMIN}>{children}</VerticalLayout>
}

