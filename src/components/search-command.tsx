'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, CheckSquare, Users, Building2, User, Loader2 } from 'lucide-react'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface SearchResult {
  tasks: Array<{
    id: string
    title?: string
    description?: string
    status?: string
    priority?: string
    created_at?: string
  }>
  contacts: Array<{
    id: string
    name?: string
    email?: string
    phone?: string
    contact_type?: string
    created_at?: string
  }>
  companies: Array<{
    id: string
    name?: string
    legal_name?: string
    website?: string
    industry?: string
    created_at?: string
  }>
  profiles: Array<{
    id: string
    first_name?: string
    last_name?: string
    email?: string
    phone?: string
    created_at?: string
  }>
  total: number
}

interface SearchCommandProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SearchCommand({ open, onOpenChange }: SearchCommandProps) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult>({
    tasks: [],
    contacts: [],
    companies: [],
    profiles: [],
    total: 0,
  })
  const [loading, setLoading] = useState(false)

  // Reset query when dialog closes
  useEffect(() => {
    if (!open) {
      setQuery('')
      setResults({ tasks: [], contacts: [], companies: [], profiles: [], total: 0 })
    }
  }, [open])

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults({ tasks: [], contacts: [], companies: [], profiles: [], total: 0 })
      setLoading(false)
      return
    }

    setLoading(true)
    const timeoutId = setTimeout(async () => {
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}&limit=8`)
        if (!response.ok) throw new Error('Search failed')
        const data = await response.json()
        setResults(data)
      } catch (error) {
        console.error('Search error:', error)
        setResults({ tasks: [], contacts: [], companies: [], profiles: [], total: 0 })
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [query])

  const handleSelect = (item: {
    type: 'task' | 'contact' | 'company' | 'profile'
    id: string
  }) => {
    switch (item.type) {
      case 'task':
        router.push(`/tasks?task=${item.id}`)
        break
      case 'contact':
        router.push(`/crm/contacts/${item.id}`)
        break
      case 'company':
        router.push(`/crm/companies/${item.id}`)
        break
      case 'profile':
        router.push(`/dashboard/employees/${item.id}`)
        break
    }
    onOpenChange(false)
    setQuery('')
  }

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Type to search tasks, contacts, companies, people..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList className="max-h-[400px]">
        {loading && (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        )}
        {!loading && query && results.total === 0 && (
          <CommandEmpty>No results found.</CommandEmpty>
        )}
        {!loading && !query && (
          <div className="px-2 py-6 text-center text-sm text-muted-foreground">
            Start typing to search across tasks, contacts, companies, and people...
          </div>
        )}
        {!loading && results.tasks.length > 0 && (
          <CommandGroup heading="Tasks">
            {results.tasks.map((task) => (
              <CommandItem
                key={`task-${task.id}`}
                value={`${task.title || ''} ${task.description || ''}`}
                onSelect={() => handleSelect({ ...task, type: 'task' })}
              >
                <CheckSquare className="mr-2 h-4 w-4" />
                <div className="flex flex-1 flex-col gap-1">
                  <span className="text-sm font-medium">{task.title || 'Untitled Task'}</span>
                  {task.description && (
                    <span className="text-xs text-muted-foreground line-clamp-1">
                      {task.description}
                    </span>
                  )}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {task.status && <span>Status: {task.status}</span>}
                    {task.priority && <span>• Priority: {task.priority}</span>}
                  </div>
                </div>
                {task.status && (
                  <Badge variant="outline" className="ml-2">
                    {task.status}
                  </Badge>
                )}
              </CommandItem>
            ))}
          </CommandGroup>
        )}
        {!loading && results.contacts.length > 0 && (
          <>
            {results.tasks.length > 0 && <CommandSeparator />}
            <CommandGroup heading="Contacts">
              {results.contacts.map((contact) => (
                <CommandItem
                  key={`contact-${contact.id}`}
                  value={`${contact.name || ''} ${contact.email || ''} ${contact.phone || ''}`}
                  onSelect={() => handleSelect({ ...contact, type: 'contact' })}
                >
                  <Users className="mr-2 h-4 w-4" />
                  <div className="flex flex-1 flex-col gap-1">
                    <span className="text-sm font-medium">{contact.name || 'Unnamed Contact'}</span>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {contact.email && <span>{contact.email}</span>}
                      {contact.phone && <span>• {contact.phone}</span>}
                    </div>
                  </div>
                  {contact.contact_type && (
                    <Badge variant="outline" className="ml-2">
                      {contact.contact_type}
                    </Badge>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
        {!loading && results.companies.length > 0 && (
          <>
            {(results.tasks.length > 0 || results.contacts.length > 0) && <CommandSeparator />}
            <CommandGroup heading="Companies">
              {results.companies.map((company) => (
                <CommandItem
                  key={`company-${company.id}`}
                  value={`${company.name || ''} ${company.legal_name || ''} ${company.website || ''}`}
                  onSelect={() => handleSelect({ ...company, type: 'company' })}
                >
                  <Building2 className="mr-2 h-4 w-4" />
                  <div className="flex flex-1 flex-col gap-1">
                    <span className="text-sm font-medium">{company.name || 'Unnamed Company'}</span>
                    {company.website && (
                      <span className="text-xs text-muted-foreground">{company.website}</span>
                    )}
                  </div>
                  {company.industry && (
                    <Badge variant="outline" className="ml-2">
                      {company.industry}
                    </Badge>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
        {!loading && results.profiles.length > 0 && (
          <>
            {(results.tasks.length > 0 ||
              results.contacts.length > 0 ||
              results.companies.length > 0) && <CommandSeparator />}
            <CommandGroup heading="People">
              {results.profiles.map((profile) => {
                const fullName = [profile.first_name, profile.last_name]
                  .filter(Boolean)
                  .join(' ')
                return (
                  <CommandItem
                    key={`profile-${profile.id}`}
                    value={`${fullName || ''} ${profile.email || ''} ${profile.phone || ''}`}
                    onSelect={() => handleSelect({ ...profile, type: 'profile' })}
                  >
                    <User className="mr-2 h-4 w-4" />
                    <div className="flex flex-1 flex-col gap-1">
                      <span className="text-sm font-medium">
                        {fullName || profile.email || 'Unnamed User'}
                      </span>
                      {profile.email && (
                        <span className="text-xs text-muted-foreground">{profile.email}</span>
                      )}
                    </div>
                  </CommandItem>
                )
              })}
            </CommandGroup>
          </>
        )}
      </CommandList>
      {!loading && query && (
        <div className="border-t px-2 py-2 text-xs text-muted-foreground">
          <div className="flex items-center justify-between">
            <span>
              {results.total} {results.total === 1 ? 'result' : 'results'}
            </span>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <kbd className="rounded border bg-muted px-1.5 py-0.5 text-xs">↑↓</kbd>
                <span>Navigate</span>
              </span>
              <span className="flex items-center gap-1">
                <kbd className="rounded border bg-muted px-1.5 py-0.5 text-xs">↵</kbd>
                <span>Select</span>
              </span>
              <span className="flex items-center gap-1">
                <kbd className="rounded border bg-muted px-1.5 py-0.5 text-xs">Esc</kbd>
                <span>Close</span>
              </span>
            </div>
          </div>
        </div>
      )}
    </CommandDialog>
  )
}

// Search button component
export function SearchButton({ onClick }: { onClick: () => void }) {
  return (
    <Button
      type="button"
      variant="outline"
      onClick={onClick}
      className="w-full max-w-md justify-between hover:shadow-md transition-all duration-200 py-2 h-auto cursor-pointer border"
      aria-label="Open search"
    >
      <span className="flex items-center gap-2 opacity-80">
        <Search className="h-4 w-4" />
        <span className="text-muted-foreground text-sm">Search...</span>
      </span>
      <div className="hidden md:inline-flex items-center gap-1 rounded bg-muted px-1.5 py-0.5 text-xs font-mono text-muted-foreground">
        <kbd className="text-xs">Ctrl</kbd>
        <span>K</span>
      </div>
    </Button>
  )
}

