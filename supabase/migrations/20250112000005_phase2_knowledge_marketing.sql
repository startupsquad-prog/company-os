-- ============================================================================
-- Phase 2.3 & 2.4 — Knowledge Base & Marketing Assets
-- Company OS: Knowledge articles and marketing materials library
-- ============================================================================
-- Purpose: FAQ/knowledge articles and marketing asset management
-- Relations: Link to core.profiles (author/created_by), use Supabase Storage
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Knowledge Categories Table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS common_util.knowledge_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    parent_id UUID REFERENCES common_util.knowledge_categories(id) ON DELETE SET NULL,
    order_no INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by TEXT,
    deleted_at TIMESTAMPTZ
);

-- ----------------------------------------------------------------------------
-- 2. Knowledge Articles Table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS common_util.knowledge_articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    slug TEXT UNIQUE,
    content TEXT NOT NULL,
    excerpt TEXT,
    category_id UUID REFERENCES common_util.knowledge_categories(id) ON DELETE SET NULL,
    author_id UUID REFERENCES core.profiles(id) ON DELETE SET NULL,
    tags TEXT[] DEFAULT '{}',
    is_published BOOLEAN DEFAULT FALSE,
    is_featured BOOLEAN DEFAULT FALSE,
    view_count INTEGER DEFAULT 0,
    helpful_count INTEGER DEFAULT 0,
    not_helpful_count INTEGER DEFAULT 0,
    meta JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by TEXT,
    deleted_at TIMESTAMPTZ
);

-- ----------------------------------------------------------------------------
-- 3. Marketing Assets Table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS common_util.marketing_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    asset_type TEXT NOT NULL CHECK (asset_type IN ('image', 'video', 'document', 'presentation', 'other')),
    file_url TEXT NOT NULL,
    file_name TEXT,
    file_size BIGINT,
    mime_type TEXT,
    thumbnail_url TEXT,
    tags TEXT[] DEFAULT '{}',
    category TEXT,
    is_public BOOLEAN DEFAULT TRUE,
    download_count INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    meta JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by TEXT,
    deleted_at TIMESTAMPTZ
);

-- ----------------------------------------------------------------------------
-- 4. Indexes
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_knowledge_categories_parent ON common_util.knowledge_categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_articles_category ON common_util.knowledge_articles(category_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_articles_author ON common_util.knowledge_articles(author_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_articles_slug ON common_util.knowledge_articles(slug);
CREATE INDEX IF NOT EXISTS idx_knowledge_articles_published ON common_util.knowledge_articles(is_published) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_knowledge_articles_tags ON common_util.knowledge_articles USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_marketing_assets_type ON common_util.marketing_assets(asset_type);
CREATE INDEX IF NOT EXISTS idx_marketing_assets_category ON common_util.marketing_assets(category);
CREATE INDEX IF NOT EXISTS idx_marketing_assets_public ON common_util.marketing_assets(is_public) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_marketing_assets_tags ON common_util.marketing_assets USING GIN(tags);

-- ----------------------------------------------------------------------------
-- 5. Triggers
-- ----------------------------------------------------------------------------
CREATE TRIGGER update_knowledge_categories_updated_at
    BEFORE UPDATE ON common_util.knowledge_categories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_knowledge_articles_updated_at
    BEFORE UPDATE ON common_util.knowledge_articles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_marketing_assets_updated_at
    BEFORE UPDATE ON common_util.marketing_assets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to generate slug from title
CREATE OR REPLACE FUNCTION common_util.generate_article_slug(title_text TEXT)
RETURNS TEXT AS $$
DECLARE
    slug_text TEXT;
    counter INTEGER := 0;
BEGIN
    -- Convert to lowercase, replace spaces with hyphens, remove special chars
    slug_text := LOWER(REGEXP_REPLACE(title_text, '[^a-z0-9]+', '-', 'g'));
    slug_text := TRIM(BOTH '-' FROM slug_text);
    
    -- Ensure uniqueness
    WHILE EXISTS (SELECT 1 FROM common_util.knowledge_articles WHERE slug = slug_text || CASE WHEN counter > 0 THEN '-' || counter::TEXT ELSE '' END) LOOP
        counter := counter + 1;
    END LOOP;
    
    RETURN slug_text || CASE WHEN counter > 0 THEN '-' || counter::TEXT ELSE '' END;
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- 6. RLS Policies
-- ----------------------------------------------------------------------------
ALTER TABLE common_util.knowledge_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE common_util.knowledge_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE common_util.marketing_assets ENABLE ROW LEVEL SECURITY;

-- Knowledge Categories: All authenticated users can view
CREATE POLICY "Authenticated users can view knowledge categories"
    ON common_util.knowledge_categories FOR SELECT
    USING (core.get_clerk_user_id() IS NOT NULL AND deleted_at IS NULL);

CREATE POLICY "Users can create knowledge categories"
    ON common_util.knowledge_categories FOR INSERT
    WITH CHECK (core.get_clerk_user_id() IS NOT NULL);

CREATE POLICY "Users can update own knowledge categories"
    ON common_util.knowledge_categories FOR UPDATE
    USING (
        core.get_clerk_user_id() IS NOT NULL AND
        created_by = core.get_clerk_user_id()
    );

-- Knowledge Articles: All authenticated users can view published articles, authors can manage
CREATE POLICY "Authenticated users can view published articles"
    ON common_util.knowledge_articles FOR SELECT
    USING (
        core.get_clerk_user_id() IS NOT NULL AND
        deleted_at IS NULL AND
        (is_published = TRUE OR created_by = core.get_clerk_user_id())
    );

CREATE POLICY "Users can create articles"
    ON common_util.knowledge_articles FOR INSERT
    WITH CHECK (core.get_clerk_user_id() IS NOT NULL);

CREATE POLICY "Users can update own articles"
    ON common_util.knowledge_articles FOR UPDATE
    USING (
        core.get_clerk_user_id() IS NOT NULL AND
        created_by = core.get_clerk_user_id()
    );

CREATE POLICY "Users can delete own articles"
    ON common_util.knowledge_articles FOR DELETE
    USING (
        core.get_clerk_user_id() IS NOT NULL AND
        created_by = core.get_clerk_user_id()
    );

-- Marketing Assets: All authenticated users can view public assets, creators can manage
CREATE POLICY "Authenticated users can view public assets"
    ON common_util.marketing_assets FOR SELECT
    USING (
        core.get_clerk_user_id() IS NOT NULL AND
        deleted_at IS NULL AND
        (is_public = TRUE OR created_by = core.get_clerk_user_id())
    );

CREATE POLICY "Users can create marketing assets"
    ON common_util.marketing_assets FOR INSERT
    WITH CHECK (core.get_clerk_user_id() IS NOT NULL);

CREATE POLICY "Users can update own marketing assets"
    ON common_util.marketing_assets FOR UPDATE
    USING (
        core.get_clerk_user_id() IS NOT NULL AND
        created_by = core.get_clerk_user_id()
    );

CREATE POLICY "Users can delete own marketing assets"
    ON common_util.marketing_assets FOR DELETE
    USING (
        core.get_clerk_user_id() IS NOT NULL AND
        created_by = core.get_clerk_user_id()
    );

