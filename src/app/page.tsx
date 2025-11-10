import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function Home() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="text-center space-y-4 w-full max-w-md">
        <h1 className="text-3xl sm:text-4xl font-bold">Company OS</h1>
        <p className="text-muted-foreground text-sm sm:text-base">Internal platform for managing all departments</p>
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
          <Button asChild className="w-full sm:w-auto">
            <Link href="/dashboard">Go to Dashboard</Link>
          </Button>
          <Button asChild variant="outline" className="w-full sm:w-auto">
            <Link href="/login">Login</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
