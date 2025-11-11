import { AuthenticatedLayout } from '@/components/authenticated-layout'

export default function MailLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthenticatedLayout>
      <div className="flex flex-1 flex-col min-w-0 min-h-0 max-h-full overflow-hidden -m-2 sm:-m-3 md:-m-4 lg:-m-5">
        {children}
      </div>
    </AuthenticatedLayout>
  )
}

