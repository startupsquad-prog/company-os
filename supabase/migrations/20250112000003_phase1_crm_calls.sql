-- ============================================================================
-- Phase 1.3 — CRM Calls Management
-- Company OS: Call tracking and logging in CRM
-- ============================================================================
-- Purpose: Enhanced call management (crm.interactions already exists, but we'll add call-specific features)
-- Relations: Link to crm.leads, core.profiles (caller)
-- ============================================================================

-- Note: crm.interactions table already exists with type='call' support
-- We'll create a dedicated calls table for better call-specific features

-- ----------------------------------------------------------------------------
-- 1. Calls Table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS crm.calls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID REFERENCES crm.leads(id) ON DELETE SET NULL,
    contact_id UUID REFERENCES core.contacts(id) ON DELETE SET NULL,
    caller_id UUID REFERENCES core.profiles(id) ON DELETE SET NULL, -- The employee making/receiving the call
    call_type TEXT NOT NULL CHECK (call_type IN ('inbound', 'outbound', 'missed')),
    direction TEXT CHECK (direction IN ('incoming', 'outgoing')),
    phone_number TEXT,
    duration_seconds INTEGER DEFAULT 0,
    status TEXT DEFAULT 'completed' CHECK (status IN ('completed', 'no_answer', 'busy', 'failed', 'cancelled')),
    outcome TEXT, -- 'connected', 'voicemail', 'no_answer', etc.
    subject TEXT,
    notes TEXT,
    recording_url TEXT,
    scheduled_at TIMESTAMPTZ,
    started_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,
    meta JSONB DEFAULT '{}', -- Additional call metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by TEXT,
    deleted_at TIMESTAMPTZ
);

-- ----------------------------------------------------------------------------
-- 2. Call Notes Table (for detailed call notes/transcripts)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS crm.call_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    call_id UUID NOT NULL REFERENCES crm.calls(id) ON DELETE CASCADE,
    note_type TEXT DEFAULT 'general' CHECK (note_type IN ('general', 'transcript', 'summary', 'action_items')),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by TEXT
);

-- ----------------------------------------------------------------------------
-- 3. Indexes
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_calls_lead ON crm.calls(lead_id);
CREATE INDEX IF NOT EXISTS idx_calls_contact ON crm.calls(contact_id);
CREATE INDEX IF NOT EXISTS idx_calls_caller ON crm.calls(caller_id);
CREATE INDEX IF NOT EXISTS idx_calls_type ON crm.calls(call_type);
CREATE INDEX IF NOT EXISTS idx_calls_status ON crm.calls(status);
CREATE INDEX IF NOT EXISTS idx_calls_scheduled_at ON crm.calls(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_calls_created_at ON crm.calls(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_call_notes_call ON crm.call_notes(call_id);

-- ----------------------------------------------------------------------------
-- 4. Trigger for updated_at
-- ----------------------------------------------------------------------------
CREATE TRIGGER update_calls_updated_at
    BEFORE UPDATE ON crm.calls
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ----------------------------------------------------------------------------
-- 5. RLS Policies
-- ----------------------------------------------------------------------------
ALTER TABLE crm.calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm.call_notes ENABLE ROW LEVEL SECURITY;

-- Calls: Users can view calls for their assigned leads or their own calls
CREATE POLICY "Users can view assigned lead calls"
    ON crm.calls FOR SELECT
    USING (
        core.get_clerk_user_id() IS NOT NULL AND
        deleted_at IS NULL AND
        (
            caller_id IN (SELECT id FROM core.profiles WHERE user_id = core.get_clerk_user_id()) OR
            (lead_id IS NOT NULL AND EXISTS (
                SELECT 1 FROM crm.leads
                WHERE id = calls.lead_id
                AND owner_id IN (
                    SELECT id FROM core.profiles WHERE user_id = core.get_clerk_user_id()
                )
            )) OR
            (contact_id IS NOT NULL AND EXISTS (
                SELECT 1 FROM crm.leads
                WHERE contact_id = calls.contact_id
                AND owner_id IN (
                    SELECT id FROM core.profiles WHERE user_id = core.get_clerk_user_id()
                )
            ))
        )
    );

CREATE POLICY "Users can create calls"
    ON crm.calls FOR INSERT
    WITH CHECK (
        core.get_clerk_user_id() IS NOT NULL AND
        caller_id IN (SELECT id FROM core.profiles WHERE user_id = core.get_clerk_user_id())
    );

CREATE POLICY "Users can update own calls"
    ON crm.calls FOR UPDATE
    USING (
        core.get_clerk_user_id() IS NOT NULL AND
        caller_id IN (SELECT id FROM core.profiles WHERE user_id = core.get_clerk_user_id())
    );

CREATE POLICY "Users can delete own calls"
    ON crm.calls FOR DELETE
    USING (
        core.get_clerk_user_id() IS NOT NULL AND
        caller_id IN (SELECT id FROM core.profiles WHERE user_id = core.get_clerk_user_id())
    );

-- Call Notes: Users can view notes for calls they can see
CREATE POLICY "Users can view call notes"
    ON crm.call_notes FOR SELECT
    USING (
        core.get_clerk_user_id() IS NOT NULL AND
        EXISTS (
            SELECT 1 FROM crm.calls
            WHERE id = call_notes.call_id
            AND deleted_at IS NULL
            AND (
                caller_id IN (SELECT id FROM core.profiles WHERE user_id = core.get_clerk_user_id()) OR
                (lead_id IS NOT NULL AND EXISTS (
                    SELECT 1 FROM crm.leads
                    WHERE id = calls.lead_id
                    AND owner_id IN (
                        SELECT id FROM core.profiles WHERE user_id = core.get_clerk_user_id()
                    )
                ))
            )
        )
    );

CREATE POLICY "Users can create call notes"
    ON crm.call_notes FOR INSERT
    WITH CHECK (
        core.get_clerk_user_id() IS NOT NULL AND
        EXISTS (
            SELECT 1 FROM crm.calls
            WHERE id = call_notes.call_id
            AND caller_id IN (SELECT id FROM core.profiles WHERE user_id = core.get_clerk_user_id())
        )
    );

CREATE POLICY "Users can update own call notes"
    ON crm.call_notes FOR UPDATE
    USING (
        core.get_clerk_user_id() IS NOT NULL AND
        created_by = core.get_clerk_user_id()
    );

CREATE POLICY "Users can delete own call notes"
    ON crm.call_notes FOR DELETE
    USING (
        core.get_clerk_user_id() IS NOT NULL AND
        created_by = core.get_clerk_user_id()
    );

