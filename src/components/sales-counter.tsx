'use client'

import { useState } from 'react'
import { RainbowButton } from '@/components/ui/rainbow-button'
import { SalesModal } from '@/components/sales-modal'
import { useSalesData } from '@/lib/hooks/useSalesData'
import { InlineLoader } from '@/components/ui/loader'

export function SalesCounter() {
  const [modalOpen, setModalOpen] = useState(false)
  const { data, loading } = useSalesData()

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount)
  }

  if (loading || !data) {
    return (
      <RainbowButton disabled>
        <span className="flex items-center gap-2">
          Sales - <InlineLoader text="" />
        </span>
      </RainbowButton>
    )
  }

  return (
    <>
      <RainbowButton onClick={() => setModalOpen(true)}>
        Sales - {formatCurrency(data.current)}
      </RainbowButton>
      <SalesModal open={modalOpen} onOpenChange={setModalOpen} />
    </>
  )
}

