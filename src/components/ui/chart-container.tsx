'use client'

import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface ChartContainerProps {
  children: ReactNode
  className?: string
  config?: Record<string, { label: string; color: string }>
}

export function ChartContainer({ children, className, config }: ChartContainerProps) {
  return (
    <div className={cn('w-full', className)} style={{ minHeight: '200px' }}>
      {children}
    </div>
  )
}

