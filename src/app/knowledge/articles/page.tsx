'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { KnowledgeArticleFull, KnowledgeArticleFormData } from '@/lib/types/knowledge'
import type { SortingState, ColumnFiltersState } from '@tanstack/react-table'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'
import { DataTable } from '@/components/data-table/data-table'
import { createArticleColumns } from './components/article-columns'
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
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

function KnowledgeArticlesPageContent() {
  const { user: clerkUser } = useUser()
  const [articles, setArticles] = useState<KnowledgeArticleFull[]>([])
  const [loading, setLoading] = useState(true)
  const [initialLoading, setInitialLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [editingArticle, setEditingArticle] = useState<KnowledgeArticleFull | null>(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [pageCount, setPageCount] = useState(0)
  const [sorting, setSorting] = useState<SortingState>([])
  const [filters, setFilters] = useState<ColumnFiltersState>([])
  const [search, setSearch] = useState('')
  const [formData, setFormData] = useState<KnowledgeArticleFormData>({
    title: '',
    content: '',
    excerpt: '',
    category_id: '',
    is_published: false,
    is_featured: false,
  })
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([])

  const fetchArticles = useCallback(async () => {
    if (!clerkUser?.id) return

    try {
      setLoading(true)
      const supabase = createClient()

      // Use schema-aware query - knowledge_articles is in common_util schema
      // Note: Foreign key references across schemas may not work, so we fetch separately if needed
      let query = (supabase as any)
        .schema('common_util')
        .from('knowledge_articles')
        .select('*', { count: 'exact' })
        .is('deleted_at', null)

      if (search) {
        query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%,excerpt.ilike.%${search}%`)
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

      const { data: articles, error, count } = await query

      if (error) throw error

      // Fetch related data separately
      const categoryIds = [...new Set((articles || []).map((a: any) => a.category_id).filter(Boolean))]
      const authorIds = [...new Set((articles || []).map((a: any) => a.author_id).filter(Boolean))]

      // Fetch categories
      const { data: categories } = categoryIds.length > 0
        ? await (supabase as any)
            .schema('common_util')
            .from('knowledge_categories')
            .select('id, name')
            .in('id', categoryIds)
        : { data: [] }

      // Fetch authors (profiles)
      const { data: profiles } = authorIds.length > 0
        ? await (supabase as any)
            .schema('core')
            .from('profiles')
            .select('id, first_name, last_name')
            .in('id', authorIds)
        : { data: [] }

      // Create lookup maps
      const categoriesMap = new Map((categories || []).map((c: any) => [c.id, c]))
      const profilesMap = new Map((profiles || []).map((p: any) => [p.id, p]))

      // Combine articles with relations
      const articlesWithRelations = (articles || []).map((article: any) => ({
        ...article,
        category: article.category_id ? categoriesMap.get(article.category_id) || null : null,
        author: article.author_id ? profilesMap.get(article.author_id) || null : null,
      }))

      setArticles(articlesWithRelations)
      setPageCount(count ? Math.ceil(count / pageSize) : 0)
    } catch (error: any) {
      console.error('Error fetching articles:', error)
      toast.error('Failed to load articles')
    } finally {
      setLoading(false)
      setInitialLoading(false)
    }
  }, [clerkUser?.id, page, pageSize, sorting, search])

  useEffect(() => {
    fetchArticles()
    const fetchCategories = async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from('knowledge_categories')
        .select('id, name')
        .is('deleted_at', null)
      setCategories(data || [])
    }
    fetchCategories()
  }, [fetchArticles])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!clerkUser?.id || !formData.title.trim() || !formData.content.trim()) return

    try {
      const supabase = createClient()

      // Generate slug from title
      const slug = formData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')

      if (editingArticle) {
        const { error } = await (supabase as any)
          .from('knowledge_articles')
          .update({
            ...formData,
            slug,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingArticle.id)

        if (error) throw error
        toast.success('Article updated successfully')
      } else {
        const { error } = await (supabase as any).from('knowledge_articles').insert({
          ...formData,
          slug,
          author_id: clerkUser.id,
          created_by: clerkUser.id,
        })

        if (error) throw error
        toast.success('Article created successfully')
      }

      setFormOpen(false)
      setEditingArticle(null)
      await fetchArticles()
    } catch (error: any) {
      console.error('Error saving article:', error)
      toast.error(error.message || 'Failed to save article')
    }
  }

  const handleDelete = async (article: KnowledgeArticleFull) => {
    if (!clerkUser?.id) return
    if (!confirm(`Are you sure you want to delete ${article.title}?`)) return

    try {
      const supabase = createClient()
      const { error } = await (supabase as any)
        .from('knowledge_articles')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', article.id)

      if (error) throw error
      toast.success('Article deleted successfully')
      await fetchArticles()
    } catch (error: any) {
      console.error('Error deleting article:', error)
      toast.error('Failed to delete article')
    }
  }

  useEffect(() => {
    if (editingArticle) {
      setFormData({
        title: editingArticle.title,
        slug: editingArticle.slug || undefined,
        content: editingArticle.content,
        excerpt: editingArticle.excerpt || undefined,
        category_id: editingArticle.category_id || undefined,
        author_id: editingArticle.author_id || undefined,
        is_published: editingArticle.is_published ?? false,
        is_featured: editingArticle.is_featured ?? false,
        tags: editingArticle.tags || undefined,
      })
    } else {
      setFormData({
        title: '',
        content: '',
        excerpt: '',
        category_id: '',
        is_published: false,
        is_featured: false,
      })
    }
  }, [editingArticle, formOpen])

  const columns = createArticleColumns({
    onView: () => {},
    onEdit: (article) => {
      setEditingArticle(article)
      setFormOpen(true)
    },
    onDelete: handleDelete,
  })

  return (
    <>
      <div className="flex flex-1 flex-col min-w-0 h-full overflow-hidden">
        <div className="flex items-center justify-between mb-4 flex-shrink-0">
          <div>
            <h1 className="text-lg font-semibold tracking-tight">Knowledge Articles</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Manage your knowledge base articles</p>
          </div>
        </div>

        {initialLoading ? (
          <ContactTableSkeleton />
        ) : (
          <DataTable
            columns={columns}
            data={articles}
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
              setEditingArticle(null)
              setFormOpen(true)
            }}
            onEdit={(article) => {
              setEditingArticle(article)
              setFormOpen(true)
            }}
            onDelete={handleDelete}
            searchPlaceholder="Search articles..."
            addButtonText="New Article"
            addButtonIcon={<Plus className="mr-2 h-4 w-4" />}
          />
        )}
      </div>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{editingArticle ? 'Edit Article' : 'Create Article'}</DialogTitle>
              <DialogDescription>
                {editingArticle ? 'Update article information.' : 'Create a new knowledge base article.'}
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
                <Label htmlFor="category_id">Category</Label>
                <Select
                  value={formData.category_id || '__none__'}
                  onValueChange={(value) => setFormData({ ...formData, category_id: value === '__none__' ? undefined : value || undefined })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">None</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="excerpt">Excerpt</Label>
                <Textarea
                  id="excerpt"
                  value={formData.excerpt}
                  onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                  rows={2}
                  placeholder="Brief summary of the article"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="content">
                  Content <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={10}
                  required
                  placeholder="Article content (markdown supported)"
                />
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Switch
                    id="is_published"
                    checked={formData.is_published ?? false}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_published: checked })}
                  />
                  <Label htmlFor="is_published">Published</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id="is_featured"
                    checked={formData.is_featured ?? false}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked })}
                  />
                  <Label htmlFor="is_featured">Featured</Label>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={!formData.title.trim() || !formData.content.trim()}>
                {editingArticle ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default function KnowledgeArticlesPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <KnowledgeArticlesPageContent />
    </Suspense>
  )
}
