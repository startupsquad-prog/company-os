-- ============================================================================
-- Phase 4.2 — Password Vault Management
-- Company OS: Secure credential storage for passwords, cards, and documents
-- ============================================================================
-- Purpose: Create three separate tables for password vault items
-- Relations: Link to core.companies, core.profiles (created_by)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Password Vault Passwords Table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS common_util.password_vault_passwords (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    username TEXT, -- Visible, not encrypted
    password_encrypted TEXT NOT NULL, -- Encrypted password
    url TEXT,
    category TEXT, -- Use enum_registry or text
    company_id UUID REFERENCES core.companies(id) ON DELETE SET NULL,
    notes TEXT,
    tags TEXT[],
    is_favorite BOOLEAN DEFAULT false,
    last_accessed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by TEXT,
    deleted_at TIMESTAMPTZ
);

-- ----------------------------------------------------------------------------
-- 2. Password Vault Cards Table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS common_util.password_vault_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL, -- e.g., "Chase Business Card"
    cardholder_name TEXT,
    card_number_encrypted TEXT NOT NULL, -- Encrypted, show last 4 digits
    expiry_month INTEGER CHECK (expiry_month BETWEEN 1 AND 12),
    expiry_year INTEGER CHECK (expiry_year >= 2024),
    cvv_encrypted TEXT, -- Encrypted CVV
    card_type TEXT CHECK (card_type IN ('debit', 'credit')),
    bank_name TEXT NOT NULL, -- Which bank
    billing_address TEXT,
    category TEXT,
    company_id UUID REFERENCES core.companies(id) ON DELETE SET NULL,
    notes TEXT,
    tags TEXT[],
    is_favorite BOOLEAN DEFAULT false,
    last_accessed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by TEXT,
    deleted_at TIMESTAMPTZ
);

-- ----------------------------------------------------------------------------
-- 3. Password Vault Documents Table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS common_util.password_vault_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL, -- e.g., "Company Registration Certificate"
    document_type TEXT CHECK (document_type IN ('passport', 'license', 'certificate', 'contract', 'other')),
    document_number_encrypted TEXT, -- Encrypted document number
    issuer TEXT, -- Who issued it
    issue_date DATE,
    expiry_date DATE,
    file_url TEXT, -- Link to stored file
    file_name TEXT,
    category TEXT,
    company_id UUID REFERENCES core.companies(id) ON DELETE SET NULL,
    notes TEXT,
    tags TEXT[],
    is_favorite BOOLEAN DEFAULT false,
    last_accessed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by TEXT,
    deleted_at TIMESTAMPTZ
);

-- ----------------------------------------------------------------------------
-- 4. Indexes
-- ----------------------------------------------------------------------------
-- Passwords indexes
CREATE INDEX IF NOT EXISTS idx_password_vault_passwords_company ON common_util.password_vault_passwords(company_id);
CREATE INDEX IF NOT EXISTS idx_password_vault_passwords_category ON common_util.password_vault_passwords(category);
CREATE INDEX IF NOT EXISTS idx_password_vault_passwords_favorite ON common_util.password_vault_passwords(is_favorite);
CREATE INDEX IF NOT EXISTS idx_password_vault_passwords_created_by ON common_util.password_vault_passwords(created_by);
CREATE INDEX IF NOT EXISTS idx_password_vault_passwords_deleted ON common_util.password_vault_passwords(deleted_at) WHERE deleted_at IS NULL;

-- Cards indexes
CREATE INDEX IF NOT EXISTS idx_password_vault_cards_company ON common_util.password_vault_cards(company_id);
CREATE INDEX IF NOT EXISTS idx_password_vault_cards_category ON common_util.password_vault_cards(category);
CREATE INDEX IF NOT EXISTS idx_password_vault_cards_favorite ON common_util.password_vault_cards(is_favorite);
CREATE INDEX IF NOT EXISTS idx_password_vault_cards_created_by ON common_util.password_vault_cards(created_by);
CREATE INDEX IF NOT EXISTS idx_password_vault_cards_expiry ON common_util.password_vault_cards(expiry_year, expiry_month);
CREATE INDEX IF NOT EXISTS idx_password_vault_cards_deleted ON common_util.password_vault_cards(deleted_at) WHERE deleted_at IS NULL;

-- Documents indexes
CREATE INDEX IF NOT EXISTS idx_password_vault_documents_company ON common_util.password_vault_documents(company_id);
CREATE INDEX IF NOT EXISTS idx_password_vault_documents_category ON common_util.password_vault_documents(category);
CREATE INDEX IF NOT EXISTS idx_password_vault_documents_favorite ON common_util.password_vault_documents(is_favorite);
CREATE INDEX IF NOT EXISTS idx_password_vault_documents_created_by ON common_util.password_vault_documents(created_by);
CREATE INDEX IF NOT EXISTS idx_password_vault_documents_expiry ON common_util.password_vault_documents(expiry_date);
CREATE INDEX IF NOT EXISTS idx_password_vault_documents_deleted ON common_util.password_vault_documents(deleted_at) WHERE deleted_at IS NULL;

