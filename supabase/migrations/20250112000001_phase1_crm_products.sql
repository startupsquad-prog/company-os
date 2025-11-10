-- ============================================================================
-- Phase 1.1 — CRM Products Management
-- Company OS: Product catalog with variants and collections
-- ============================================================================
-- Purpose: Product management for CRM module
-- Relations: Products link to core.contacts (suppliers), core.companies (manufacturers)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Collections Table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS crm.collections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by TEXT,
    deleted_at TIMESTAMPTZ
);

-- ----------------------------------------------------------------------------
-- 2. Products Table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS crm.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    sku TEXT UNIQUE,
    description TEXT,
    category TEXT,
    brand TEXT,
    supplier_id UUID REFERENCES core.contacts(id) ON DELETE SET NULL,
    manufacturer_id UUID REFERENCES core.companies(id) ON DELETE SET NULL,
    base_price NUMERIC(15, 2),
    currency TEXT DEFAULT 'USD',
    cost_price NUMERIC(15, 2),
    image_url TEXT,
    images TEXT[] DEFAULT '{}',
    tags TEXT[] DEFAULT '{}',
    meta JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by TEXT,
    deleted_at TIMESTAMPTZ
);

-- ----------------------------------------------------------------------------
-- 3. Product Variants Table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS crm.product_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES crm.products(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    sku TEXT UNIQUE,
    price NUMERIC(15, 2),
    cost_price NUMERIC(15, 2),
    stock_quantity INTEGER DEFAULT 0,
    attributes JSONB DEFAULT '{}', -- e.g., {"color": "red", "size": "large"}
    image_url TEXT,
    is_default BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by TEXT,
    deleted_at TIMESTAMPTZ
);

-- ----------------------------------------------------------------------------
-- 4. Product Collections Join Table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS crm.product_collections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES crm.products(id) ON DELETE CASCADE,
    collection_id UUID NOT NULL REFERENCES crm.collections(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by TEXT,
    UNIQUE(product_id, collection_id)
);

-- ----------------------------------------------------------------------------
-- 5. Indexes
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_products_supplier ON crm.products(supplier_id);
CREATE INDEX IF NOT EXISTS idx_products_manufacturer ON crm.products(manufacturer_id);
CREATE INDEX IF NOT EXISTS idx_products_sku ON crm.products(sku);
CREATE INDEX IF NOT EXISTS idx_products_category ON crm.products(category);
CREATE INDEX IF NOT EXISTS idx_products_active ON crm.products(is_active) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_product_variants_product ON crm.product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_sku ON crm.product_variants(sku);
CREATE INDEX IF NOT EXISTS idx_product_collections_product ON crm.product_collections(product_id);
CREATE INDEX IF NOT EXISTS idx_product_collections_collection ON crm.product_collections(collection_id);

-- ----------------------------------------------------------------------------
-- 6. Triggers for updated_at
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_collections_updated_at
    BEFORE UPDATE ON crm.collections
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON crm.products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_variants_updated_at
    BEFORE UPDATE ON crm.product_variants
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ----------------------------------------------------------------------------
-- 7. RLS Policies
-- ----------------------------------------------------------------------------
ALTER TABLE crm.collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm.product_collections ENABLE ROW LEVEL SECURITY;

-- Collections: All authenticated users can view, creators can manage
CREATE POLICY "Authenticated users can view collections"
    ON crm.collections FOR SELECT
    USING (core.get_clerk_user_id() IS NOT NULL AND deleted_at IS NULL);

CREATE POLICY "Users can create collections"
    ON crm.collections FOR INSERT
    WITH CHECK (core.get_clerk_user_id() IS NOT NULL);

CREATE POLICY "Users can update own collections"
    ON crm.collections FOR UPDATE
    USING (core.get_clerk_user_id() IS NOT NULL AND created_by = core.get_clerk_user_id());

CREATE POLICY "Users can delete own collections"
    ON crm.collections FOR DELETE
    USING (core.get_clerk_user_id() IS NOT NULL AND created_by = core.get_clerk_user_id());

-- Products: All authenticated users can view, creators can manage
CREATE POLICY "Authenticated users can view products"
    ON crm.products FOR SELECT
    USING (core.get_clerk_user_id() IS NOT NULL AND deleted_at IS NULL);

CREATE POLICY "Users can create products"
    ON crm.products FOR INSERT
    WITH CHECK (core.get_clerk_user_id() IS NOT NULL);

CREATE POLICY "Users can update own products"
    ON crm.products FOR UPDATE
    USING (core.get_clerk_user_id() IS NOT NULL AND created_by = core.get_clerk_user_id());

CREATE POLICY "Users can delete own products"
    ON crm.products FOR DELETE
    USING (core.get_clerk_user_id() IS NOT NULL AND created_by = core.get_clerk_user_id());

-- Product Variants: All authenticated users can view, product creators can manage
CREATE POLICY "Authenticated users can view product variants"
    ON crm.product_variants FOR SELECT
    USING (core.get_clerk_user_id() IS NOT NULL AND deleted_at IS NULL);

CREATE POLICY "Users can create product variants"
    ON crm.product_variants FOR INSERT
    WITH CHECK (
        core.get_clerk_user_id() IS NOT NULL AND
        EXISTS (
            SELECT 1 FROM crm.products
            WHERE id = product_variants.product_id
            AND created_by = core.get_clerk_user_id()
        )
    );

CREATE POLICY "Users can update own product variants"
    ON crm.product_variants FOR UPDATE
    USING (
        core.get_clerk_user_id() IS NOT NULL AND
        EXISTS (
            SELECT 1 FROM crm.products
            WHERE id = product_variants.product_id
            AND created_by = core.get_clerk_user_id()
        )
    );

CREATE POLICY "Users can delete own product variants"
    ON crm.product_variants FOR DELETE
    USING (
        core.get_clerk_user_id() IS NOT NULL AND
        EXISTS (
            SELECT 1 FROM crm.products
            WHERE id = product_variants.product_id
            AND created_by = core.get_clerk_user_id()
        )
    );

-- Product Collections: All authenticated users can view, product creators can manage
CREATE POLICY "Authenticated users can view product collections"
    ON crm.product_collections FOR SELECT
    USING (core.get_clerk_user_id() IS NOT NULL);

CREATE POLICY "Users can manage product collections"
    ON crm.product_collections FOR ALL
    USING (
        core.get_clerk_user_id() IS NOT NULL AND
        EXISTS (
            SELECT 1 FROM crm.products
            WHERE id = product_collections.product_id
            AND created_by = core.get_clerk_user_id()
        )
    );

