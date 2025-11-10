'use client'

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
import { MoreHorizontal, Eye, Edit, Trash2, Download, File } from 'lucide-react'
import { format } from 'date-fns'
import type { DocumentFull, DocumentStatus } from '@/lib/types/documents'

const statusConfig: Record<DocumentStatus, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
  active: { label: 'Active', variant: 'default' },
  archived: { label: 'Archived', variant: 'secondary' },
  deleted: { label: 'Deleted', variant: 'destructive' },
}

const formatFileSize = (bytes: number | null): string => {
  if (!bytes) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`
}

export const createDocumentColumns = (handlers?: {
  onView?: (document: DocumentFull) => void
  onEdit?: (document: DocumentFull) => void
  onDelete?: (document: DocumentFull) => void
  onDownload?: (document: DocumentFull) => void
}): ColumnDef<DocumentFull>[] => {
  const onView = handlers?.onView
  const onEdit = handlers?.onEdit
  const onDelete = handlers?.onDelete
  const onDownload = handlers?.onDownload

  return [
    {
      accessorKey: 'title',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Title" />,
      cell: ({ row }) => {
        const document = row.original
        return (
          <div className="flex items-center gap-3">
            <File className="h-5 w-5 text-muted-foreground" />
            <Button
              variant="link"
              className="h-auto p-0 font-medium text-left justify-start"
              onClick={() => onView?.(document)}
            >
              {document.title}
            </Button>
          </div>
        )
      },
    },
    {
      accessorKey: 'file_name',
      header: ({ column }) => <DataTableColumnHeader column={column} title="File Name" />,
      cell: ({ row }) => {
        const fileName = row.getValue('file_name') as string
        return <span className="text-sm font-mono">{fileName}</span>
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
    },
    {
      accessorKey: 'file_size',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Size" />,
      cell: ({ row }) => {
        const size = row.getValue('file_size') as number | null
        return <span className="text-sm text-muted-foreground">{formatFileSize(size)}</span>
      },
    },
    {
      accessorKey: 'status',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
      cell: ({ row }) => {
        const status = row.getValue('status') as DocumentStatus | null
        if (!status) return <span className="text-muted-foreground">—</span>
        const config = statusConfig[status] || { label: status, variant: 'outline' as const }
        return <Badge variant={config.variant}>{config.label}</Badge>
      },
    },
    {
      accessorKey: 'download_count',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Downloads" />,
      cell: ({ row }) => {
        const count = row.getValue('download_count') as number | null
        return <span className="text-sm text-muted-foreground">{count || 0}</span>
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
        const document = row.original

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
              <DropdownMenuItem onClick={() => onView?.(document)}>
                <Eye className="mr-2 h-4 w-4" />
                View
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDownload?.(document)}>
                <Download className="mr-2 h-4 w-4" />
                Download
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onEdit?.(document)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDelete?.(document)} className="text-destructive">
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

