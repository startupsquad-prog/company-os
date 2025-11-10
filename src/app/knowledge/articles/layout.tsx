import { AuthenticatedLayout } from '@/components/authenticated-layout'

export default function KnowledgeArticlesLayout({ children }: { children: React.ReactNode }) {
  return <AuthenticatedLayout>{children}</AuthenticatedLayout>
}

