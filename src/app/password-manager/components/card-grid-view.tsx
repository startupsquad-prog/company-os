'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
import { format } from 'date-fns'
import type { CardFull } from '@/lib/types/password-vault'
import { cn } from '@/lib/utils'

interface CardGridViewProps {
  cards: CardFull[]
  onEdit?: (card: CardFull) => void
  onDelete?: (card: CardFull) => void
}

const gradientColors = [
  'from-violet-500 to-purple-600',
  'from-orange-500 to-red-600',
  'from-blue-500 to-cyan-600',
]

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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-0 pt-0">
      {cards.map((card, index) => {
        const isVisible = visibleCards.has(card.id)
        const isCopied = copiedCards.has(card.id)
        const gradient = gradientColors[index % gradientColors.length]
        const cardNumber = card.card_number_encrypted || ''
        const displayNumber = isVisible ? formatCardNumber(cardNumber) : maskCardNumber(cardNumber)
        const expiryDate = card.expiry_month && card.expiry_year
          ? `${String(card.expiry_month).padStart(2, '0')}/${String(card.expiry_year).slice(-2)}`
          : '—'

        return (
          <Card
            key={card.id}
            className={cn(
              'relative overflow-hidden border-0 shadow-lg',
              `bg-gradient-to-br ${gradient} text-white`
            )}
          >
            <div className="p-6 min-h-[200px] flex flex-col justify-between">
              <div className="flex items-start justify-between mb-4">
                <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                  {card.card_type === 'credit' ? 'Credit' : 'Debit'}
                </Badge>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-white hover:bg-white/20"
                    >
                      <span className="sr-only">Open menu</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
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

              <div className="space-y-4">
                <div>
                  <p className="text-xs opacity-80 mb-1">Card Number</p>
                  <div className="flex items-center gap-2">
                    <p className="text-xl font-mono tracking-wider font-semibold">
                      {displayNumber}
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-white hover:bg-white/20"
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
                        className="h-6 w-6 p-0 text-white hover:bg-white/20"
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

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs opacity-80 mb-1">Cardholder</p>
                    <p className="text-sm font-medium">
                      {card.cardholder_name || '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs opacity-80 mb-1">Expires</p>
                    <p className="text-sm font-medium">{expiryDate}</p>
                  </div>
                </div>

                <div>
                  <p className="text-xs opacity-80 mb-1">Bank</p>
                  <p className="text-sm font-medium">{card.bank_name}</p>
                </div>
              </div>
            </div>
          </Card>
        )
      })}
    </div>
  )
}

