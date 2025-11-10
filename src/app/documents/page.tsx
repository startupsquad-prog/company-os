'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { DocumentFull, DocumentFormData } from '@/lib/types/documents'
import type { SortingState, ColumnFiltersState } from '@tanstack/react-table'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'
import { DataTable } from '@/components/data-table/data-table'
import { createDocumentColumns } from './components/document-columns'
import { useUser } from '@clerk/nextjs'
import { PageLoader } from '@/components/ui/loader'
import { ContactTableSkeleton } from '@/app/crm/contacts/components/contact-table-skeleton'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

function DocumentsPageContent() {
  const { user: clerkUser } = useUser()
  const [documents, setDocuments] = useState<DocumentFull[]>([])
  const [loading, setLoading] = useState(true)
  const [initialLoading, setInitialLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [editingDocument, setEditingDocument] = useState<DocumentFull | null>(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [pageCount, setPageCount] = useState(0)
  const [sorting, setSorting] = useState<SortingState>([])
  const [filters, setFilters] = useState<ColumnFiltersState>([])
  const [search, setSearch] = useState('')
  const [formData, setFormData] = useState<DocumentFormData>({
    title: '',
    description: '',
    file_name: '',
    file_url: '',
    file_size: 0,
    mime_type: '',
    category: '',
    status: 'active',
  })

  const fetchDocuments = useCallback(async () => {
    if (!clerkUser?.id) return

    try {
      setLoading(true)
      const supabase = createClient()

      let query = supabase
        .from('documents')
        .select('*, created_by_profile:profiles!documents_created_by_fkey(id, first_name, last_name)', { count: 'exact' })
        .is('deleted_at', null)
        .neq('status', 'deleted')

      if (search) {
        query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%,file_name.ilike.%${search}%`)
      }

      const statusFilter = filters.find((f) => f.id === 'status')
      if (statusFilter && statusFilter.value) {
        const values = Array.isArray(statusFilter.value) ? statusFilter.value : [statusFilter.value]
        query = query.in('status', values)
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

      setDocuments(data || [])
      setPageCount(count ? Math.ceil(count / pageSize) : 0)
    } catch (error: any) {
      console.error('Error fetching documents:', error)
      toast.error('Failed to load documents')
    } finally {
      setLoading(false)
      setInitialLoading(false)
    }
  }, [clerkUser?.id, page, pageSize, sorting, filters, search])

  useEffect(() => {
    fetchDocuments()
  }, [fetchDocuments])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!clerkUser?.id || !formData.title.trim() || !formData.file_url.trim()) return

    try {
      const supabase = createClient()

      if (editingDocument) {
        const { error } = await supabase
          .from('documents')
          .update({
            ...formData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingDocument.id)

        if (error) throw error
        toast.success('Document updated successfully')
      } else {
        const { error } = await supabase.from('documents').insert({
          ...formData,
          created_by: clerkUser.id,
        })

        if (error) throw error
        toast.success('Document created successfully')
      }

      setFormOpen(false)
      setEditingDocument(null)
      await fetchDocuments()
    } catch (error: any) {
      console.error('Error saving document:', error)
      toast.error(error.message || 'Failed to save document')
    }
  }

  const handleDelete = async (document: DocumentFull) => {
    if (!clerkUser?.id) return
    if (!confirm(`Are you sure you want to delete ${document.title}?`)) return

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('documents')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', document.id)

      if (error) throw error
      toast.success('Document deleted successfully')
      await fetchDocuments()
    } catch (error: any) {
      console.error('Error deleting document:', error)
      toast.error('Failed to delete document')
    }
  }

  const handleDownload = (document: DocumentFull) => {
    if (document.file_url) {
      window.open(document.file_url, '_blank')
      // Increment download count
      const supabase = createClient()
      supabase
        .from('documents')
        .update({ download_count: (document.download_count || 0) + 1 })
        .eq('id', document.id)
        .then(() => fetchDocuments())
    }
  }

  useEffect(() => {
    if (editingDocument) {
      setFormData({
        title: editingDocument.title,
        description: editingDocument.description || '',
        file_name: editingDocument.file_name,
        file_url: editingDocument.file_url,
        file_size: editingDocument.file_size || 0,
        mime_type: editingDocument.mime_type || '',
        category: editingDocument.category || '',
        status: editingDocument.status || 'active',
      })
    } else {
      setFormData({
        title: '',
        description: '',
        file_name: '',
        file_url: '',
        file_size: 0,
        mime_type: '',
        category: '',
        status: 'active',
      })
    }
  }, [editingDocument, formOpen])

  const columns = createDocumentColumns({
    onView: () => {},
    onEdit: (document) => {
      setEditingDocument(document)
      setFormOpen(true)
    },
    onDelete: handleDelete,
    onDownload: handleDownload,
  })

  const filterConfig = [
    {
      columnId: 'status',
      title: 'Status',
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Archived', value: 'archived' },
      ],
    },
  ]

  return (
    <>
      <div className="flex flex-1 flex-col min-w-0 h-full overflow-hidden">
        <div className="flex items-center justify-between mb-4 flex-shrink-0">
          <div>
            <h1 className="text-lg font-semibold tracking-tight">Documents</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Manage your documents and files</p>
          </div>
        </div>

        {initialLoading ? (
          <ContactTableSkeleton />
        ) : (
          <DataTable
            columns={columns}
            data={documents}
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
              setEditingDocument(null)
              setFormOpen(true)
            }}
            onEdit={(document) => {
              setEditingDocument(document)
              setFormOpen(true)
            }}
            onDelete={handleDelete}
            filterConfig={filterConfig}
            searchPlaceholder="Search documents..."
            addButtonText="Upload Document"
            addButtonIcon={<Plus className="mr-2 h-4 w-4" />}
          />
        )}
      </div>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{editingDocument ? 'Edit Document' : 'Upload Document'}</DialogTitle>
              <DialogDescription>
                {editingDocument ? 'Update document information.' : 'Add a new document to your library.'}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title">
                  Title <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="file_url">
                  File URL <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="file_url"
                  type="url"
                  value={formData.file_url}
                  onChange={(e) => setFormData({ ...formData, file_url: e.target.value })}
                  placeholder="https://..."
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="file_name">File Name</Label>
                  <Input
                    id="file_name"
                    value={formData.file_name}
                    onChange={(e) => setFormData({ ...formData, file_name: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="category">Category</Label>
                  <Input
                    id="category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={!formData.title.trim() || !formData.file_url.trim()}>
                {editingDocument ? 'Update' : 'Upload'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default function DocumentsPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <DocumentsPageContent />
    </Suspense>
  )
}
