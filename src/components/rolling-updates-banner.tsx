'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { Megaphone } from 'lucide-react'

type Update = {
  id: string
  message: string
  timestamp?: string
}

const sampleUpdates: Update[] = [
  {
    id: '1',
    message: 'New CRM features now available! Enhanced lead tracking and pipeline management.',
    timestamp: '2 hours ago',
  },
  {
    id: '2',
    message: 'System maintenance scheduled for this weekend. All services will remain available.',
    timestamp: '5 hours ago',
  },
  {
    id: '3',
    message: 'Welcome to Company OS Enterprise! Your all-in-one business management platform.',
    timestamp: '1 day ago',
  },
  {
    id: '4',
    message: 'New integrations available: Slack, Gmail, and WhatsApp connectors are now live.',
    timestamp: '2 days ago',
  },
  {
    id: '5',
    message: 'Performance improvements deployed. Experience faster page loads across all modules.',
    timestamp: '3 days ago',
  },
]

export function RollingUpdatesBanner() {
  const [currentIndex, setCurrentIndex] = React.useState(0)
  const [isAnimating, setIsAnimating] = React.useState(false)
  const [nextIndex, setNextIndex] = React.useState(1)

  React.useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true)
      setNextIndex((currentIndex + 1) % sampleUpdates.length)
      
      // Wait for animation to complete before changing index
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % sampleUpdates.length)
        setIsAnimating(false)
      }, 600) // Animation duration
    }, 5000) // Change update every 5 seconds

    return () => clearInterval(interval)
  }, [currentIndex])

  const currentUpdate = sampleUpdates[currentIndex]
  const upcomingUpdate = sampleUpdates[nextIndex]

  return (
    <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-b from-[#4A4A4A] to-[#363636] text-white shadow-none border-none">
        <Megaphone className="h-4 w-4 text-white/80 flex-shrink-0" />
        <div className="flex-1 min-w-0 relative h-6 overflow-hidden">
          {/* Current update - slides up and out */}
          <div
            className={cn(
              'absolute inset-0 flex items-center transition-all duration-[600ms] ease-in-out',
              isAnimating ? '-translate-y-full opacity-0' : 'translate-y-0 opacity-100'
            )}
          >
            <span className="text-sm font-medium text-white truncate">
              {currentUpdate.message}
            </span>
            {currentUpdate.timestamp && (
              <span className="ml-2 text-xs text-white/60 whitespace-nowrap">
                • {currentUpdate.timestamp}
              </span>
            )}
          </div>
          
          {/* Next update - slides up and in */}
          {isAnimating && (
            <div 
              className="absolute inset-0 flex items-center translate-y-full opacity-0 animate-[slideUpIn_0.6s_ease-in-out_forwards]"
              style={{
                animation: 'slideUpIn 0.6s ease-in-out forwards',
              }}
            >
              <span className="text-sm font-medium text-white truncate">
                {upcomingUpdate.message}
              </span>
              {upcomingUpdate.timestamp && (
                <span className="ml-2 text-xs text-white/60 whitespace-nowrap">
                  • {upcomingUpdate.timestamp}
                </span>
              )}
            </div>
          )}
        </div>
        <div className="flex gap-1 flex-shrink-0">
          {sampleUpdates.map((_, index) => (
            <div
              key={index}
              className={cn(
                'h-1.5 rounded-full transition-all duration-300',
                index === currentIndex
                  ? 'bg-white w-2'
                  : 'bg-white/40 w-1.5'
              )}
            />
          ))}
        </div>
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes slideUpIn {
            from {
              transform: translateY(100%);
              opacity: 0;
            }
            to {
              transform: translateY(0);
              opacity: 1;
            }
          }
        `
      }} />
      </div>
  )
}

