'use client'

import { useState } from 'react'
import { ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreHorizontal, Eye, EyeOff, Edit, Trash2, Copy, ExternalLink, Check } from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'
import type { PasswordFull } from '@/lib/types/password-vault'

// Username cell component
function UsernameCell({ username }: { username: string | null }) {
  const [copied, setCopied] = useState(false)

  if (!username) {
    return <span className="text-muted-foreground">—</span>
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(username)
      setCopied(true)
      toast.success('Username copied to clipboard')
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast.error('Failed to copy username')
    }
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm">{username}</span>
      <Button
        variant="ghost"
        size="sm"
        className="h-6 w-6 p-0"
        onClick={handleCopy}
      >
        {copied ? (
          <Check className="h-3 w-3 text-green-600" />
        ) : (
          <Copy className="h-3 w-3" />
        )}
      </Button>
    </div>
  )
}

// Password cell component
function PasswordCell({ password }: { password: string }) {
  const [isVisible, setIsVisible] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(password)
      setCopied(true)
      toast.success('Password copied to clipboard')
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast.error('Failed to copy password')
    }
  }

  const maskedPassword = '••••••••'

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-mono">
        {isVisible ? password : maskedPassword}
      </span>
      <Button
        variant="ghost"
        size="sm"
        className="h-6 w-6 p-0"
        onClick={() => setIsVisible(!isVisible)}
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
          className="h-6 w-6 p-0"
          onClick={handleCopy}
        >
          {copied ? (
            <Check className="h-3 w-3 text-green-600" />
          ) : (
            <Copy className="h-3 w-3" />
          )}
        </Button>
      )}
    </div>
  )
}

export const createPasswordColumns = (handlers?: {
  onEdit?: (password: PasswordFull) => void
  onDelete?: (password: PasswordFull) => void
}): ColumnDef<PasswordFull>[] => {
  const onEdit = handlers?.onEdit
  const onDelete = handlers?.onDelete

  return [
    {
      accessorKey: 'title',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Title" />,
      cell: ({ row }) => {
        const password = row.original
        return (
          <div className="flex items-center gap-2">
            <span className="font-medium">{password.title}</span>
          </div>
        )
      },
    },
    {
      accessorKey: 'username',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Username" />,
      cell: ({ row }) => {
        const password = row.original
        return <UsernameCell username={password.username} />
      },
    },
    {
      accessorKey: 'password_encrypted',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Password" />,
      cell: ({ row }) => {
        const password = row.original
        return <PasswordCell password={password.password_encrypted} />
      },
    },
    {
      accessorKey: 'url',
      header: ({ column }) => <DataTableColumnHeader column={column} title="URL" />,
      cell: ({ row }) => {
        const password = row.original
        if (!password.url) {
          return <span className="text-muted-foreground">—</span>
        }

        return (
          <div className="flex items-center gap-2">
            <a
              href={password.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:underline flex items-center gap-1"
            >
              {password.url}
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        )
      },
    },
    {
      accessorKey: 'company',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Company" />,
      cell: ({ row }) => {
        const company = row.original.company
        return company ? (
          <span className="text-sm">{company.name}</span>
        ) : (
          <span className="text-muted-foreground">—</span>
        )
      },
    },
    {
      accessorKey: 'category',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Category" />,
      cell: ({ row }) => {
        const category = row.getValue('category') as string | null
        return category ? (
          <Badge variant="outline">{category}</Badge>
        ) : (
          <span className="text-muted-foreground">—</span>
        )
      },
      filterFn: (row, id, value) => {
        const category = row.getValue(id) as string | null
        return value.includes(category || '')
      },
    },
    {
      accessorKey: 'created_at',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Created" />,
      cell: ({ row }) => {
        const date = row.getValue('created_at') as string
        return <span className="text-sm text-muted-foreground">{format(new Date(date), 'MMM d, yyyy')}</span>
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const password = row.original

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onEdit?.(password)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDelete?.(password)} className="text-destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]
}

