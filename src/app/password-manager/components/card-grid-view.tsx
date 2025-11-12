'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreHorizontal, Eye, EyeOff, Edit, Trash2, Copy, Check, CreditCard } from 'lucide-react'
import { toast } from 'sonner'
import type { CardFull } from '@/lib/types/password-vault'
import { cn } from '@/lib/utils'

interface CardGridViewProps {
  cards: CardFull[]
  onEdit?: (card: CardFull) => void
  onDelete?: (card: CardFull) => void
}

// Card design variations inspired by Figma
const cardDesigns = [
  {
    bg: 'bg-[#5252ff]',
    gradient: 'bg-gradient-to-br from-[#5252ff] to-[#3d3dff]',
    overlay1: 'from-blue-400/30 to-transparent',
    overlay2: 'from-purple-400/20 to-transparent',
  },
  {
    bg: 'bg-[#ff6b35]',
    gradient: 'bg-gradient-to-br from-[#ff6b35] to-[#ff4500]',
    overlay1: 'from-orange-300/30 to-transparent',
    overlay2: 'from-red-300/20 to-transparent',
  },
  {
    bg: 'bg-[#10b981]',
    gradient: 'bg-gradient-to-br from-[#10b981] to-[#059669]',
    overlay1: 'from-green-300/30 to-transparent',
    overlay2: 'from-emerald-300/20 to-transparent',
  },
  {
    bg: 'bg-[#8b5cf6]',
    gradient: 'bg-gradient-to-br from-[#8b5cf6] to-[#7c3aed]',
    overlay1: 'from-violet-300/30 to-transparent',
    overlay2: 'from-purple-300/20 to-transparent',
  },
  {
    bg: 'bg-[#06b6d4]',
    gradient: 'bg-gradient-to-br from-[#06b6d4] to-[#0891b2]',
    overlay1: 'from-cyan-300/30 to-transparent',
    overlay2: 'from-blue-300/20 to-transparent',
  },
  {
    bg: 'bg-[#f59e0b]',
    gradient: 'bg-gradient-to-br from-[#f59e0b] to-[#d97706]',
    overlay1: 'from-amber-300/30 to-transparent',
    overlay2: 'from-yellow-300/20 to-transparent',
  },
  {
    bg: 'bg-[#ec4899]',
    gradient: 'bg-gradient-to-br from-[#ec4899] to-[#db2777]',
    overlay1: 'from-pink-300/30 to-transparent',
    overlay2: 'from-rose-300/20 to-transparent',
  },
  {
    bg: 'bg-[#6366f1]',
    gradient: 'bg-gradient-to-br from-[#6366f1] to-[#4f46e5]',
    overlay1: 'from-indigo-300/30 to-transparent',
    overlay2: 'from-blue-300/20 to-transparent',
  },
]

// Mastercard Logo SVG Component
function MastercardLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <circle cx="18" cy="14" r="10" fill="#EB001B" />
      <circle cx="30" cy="14" r="10" fill="#F79E1B" />
      <path
        d="M24 6.5C26.5 8.5 28 11.2 28 14C28 16.8 26.5 19.5 24 21.5C21.5 19.5 20 16.8 20 14C20 11.2 21.5 8.5 24 6.5Z"
        fill="#FF5F00"
      />
    </svg>
  )
}

