import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Skeleton } from './skeleton'

interface LoaderProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function Loader({ className, size = 'md' }: LoaderProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  }

  return (
    <Loader2 className={cn('animate-spin text-muted-foreground', sizeClasses[size], className)} />
  )
}

interface PageLoaderProps {
  className?: string
}

export function PageLoader({ className }: PageLoaderProps) {
  return (
    <div className={cn('flex items-center justify-center h-full min-h-[400px]', className)}>
      <Loader size="lg" />
    </div>
  )
}

interface InlineLoaderProps {
  className?: string
  text?: string
}

export function InlineLoader({ className, text }: InlineLoaderProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Loader size="sm" />
      {text && <span className="text-sm text-muted-foreground">{text}</span>}
    </div>
  )
}

export { Skeleton }

