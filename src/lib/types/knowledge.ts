// Common Util Knowledge Types
export interface KnowledgeCategory {
  id: string
  name: string
  description: string | null
  parent_id: string | null
  order_no: number | null
  created_at: string
  updated_at: string
  created_by: string | null
  deleted_at: string | null
}

export interface KnowledgeArticle {
  id: string
  title: string
  slug: string | null
  content: string
  excerpt: string | null
  category_id: string | null
  author_id: string | null
  tags: string[] | null
  is_published: boolean | null
  is_featured: boolean | null
  view_count: number | null
  helpful_count: number | null
  not_helpful_count: number | null
  meta: Record<string, any> | null
  created_at: string
  updated_at: string
  created_by: string | null
  deleted_at: string | null
}

export interface KnowledgeArticleFull extends KnowledgeArticle {
  category?: {
    id: string
    name: string
  } | null
  author?: {
    id: string
    first_name: string | null
    last_name: string | null
  } | null
}

export interface KnowledgeArticleFormData {
  title: string
  slug?: string
  content: string
  excerpt?: string
  category_id?: string
  author_id?: string
  tags?: string[]
  is_published?: boolean
  is_featured?: boolean
}