export function CardGridView({ cards, onEdit, onDelete }: CardGridViewProps) {
  const [visibleCards, setVisibleCards] = useState<Set<string>>(new Set())
  const [copiedCards, setCopiedCards] = useState<Set<string>>(new Set())

  const toggleVisibility = (cardId: string) => {
    setVisibleCards((prev) => {
      const next = new Set(prev)
      if (next.has(cardId)) {
        next.delete(cardId)
      } else {
        next.add(cardId)
      }
      return next
    })
  }

  const handleCopy = async (cardNumber: string, cardId: string) => {
    try {
      await navigator.clipboard.writeText(cardNumber)
      setCopiedCards((prev) => new Set(prev).add(cardId))
      toast.success('Card number copied to clipboard')
      setTimeout(() => {
        setCopiedCards((prev) => {
          const next = new Set(prev)
          next.delete(cardId)
          return next
        })
      }, 2000)
    } catch (error) {
      toast.error('Failed to copy card number')
    }
  }

  const maskCardNumber = (cardNumber: string): string => {
    if (!cardNumber || cardNumber.length < 4) return '•••• •••• •••• ••••'
    const last4 = cardNumber.slice(-4)
    return `•••• •••• •••• ${last4}`
  }

  const formatCardNumber = (cardNumber: string): string => {
    // Format as XXXX XXXX XXXX XXXX
    return cardNumber.replace(/(.{4})/g, '$1 ').trim()
  }

  if (cards.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <div className="text-center">
          <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No cards found</p>
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-0 pt-0">
      {cards.map((card, index) => {
        const isVisible = visibleCards.has(card.id)
        const isCopied = copiedCards.has(card.id)
        const design = cardDesigns[index % cardDesigns.length]
        const cardNumber = card.card_number_encrypted || ''
        const displayNumber = isVisible ? formatCardNumber(cardNumber) : maskCardNumber(cardNumber)
        const expiryDate = card.expiry_month && card.expiry_year
          ? `${String(card.expiry_month).padStart(2, '0')}/${String(card.expiry_year).slice(-2)}`
          : '—'
        const cardholderName = card.cardholder_name?.toUpperCase() || '—'

        return (
          <Card
            key={card.id}
            className={cn(
              'relative overflow-hidden border-0 shadow-lg',
              'rounded-xl aspect-[343/218] min-h-[150px]',
              design.gradient,
              'text-white'
            )}
          >
            {/* Decorative Overlays - Reduced by 25% */}
            <div
              className={cn(
                'absolute -left-[46px] -top-[22px] w-[209px] h-[209px] rounded-full',
                'bg-gradient-to-br',
                design.overlay1,
                'blur-2xl'
              )}
            />
            <div
              className={cn(
                'absolute -left-[77px] -top-[69px] w-[256px] h-[256px] rounded-full',
                'bg-gradient-to-br',
                design.overlay2,
                'blur-2xl'
              )}
            />

            {/* Content Container - Reduced padding */}
            <div className="relative h-full flex flex-col justify-between p-4">
              {/* Top Section */}
              <div className="flex items-start justify-between">
                {/* Card Type Label */}
                <div className="flex flex-col justify-center">
                  <p className="text-xs font-medium leading-none text-white">
                    {card.card_type === 'credit' ? 'Credit' : 'Debit'}
                  </p>
                </div>

                {/* Right Side - Logo and Menu */}
                <div className="flex items-center gap-1.5">
                  {/* Mastercard Logo - Reduced size */}
                  <div className="h-5 w-9 flex-shrink-0">
                    <MastercardLogo className="w-full h-full" />
                  </div>
                  
                  {/* Dropdown Menu */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-white hover:bg-white/20 rounded-full"
                      >
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-3.5 w-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => onEdit?.(card)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onDelete?.(card)} className="text-destructive">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Center Section - Card Number */}
              <div className="flex-1 flex items-center">
                <div className="w-full">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <p className="text-lg font-bold font-mono tracking-[0.36px] text-[#fdfdfd] leading-none">
                      {displayNumber}
                    </p>
                    <div className="flex items-center gap-0.5">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-5 w-5 p-0 text-white/80 hover:bg-white/20 hover:text-white rounded-full"
                        onClick={() => toggleVisibility(card.id)}
                      >
                        {isVisible ? (
                          <EyeOff className="h-3 w-3" />
                        ) : (
                          <Eye className="h-3 w-3" />
                        )}
                      </Button>
                      {isVisible && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-5 w-5 p-0 text-white/80 hover:bg-white/20 hover:text-white rounded-full"
                          onClick={() => handleCopy(cardNumber, card.id)}
                        >
                          {isCopied ? (
                            <Check className="h-3 w-3 text-green-300" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Section - Cardholder and Expiry */}
              <div className="flex items-center justify-between">
                <div className="flex flex-col justify-center">
                  <p className="text-[10px] font-medium leading-none text-white tracking-[0.9px] uppercase">
                    {cardholderName}
                  </p>
                </div>
                <div className="flex flex-col justify-center items-end">
                  <p className="text-[10px] font-medium leading-none text-white">
                    {expiryDate}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        )
      })}
    </div>
  )
}

