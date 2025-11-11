'use client'

import { useEffect, useState } from 'react'

/**
 * ClientOnly - Renders children only on the client side
 * This prevents hydration mismatches for components that generate
 * different content on server vs client (e.g., Radix UI with random IDs)
 */
export function ClientOnly({ children, fallback = null }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  const [hasMounted, setHasMounted] = useState(false)

  useEffect(() => {
    setHasMounted(true)
  }, [])

  if (!hasMounted) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

