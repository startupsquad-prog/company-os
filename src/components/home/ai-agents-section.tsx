'use client'

import { useState } from 'react'
import { AIAgentCard } from './ai-agent-card'
import { aiAgents } from '@/lib/home/ai-agents-data'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'

export function AIAgentsSection() {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredAgents = aiAgents.filter(
    (agent) =>
      !searchQuery.trim() ||
      agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.category.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleAgentClick = (agentId: string) => {
    // TODO: Open agent chat panel
    console.log('Open agent:', agentId)
  }

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-semibold">AI Agents</h2>
          <p className="text-sm text-muted-foreground">
            Interact with specialized AI assistants
          </p>
        </div>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search agents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {filteredAgents.map((agent) => (
          <AIAgentCard
            key={agent.id}
            agent={agent}
            onClick={() => handleAgentClick(agent.id)}
          />
        ))}
      </div>

      {filteredAgents.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-sm">No agents found matching "{searchQuery}"</p>
        </div>
      )}
    </div>
  )
}

