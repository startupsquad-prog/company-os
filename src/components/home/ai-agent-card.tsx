'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AIAgent } from './types'
import { cn } from '@/lib/utils'
import { useState } from 'react'

interface AIAgentCardProps {
  agent: AIAgent
  onClick?: () => void
}

export function AIAgentCard({ agent, onClick }: AIAgentCardProps) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <Card
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        'h-full transition-all duration-300 hover:scale-[1.02] hover:shadow-xl cursor-pointer',
        'border-2 hover:border-primary/50 group relative overflow-hidden',
        'hover:-translate-y-1'
      )}
    >
      <div
        className={cn(
          'absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-10 transition-opacity',
          agent.color
        )}
      />
      <CardContent className="p-4 relative">
        <div className="flex flex-col items-center text-center gap-3">
          <div
            className={cn(
              'h-16 w-16 rounded-xl flex items-center justify-center flex-shrink-0',
              'bg-gradient-to-br shadow-sm group-hover:shadow-md transition-all',
              'group-hover:scale-110',
              agent.color
            )}
          >
            <agent.icon className="h-7 w-7 text-white" />
          </div>
          <div className="flex-1 min-w-0 w-full">
            <div className="flex items-center justify-center gap-2 mb-1">
              <h3 className="font-semibold text-sm group-hover:text-primary transition-colors">
                {agent.name}
              </h3>
            </div>
            <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
              {agent.description}
            </p>
            <Badge variant="outline" className="text-xs">
              {agent.category}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