-- ----------------------------------------------------------------------------
-- 5. Triggers
-- ----------------------------------------------------------------------------
CREATE TRIGGER update_password_vault_passwords_updated_at
    BEFORE UPDATE ON common_util.password_vault_passwords
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_password_vault_cards_updated_at
    BEFORE UPDATE ON common_util.password_vault_cards
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_password_vault_documents_updated_at
    BEFORE UPDATE ON common_util.password_vault_documents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ----------------------------------------------------------------------------
-- 6. RLS Policies
-- ----------------------------------------------------------------------------
ALTER TABLE common_util.password_vault_passwords ENABLE ROW LEVEL SECURITY;
ALTER TABLE common_util.password_vault_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE common_util.password_vault_documents ENABLE ROW LEVEL SECURITY;

-- Passwords: Users can view/manage items they created or items linked to their company
CREATE POLICY "Users can view password vault passwords"
    ON common_util.password_vault_passwords FOR SELECT
    USING (
        core.get_clerk_user_id() IS NOT NULL AND
        deleted_at IS NULL AND
        (
            created_by = core.get_clerk_user_id() OR
            company_id IN (
                SELECT c.id FROM core.companies c
                JOIN core.company_contacts cc ON cc.company_id = c.id
                JOIN core.contacts ct ON ct.id = cc.contact_id
                JOIN core.profiles p ON p.contact_id = ct.id
                WHERE p.user_id = core.get_clerk_user_id()
            )
        )
    );

CREATE POLICY "Users can create password vault passwords"
    ON common_util.password_vault_passwords FOR INSERT
    WITH CHECK (core.get_clerk_user_id() IS NOT NULL);

CREATE POLICY "Users can update own password vault passwords"
    ON common_util.password_vault_passwords FOR UPDATE
    USING (
        core.get_clerk_user_id() IS NOT NULL AND
        created_by = core.get_clerk_user_id()
    );

CREATE POLICY "Users can delete own password vault passwords"
    ON common_util.password_vault_passwords FOR DELETE
    USING (
        core.get_clerk_user_id() IS NOT NULL AND
        created_by = core.get_clerk_user_id()
    );

-- Cards: Users can view/manage items they created or items linked to their company
CREATE POLICY "Users can view password vault cards"
    ON common_util.password_vault_cards FOR SELECT
    USING (
        core.get_clerk_user_id() IS NOT NULL AND
        deleted_at IS NULL AND
        (
            created_by = core.get_clerk_user_id() OR
            company_id IN (
                SELECT c.id FROM core.companies c
                JOIN core.company_contacts cc ON cc.company_id = c.id
                JOIN core.contacts ct ON ct.id = cc.contact_id
                JOIN core.profiles p ON p.contact_id = ct.id
                WHERE p.user_id = core.get_clerk_user_id()
            )
        )
    );

CREATE POLICY "Users can create password vault cards"
    ON common_util.password_vault_cards FOR INSERT
    WITH CHECK (core.get_clerk_user_id() IS NOT NULL);

CREATE POLICY "Users can update own password vault cards"
    ON common_util.password_vault_cards FOR UPDATE
    USING (
        core.get_clerk_user_id() IS NOT NULL AND
        created_by = core.get_clerk_user_id()
    );

CREATE POLICY "Users can delete own password vault cards"
    ON common_util.password_vault_cards FOR DELETE
    USING (
        core.get_clerk_user_id() IS NOT NULL AND
        created_by = core.get_clerk_user_id()
    );

-- Documents: Users can view/manage items they created or items linked to their company
CREATE POLICY "Users can view password vault documents"
    ON common_util.password_vault_documents FOR SELECT
    USING (
        core.get_clerk_user_id() IS NOT NULL AND
        deleted_at IS NULL AND
        (
            created_by = core.get_clerk_user_id() OR
            company_id IN (
                SELECT c.id FROM core.companies c
                JOIN core.company_contacts cc ON cc.company_id = c.id
                JOIN core.contacts ct ON ct.id = cc.contact_id
                JOIN core.profiles p ON p.contact_id = ct.id
                WHERE p.user_id = core.get_clerk_user_id()
            )
        )
    );

CREATE POLICY "Users can create password vault documents"
    ON common_util.password_vault_documents FOR INSERT
    WITH CHECK (core.get_clerk_user_id() IS NOT NULL);

CREATE POLICY "Users can update own password vault documents"
    ON common_util.password_vault_documents FOR UPDATE
    USING (
        core.get_clerk_user_id() IS NOT NULL AND
        created_by = core.get_clerk_user_id()
    );

CREATE POLICY "Users can delete own password vault documents"
    ON common_util.password_vault_documents FOR DELETE
    USING (
        core.get_clerk_user_id() IS NOT NULL AND
        created_by = core.get_clerk_user_id()
    );

-- ----------------------------------------------------------------------------
-- 7. Add Optional Link from Subscriptions to Passwords
-- ----------------------------------------------------------------------------
ALTER TABLE common_util.subscriptions 
ADD COLUMN IF NOT EXISTS password_vault_password_id UUID REFERENCES common_util.password_vault_passwords(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_subscriptions_password_vault ON common_util.subscriptions(password_vault_password_id);

