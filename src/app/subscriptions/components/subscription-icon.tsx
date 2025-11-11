'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { CreditCard } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SubscriptionIconProps {
  iconUrl: string | null | undefined
  subscriptionName: string
  className?: string
  size?: number
}

export function SubscriptionIcon({ iconUrl, subscriptionName, className, size = 24 }: SubscriptionIconProps) {
  const [isAnimated, setIsAnimated] = useState(false)
  const [svgError, setSvgError] = useState(false)
  const [iframeError, setIframeError] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    if (iconUrl) {
      setIsAnimated(iconUrl.endsWith('.html'))
      setSvgError(false)
      setIframeError(false)
    }
  }, [iconUrl])

  // If no icon URL, show default credit card icon
  if (!iconUrl || iframeError || svgError) {
    return (
      <div className={cn('flex items-center justify-center bg-primary/10 rounded-lg', className)} style={{ width: size, height: size }}>
        <CreditCard className="h-4 w-4 text-primary" style={{ width: size * 0.6, height: size * 0.6 }} />
      </div>
    )
  }

  // Handle animated HTML icons
  if (isAnimated) {
    return (
      <div className={cn('flex items-center justify-center rounded-lg overflow-hidden bg-transparent', className)} style={{ width: size, height: size }}>
        <iframe
          ref={iframeRef}
          src={iconUrl}
          className="w-full h-full border-0 pointer-events-none"
          style={{ width: size, height: size, minWidth: size, minHeight: size }}
          title={`${subscriptionName} icon`}
          sandbox="allow-scripts allow-same-origin"
          onError={() => setIframeError(true)}
          loading="lazy"
        />
      </div>
    )
  }

  // Handle SVG icons
  return (
    <div className={cn('flex items-center justify-center rounded-lg overflow-hidden bg-transparent', className)} style={{ width: size, height: size }}>
      <Image
        src={iconUrl}
        alt={`${subscriptionName} icon`}
        width={size}
        height={size}
        className="object-contain"
        onError={() => setSvgError(true)}
        unoptimized
        style={{ width: size, height: size }}
      />
    </div>
  )
}

