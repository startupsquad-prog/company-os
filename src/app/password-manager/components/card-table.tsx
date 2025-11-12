'use client'

import { CardGridView } from './card-grid-view'
import type { CardFull } from '@/lib/types/password-vault'

interface CardTableProps {
  cards: CardFull[]
  onEdit?: (card: CardFull) => void
  onDelete?: (card: CardFull) => void
}

export function CardTable({ cards, onEdit, onDelete }: CardTableProps) {
  return <CardGridView cards={cards} onEdit={onEdit} onDelete={onDelete} />
}



