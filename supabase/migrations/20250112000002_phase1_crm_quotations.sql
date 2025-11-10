-- ============================================================================
-- Phase 1.2 — CRM Quotations
-- Company OS: Quotations in CRM context (different from ops.quotations)
-- ============================================================================
-- Purpose: Quotations/quotes sent to leads in CRM module
-- Relations: Link to crm.leads, crm.products, core.profiles (created_by)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. CRM Quotations Table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS crm.quotations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL REFERENCES crm.leads(id) ON DELETE CASCADE,
    quote_number TEXT UNIQUE NOT NULL,
    title TEXT,
    description TEXT,
    total_amount NUMERIC(15, 2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    tax_amount NUMERIC(15, 2) DEFAULT 0,
    discount_amount NUMERIC(15, 2) DEFAULT 0,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'viewed', 'accepted', 'rejected', 'expired', 'cancelled')),
    valid_until DATE,
    items JSONB DEFAULT '[]', -- Array of line items: [{"product_id": "...", "name": "...", "quantity": 1, "price": 100, ...}]
    terms TEXT,
    notes TEXT,
    pdf_url TEXT,
    meta JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by TEXT,
    deleted_at TIMESTAMPTZ
);

-- ----------------------------------------------------------------------------
-- 2. Quotation Status History Table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS crm.quotation_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quotation_id UUID NOT NULL REFERENCES crm.quotations(id) ON DELETE CASCADE,
    status TEXT NOT NULL,
    previous_status TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by TEXT
);

-- ----------------------------------------------------------------------------
-- 3. Indexes
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_quotations_lead ON crm.quotations(lead_id);
CREATE INDEX IF NOT EXISTS idx_quotations_status ON crm.quotations(status);
CREATE INDEX IF NOT EXISTS idx_quotations_quote_number ON crm.quotations(quote_number);
CREATE INDEX IF NOT EXISTS idx_quotations_created_at ON crm.quotations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_quotation_status_history_quotation ON crm.quotation_status_history(quotation_id);

-- ----------------------------------------------------------------------------
-- 4. Trigger for updated_at
-- ----------------------------------------------------------------------------
CREATE TRIGGER update_quotations_updated_at
    BEFORE UPDATE ON crm.quotations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ----------------------------------------------------------------------------
-- 5. Trigger for Status History
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION crm.log_quotation_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO crm.quotation_status_history (
            quotation_id,
            status,
            previous_status,
            created_by
        ) VALUES (
            NEW.id,
            NEW.status,
            OLD.status,
            NEW.created_by
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER quotation_status_change_trigger
    AFTER UPDATE ON crm.quotations
    FOR EACH ROW
    EXECUTE FUNCTION crm.log_quotation_status_change();

-- ----------------------------------------------------------------------------
-- 6. Function to Generate Quote Number
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION crm.generate_quote_number()
RETURNS TEXT AS $$
DECLARE
    new_number TEXT;
    year_part TEXT;
    seq_num INTEGER;
BEGIN
    year_part := TO_CHAR(NOW(), 'YYYY');
    
    -- Get the next sequence number for this year
    SELECT COALESCE(MAX(CAST(SUBSTRING(quote_number FROM '[0-9]+$') AS INTEGER)), 0) + 1
    INTO seq_num
    FROM crm.quotations
    WHERE quote_number LIKE 'QT-' || year_part || '-%'
    AND deleted_at IS NULL;
    
    new_number := 'QT-' || year_part || '-' || LPAD(seq_num::TEXT, 6, '0');
    RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- 7. RLS Policies
-- ----------------------------------------------------------------------------
ALTER TABLE crm.quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm.quotation_status_history ENABLE ROW LEVEL SECURITY;

-- Quotations: Users can view quotations for their assigned leads, creators can manage
CREATE POLICY "Users can view assigned lead quotations"
    ON crm.quotations FOR SELECT
    USING (
        core.get_clerk_user_id() IS NOT NULL AND
        deleted_at IS NULL AND
        (
            created_by = core.get_clerk_user_id() OR
            EXISTS (
                SELECT 1 FROM crm.leads
                WHERE id = quotations.lead_id
                AND owner_id IN (
                    SELECT id FROM core.profiles WHERE user_id = core.get_clerk_user_id()
                )
            )
        )
    );

CREATE POLICY "Users can create quotations"
    ON crm.quotations FOR INSERT
    WITH CHECK (
        core.get_clerk_user_id() IS NOT NULL AND
        EXISTS (
            SELECT 1 FROM crm.leads
            WHERE id = quotations.lead_id
            AND owner_id IN (
                SELECT id FROM core.profiles WHERE user_id = core.get_clerk_user_id()
            )
        )
    );

CREATE POLICY "Users can update own quotations"
    ON crm.quotations FOR UPDATE
    USING (
        core.get_clerk_user_id() IS NOT NULL AND
        created_by = core.get_clerk_user_id()
    );

CREATE POLICY "Users can delete own quotations"
    ON crm.quotations FOR DELETE
    USING (
        core.get_clerk_user_id() IS NOT NULL AND
        created_by = core.get_clerk_user_id()
    );

-- Quotation Status History: Users can view history for quotations they can see
CREATE POLICY "Users can view quotation status history"
    ON crm.quotation_status_history FOR SELECT
    USING (
        core.get_clerk_user_id() IS NOT NULL AND
        EXISTS (
            SELECT 1 FROM crm.quotations
            WHERE id = quotation_status_history.quotation_id
            AND deleted_at IS NULL
            AND (
                created_by = core.get_clerk_user_id() OR
                EXISTS (
                    SELECT 1 FROM crm.leads
                    WHERE id = quotations.lead_id
                    AND owner_id IN (
                        SELECT id FROM core.profiles WHERE user_id = core.get_clerk_user_id()
                    )
                )
            )
        )
    );

