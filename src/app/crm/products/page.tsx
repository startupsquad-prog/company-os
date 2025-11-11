'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { ProductFull, ProductFormData } from '@/lib/types/products'
import type { SortingState, ColumnFiltersState } from '@tanstack/react-table'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'
import { DataTable } from '@/components/data-table/data-table'
import { createProductColumns } from './components/product-columns'
import { ProductForm } from './components/product-form'
import { useUser } from '@clerk/nextjs'
import { PageLoader } from '@/components/ui/loader'
import { ProductTableSkeleton } from './components/product-table-skeleton'

function ProductsPageContent() {
  const { user: clerkUser } = useUser()
  const [products, setProducts] = useState<ProductFull[]>([])
  const [loading, setLoading] = useState(true)
  const [initialLoading, setInitialLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<ProductFull | null>(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [pageCount, setPageCount] = useState(0)
  const [sorting, setSorting] = useState<SortingState>([])
  const [filters, setFilters] = useState<ColumnFiltersState>([])
  const [search, setSearch] = useState('')

  // Fetch products
  const fetchProducts = useCallback(async () => {
    if (!clerkUser?.id) return

    try {
      setLoading(true)
      const supabase = createClient()

      // Build query using schema-aware helper
      // Note: Foreign key references across schemas may not work, so we fetch separately if needed
      let query = (supabase as any)
        .schema('crm')
        .from('products')
        .select('*', { count: 'exact' })
        .is('deleted_at', null)

      // Apply search
      if (search) {
        query = query.or(`name.ilike.%${search}%,sku.ilike.%${search}%,category.ilike.%${search}%,brand.ilike.%${search}%`)
      }

      // Apply filters
      const statusFilter = filters.find((f) => f.id === 'is_active')
      if (statusFilter && statusFilter.value) {
        const values = Array.isArray(statusFilter.value) ? statusFilter.value : [statusFilter.value]
        query = query.in('is_active', values.map(v => v === 'true'))
      }

      const categoryFilter = filters.find((f) => f.id === 'category')
      if (categoryFilter && categoryFilter.value) {
        const values = Array.isArray(categoryFilter.value) ? categoryFilter.value : [categoryFilter.value]
        query = query.in('category', values)
      }

      // Apply sorting
      if (sorting.length > 0) {
        const sort = sorting[0]
        query = query.order(sort.id, { ascending: sort.desc !== true })
      } else {
        query = query.order('created_at', { ascending: false })
      }

      // Apply pagination
      const from = (page - 1) * pageSize
      const to = from + pageSize - 1
      query = query.range(from, to)

      const { data: products, error, count } = await query

      if (error) throw error

      // Fetch related data separately
      const supplierIds = [...new Set((products || []).map((p: any) => p.supplier_id).filter(Boolean))]
      const manufacturerIds = [...new Set((products || []).map((p: any) => p.manufacturer_id).filter(Boolean))]

      // Fetch suppliers (contacts)
      const { data: suppliers } = supplierIds.length > 0
        ? await (supabase as any)
            .schema('core')
            .from('contacts')
            .select('id, name, email')
            .in('id', supplierIds)
        : { data: [] }

      // Fetch manufacturers (companies)
      const { data: manufacturers } = manufacturerIds.length > 0
        ? await (supabase as any)
            .schema('core')
            .from('companies')
            .select('id, name, industry')
            .in('id', manufacturerIds)
        : { data: [] }

      // Create lookup maps
      const suppliersMap = new Map((suppliers || []).map((s: any) => [s.id, s]))
      const manufacturersMap = new Map((manufacturers || []).map((m: any) => [m.id, m]))

      // Combine products with relations
      const productsWithRelations = (products || []).map((product: any) => ({
        ...product,
        supplier: product.supplier_id ? suppliersMap.get(product.supplier_id) || null : null,
        manufacturer: product.manufacturer_id ? manufacturersMap.get(product.manufacturer_id) || null : null,
      }))

      setProducts(productsWithRelations)
      setPageCount(count ? Math.ceil(count / pageSize) : 0)
    } catch (error: any) {
      console.error('Error fetching products:', error)
      toast.error('Failed to load products')
    } finally {
      setLoading(false)
      setInitialLoading(false)
    }
  }, [clerkUser?.id, page, pageSize, sorting, filters, search])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  // Handle create/update
  const handleSubmit = async (data: ProductFormData) => {
    if (!clerkUser?.id) return

    try {
      const supabase = createClient()

      if (editingProduct) {
        const { error } = await (supabase as any)
          .from('products')
          .update({
            ...data,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingProduct.id)

        if (error) throw error
        toast.success('Product updated successfully')
      } else {
        const { error } = await (supabase as any).from('products').insert({
          ...data,
          created_by: clerkUser.id,
        })

        if (error) throw error
        toast.success('Product created successfully')
      }

      await fetchProducts()
    } catch (error: any) {
      console.error('Error saving product:', error)
      toast.error(error.message || 'Failed to save product')
      throw error
    }
  }

  // Handle delete
  const handleDelete = async (product: ProductFull) => {
    if (!clerkUser?.id) return

    if (!confirm(`Are you sure you want to delete ${product.name}?`)) return

    try {
      const supabase = createClient()
      const { error } = await (supabase as any)
        .from('products')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', product.id)

      if (error) throw error
      toast.success('Product deleted successfully')
      await fetchProducts()
    } catch (error: any) {
      console.error('Error deleting product:', error)
      toast.error('Failed to delete product')
    }
  }

  // Create columns
  const columns = createProductColumns({
    onView: (product) => {
      // TODO: Open view modal
    },
    onEdit: (product) => {
      setEditingProduct(product)
      setFormOpen(true)
    },
    onDelete: handleDelete,
  })

  // Filter config
  const filterConfig = [
    {
      columnId: 'is_active',
      title: 'Status',
      options: [
        { label: 'Active', value: 'true' },
        { label: 'Inactive', value: 'false' },
      ],
    },
  ]

  return (
    <>
      <div className="flex flex-1 flex-col min-w-0 h-full overflow-hidden">
        <div className="flex items-center justify-between mb-4 flex-shrink-0">
          <div>
            <h1 className="text-lg font-semibold tracking-tight">Products</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Manage your product catalog</p>
          </div>
        </div>

        {initialLoading ? (
          <ProductTableSkeleton />
        ) : (
          <DataTable
            columns={columns}
            data={products}
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
            onAdd={() => {
              setEditingProduct(null)
              setFormOpen(true)
            }}
            onEdit={(product) => {
              setEditingProduct(product)
              setFormOpen(true)
            }}
            onDelete={handleDelete}
            filterConfig={filterConfig}
            searchPlaceholder="Search products..."
            addButtonText="Create Product"
            addButtonIcon={<Plus className="mr-2 h-4 w-4" />}
          />
        )}
      </div>

      <ProductForm
        product={editingProduct}
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open)
          if (!open) {
            setEditingProduct(null)
          }
        }}
        onSubmit={handleSubmit}
      />
    </>
  )
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <ProductsPageContent />
    </Suspense>
  )
}
