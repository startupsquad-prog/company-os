'use client'

import { ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header'
import { format } from 'date-fns'
import type { EvaluationFull } from '@/lib/types/recruitment'

export const createEvaluationColumns = (): ColumnDef<EvaluationFull>[] => {
  return [
    {
      accessorKey: 'candidate',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Candidate" />,
      cell: ({ row }) => {
        const candidate = row.original.candidate
        return candidate?.contact?.name || '—'
      },
    },
    {
      accessorKey: 'interview',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Interview" />,
      cell: ({ row }) => {
        const interview = row.original.interview
        return interview?.interview_type || '—'
      },
    },
    {
      accessorKey: 'recommendation',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Recommendation" />,
      cell: ({ row }) => {
        const rec = row.getValue('recommendation') as string
        return <Badge>{rec}</Badge>
      },
    },
    {
      accessorKey: 'overall_rating',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Rating" />,
      cell: ({ row }) => {
        const rating = row.getValue('overall_rating') as number
        return rating ? `${rating}/5` : '—'
      },
    },
    {
      accessorKey: 'created_at',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Date" />,
      cell: ({ row }) => {
        const date = row.getValue('created_at') as string
        return date ? format(new Date(date), 'MMM d, yyyy') : '—'
      },
    },
  ]
}


