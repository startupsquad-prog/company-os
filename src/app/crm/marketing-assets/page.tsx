'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { SortingState, ColumnFiltersState } from '@tanstack/react-table'
import { toast } from 'sonner'
import { Plus, Image as ImageIcon } from 'lucide-react'
import { DataTable } from '@/components/data-table/data-table'
import { useUser } from '@clerk/nextjs'
import { PageLoader } from '@/components/ui/loader'
import { ContactTableSkeleton } from '@/app/crm/contacts/components/contact-table-skeleton'
import { ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header'
import { format } from 'date-fns'

interface MarketingAsset {
  id: string
  name: string
  asset_type: string | null
  file_url: string | null
  is_public: boolean | null
  created_at: string
  created_by: string | null
}

function MarketingAssetsPageContent() {
  const { user: clerkUser } = useUser()
  const [assets, setAssets] = useState<MarketingAsset[]>([])
  const [loading, setLoading] = useState(true)
  const [initialLoading, setInitialLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [pageCount, setPageCount] = useState(0)
  const [sorting, setSorting] = useState<SortingState>([])
  const [filters, setFilters] = useState<ColumnFiltersState>([])
  const [search, setSearch] = useState('')

  const fetchAssets = useCallback(async () => {
    if (!clerkUser?.id) return

    try {
      setLoading(true)
      const supabase = createClient()

      // Note: marketing_assets table doesn't exist yet, so this is a placeholder
      // When the table is created, uncomment the query below
      /*
      let query = supabase
        .from('marketing_assets')
        .select('*', { count: 'exact' })
        .is('deleted_at', null)

      if (search) {
        query = query.or(`name.ilike.%${search}%,asset_type.ilike.%${search}%`)
      }

      if (sorting.length > 0) {
        const sort = sorting[0]
        query = query.order(sort.id, { ascending: sort.desc !== true })
      } else {
        query = query.order('created_at', { ascending: false })
      }

      const from = (page - 1) * pageSize
      const to = from + pageSize - 1
      query = query.range(from, to)

      const { data, error, count } = await query
      if (error) throw error
      setAssets(data || [])
      setPageCount(count ? Math.ceil(count / pageSize) : 0)
      */
      
      // Placeholder: Empty state until table is created
      setAssets([])
      setPageCount(0)
    } catch (error: any) {
      console.error('Error fetching marketing assets:', error)
      toast.error('Failed to load marketing assets')
    } finally {
      setLoading(false)
      setInitialLoading(false)
    }
  }, [clerkUser?.id, page, pageSize, sorting, filters, search])

  useEffect(() => {
    fetchAssets()
  }, [fetchAssets])

  const columns: ColumnDef<MarketingAsset>[] = [
    {
      accessorKey: 'name',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
      cell: ({ row }) => {
        const asset = row.original
        return (
          <div className="flex items-center gap-3">
            <ImageIcon className="h-5 w-5 text-muted-foreground" />
            <Button variant="link" className="h-auto p-0 font-medium text-left justify-start">
              {asset.name}
            </Button>
          </div>
        )
      },
    },
    {
      accessorKey: 'asset_type',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Type" />,
      cell: ({ row }) => {
        const type = row.getValue('asset_type') as string | null
        return type ? <Badge variant="outline">{type}</Badge> : <span className="text-muted-foreground">—</span>
      },
    },
    {
      accessorKey: 'is_public',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Visibility" />,
      cell: ({ row }) => {
        const isPublic = row.getValue('is_public') as boolean | null
        return <Badge variant={isPublic ? 'default' : 'secondary'}>{isPublic ? 'Public' : 'Private'}</Badge>
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
  ]

  return (
    <div className="flex flex-1 flex-col min-w-0 h-full overflow-hidden">
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Marketing Assets</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Manage your marketing materials and assets</p>
        </div>
        <button
          onClick={() => toast.info('Marketing assets table needs to be created in database')}
          className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
        >
          <Plus className="mr-2 h-4 w-4" />
          Upload Asset
        </button>
      </div>

      {initialLoading ? (
        <ContactTableSkeleton />
      ) : assets.length === 0 ? (
        <div className="flex-1 overflow-y-auto min-h-0 flex items-center justify-center">
          <div className="text-center py-12 text-muted-foreground">
            <ImageIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Marketing assets table needs to be created</p>
            <p className="text-sm mt-2">Database schema for marketing_assets is not yet available</p>
          </div>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={assets}
          pageCount={pageCount}
          onPaginationChange={(p, s) => {
            setPage(p)
            setPageSize(s)
          }}
          onSortingChange={setSorting}
          onFilterChange={setFilters}
          onSearchChange={setSearch}
          loading={loading}
          initialLoading={initialLoading}
          searchPlaceholder="Search assets..."
          addButtonText="Upload Asset"
          addButtonIcon={<Plus className="mr-2 h-4 w-4" />}
        />
      )}
    </div>
  )
}

export default function MarketingAssetsPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <MarketingAssetsPageContent />
    </Suspense>
  )
}
