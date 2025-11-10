'use client'

import { useMemo } from 'react'
import { useUser } from '@clerk/nextjs'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

export function GreetingSection() {
  const { user } = useUser()
  const userName = user?.fullName || user?.firstName || 'there'

  const { greeting } = useMemo(() => {
    const hour = new Date().getHours()
    if (hour < 12) {
      return { greeting: 'Good morning' }
    } else if (hour < 17) {
      return { greeting: 'Good afternoon' }
    } else {
      return { greeting: 'Good evening' }
    }
  }, [])

  const currentDate = format(new Date(), 'EEEE, MMMM d, yyyy')
  const currentTime = format(new Date(), 'h:mm a')

  return (
    <div className="flex flex-col gap-2 mb-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-2">
            <span className="inline-block animate-fade-in">
              {greeting}
            </span>
            {', '}
            <span
              className={cn(
                'inline-block bg-gradient-to-r from-primary via-primary/80 to-primary bg-clip-text text-transparent',
                'bg-[length:200%_auto] animate-gradient-shift'
              )}
            >
              {userName}
            </span>
          </h1>
          <p className="text-muted-foreground text-sm md:text-base">
            {currentDate} • {currentTime}
          </p>
        </div>
      </div>
    </div>
  )
}

