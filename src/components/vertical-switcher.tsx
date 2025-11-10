'use client'

import * as React from 'react'
import { ChevronsUpDown, Check, Building2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useVerticalScope } from '@/lib/state/use-vertical-scope'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type Vertical = {
  id: string
  name: string
  code: string
}

export function VerticalSwitcher() {
  const supabase = createClient()
  const { verticalScope, setVerticalScope } = useVerticalScope()
  const [verticals, setVerticals] = React.useState<Vertical[]>([])
  const [open, setOpen] = React.useState(false)

  React.useEffect(() => {
    const fetchVerticals = async () => {
      const { data, error } = await supabase
        .from('core.verticals')
        .select('id, name, code')
        .eq('is_active', true)
        .order('name', { ascending: true })
      if (!error && data) {
        setVerticals([{ id: 'all', name: 'All', code: 'all' }, ...(data as any)])
      }
    }
    fetchVerticals()
  }, [supabase])

  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && (e.key.toLowerCase() === 'v')) {
        e.preventDefault()
        setOpen((o) => !o)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  // Always show "Company OS" and "Enterprise" as the default/main view
  const displayName = 'Company OS'
  const displayPlan = 'Enterprise'

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="lg"
          className={cn(
            'h-12 gap-2 whitespace-nowrap bg-gradient-to-b from-[#4A4A4A] to-[#363636] text-white font-medium shadow-none border-none hover:from-[#4A4A4A] hover:to-[#363636] hover:text-white data-[state=open]:bg-gradient-to-b data-[state=open]:from-[#4A4A4A] data-[state=open]:to-[#363636] data-[state=open]:text-white',
            'px-3'
          )}
        >
          <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-white/10 text-white">
            <Building2 className="size-4" />
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-semibold text-white">{displayName}</span>
            <span className="truncate text-xs text-white/80">{displayPlan}</span>
          </div>
          <ChevronsUpDown className="ml-auto h-3.5 w-3.5 text-[#CCCCCC]" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-56" sideOffset={6}>
        <DropdownMenuLabel className="text-xs text-muted-foreground">Vertical scope</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {verticals.map((v) => (
          <DropdownMenuItem
            key={v.id}
            className="gap-2"
            onClick={() => {
              setVerticalScope(v.id as 'all' | string)
              setOpen(false)
            }}
          >
            <Check className={cn('h-4 w-4', verticalScope === v.id ? 'opacity-100' : 'opacity-0')} />
            <span className="truncate">{v.name}</span>
            {v.code !== 'all' && <span className="ml-auto text-xs text-muted-foreground">{v.code}</span>}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}



