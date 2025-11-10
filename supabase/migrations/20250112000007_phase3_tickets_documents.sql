-- ============================================================================
-- Phase 3.2 & 3.3 — Tickets/Support System & Documents Management
-- Company OS: Support ticket system and document library
-- ============================================================================
-- Purpose: Ticket management and document storage with assignments
-- Relations: Link to core.profiles (creator, assignee), core.contacts (client), use Supabase Storage
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Tickets Table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS common_util.tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_number TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    client_id UUID REFERENCES core.contacts(id) ON DELETE SET NULL,
    client_email TEXT,
    client_name TEXT,
    status TEXT DEFAULT 'new' CHECK (status IN ('new', 'open', 'in_progress', 'waiting', 'resolved', 'closed', 'cancelled')),
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    category TEXT,
    assignee_id UUID REFERENCES core.profiles(id) ON DELETE SET NULL,
    due_date TIMESTAMPTZ,
    resolution TEXT,
    resolved_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES core.profiles(id) ON DELETE SET NULL,
    meta JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by TEXT,
    deleted_at TIMESTAMPTZ
);

-- ----------------------------------------------------------------------------
-- 2. Ticket Comments Table (for ticket chat/communication)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS common_util.ticket_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES common_util.tickets(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES core.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_internal BOOLEAN DEFAULT FALSE, -- Internal notes vs client-visible comments
    attachments JSONB DEFAULT '[]', -- Array of file URLs
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- ----------------------------------------------------------------------------
-- 3. Ticket Assignments Table (for multiple assignees)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS common_util.ticket_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES common_util.tickets(id) ON DELETE CASCADE,
    assignee_id UUID NOT NULL REFERENCES core.profiles(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'assignee' CHECK (role IN ('assignee', 'watcher', 'collaborator')),
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    assigned_by TEXT,
    UNIQUE(ticket_id, assignee_id)
);

-- ----------------------------------------------------------------------------
-- 4. Ticket Status History Table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS common_util.ticket_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES common_util.tickets(id) ON DELETE CASCADE,
    status TEXT NOT NULL,
    previous_status TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by TEXT
);

-- ----------------------------------------------------------------------------
-- 5. Documents Table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS common_util.documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_size BIGINT,
    mime_type TEXT,
    category TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'deleted')),
    download_count INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    meta JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by TEXT,
    deleted_at TIMESTAMPTZ
);

-- ----------------------------------------------------------------------------
-- 6. Document Assignments Table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS common_util.document_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES common_util.documents(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES core.profiles(id) ON DELETE CASCADE,
    can_view BOOLEAN DEFAULT TRUE,
    can_download BOOLEAN DEFAULT TRUE,
    can_edit BOOLEAN DEFAULT FALSE,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    assigned_by TEXT,
    UNIQUE(document_id, profile_id)
);

-- ----------------------------------------------------------------------------
-- 7. Indexes
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_tickets_client ON common_util.tickets(client_id);
CREATE INDEX IF NOT EXISTS idx_tickets_assignee ON common_util.tickets(assignee_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON common_util.tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_priority ON common_util.tickets(priority);
CREATE INDEX IF NOT EXISTS idx_tickets_ticket_number ON common_util.tickets(ticket_number);
CREATE INDEX IF NOT EXISTS idx_ticket_comments_ticket ON common_util.ticket_comments(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_comments_author ON common_util.ticket_comments(author_id);
CREATE INDEX IF NOT EXISTS idx_ticket_assignments_ticket ON common_util.ticket_assignments(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_assignments_assignee ON common_util.ticket_assignments(assignee_id);
CREATE INDEX IF NOT EXISTS idx_ticket_status_history_ticket ON common_util.ticket_status_history(ticket_id);
CREATE INDEX IF NOT EXISTS idx_documents_category ON common_util.documents(category);
CREATE INDEX IF NOT EXISTS idx_documents_status ON common_util.documents(status);
CREATE INDEX IF NOT EXISTS idx_document_assignments_document ON common_util.document_assignments(document_id);
CREATE INDEX IF NOT EXISTS idx_document_assignments_profile ON common_util.document_assignments(profile_id);

-- ----------------------------------------------------------------------------
-- 8. Triggers
-- ----------------------------------------------------------------------------
CREATE TRIGGER update_tickets_updated_at
    BEFORE UPDATE ON common_util.tickets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ticket_comments_updated_at
    BEFORE UPDATE ON common_util.ticket_comments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_documents_updated_at
    BEFORE UPDATE ON common_util.documents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to generate ticket number
CREATE OR REPLACE FUNCTION common_util.generate_ticket_number()
RETURNS TEXT AS $$
DECLARE
    new_number TEXT;
    year_part TEXT;
    seq_num INTEGER;
BEGIN
    year_part := TO_CHAR(NOW(), 'YYYY');
    
    SELECT COALESCE(MAX(CAST(SUBSTRING(ticket_number FROM '[0-9]+$') AS INTEGER)), 0) + 1
    INTO seq_num
    FROM common_util.tickets
    WHERE ticket_number LIKE 'TKT-' || year_part || '-%'
    AND deleted_at IS NULL;
    
    new_number := 'TKT-' || year_part || '-' || LPAD(seq_num::TEXT, 6, '0');
    RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Trigger for ticket status history
CREATE OR REPLACE FUNCTION common_util.log_ticket_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO common_util.ticket_status_history (
            ticket_id,
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

CREATE TRIGGER ticket_status_change_trigger
    AFTER UPDATE ON common_util.tickets
    FOR EACH ROW
    EXECUTE FUNCTION common_util.log_ticket_status_change();

-- ----------------------------------------------------------------------------
-- 9. RLS Policies
-- ----------------------------------------------------------------------------
ALTER TABLE common_util.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE common_util.ticket_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE common_util.ticket_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE common_util.ticket_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE common_util.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE common_util.document_assignments ENABLE ROW LEVEL SECURITY;

-- Tickets: Users can view tickets they created, are assigned to, or assigned to their team
CREATE POLICY "Users can view relevant tickets"
    ON common_util.tickets FOR SELECT
    USING (
        core.get_clerk_user_id() IS NOT NULL AND
        deleted_at IS NULL AND
        (
            created_by = core.get_clerk_user_id() OR
            assignee_id IN (SELECT id FROM core.profiles WHERE user_id = core.get_clerk_user_id()) OR
            EXISTS (
                SELECT 1 FROM common_util.ticket_assignments
                WHERE ticket_id = tickets.id
                AND assignee_id IN (SELECT id FROM core.profiles WHERE user_id = core.get_clerk_user_id())
            )
        )
    );

CREATE POLICY "Users can create tickets"
    ON common_util.tickets FOR INSERT
    WITH CHECK (core.get_clerk_user_id() IS NOT NULL);

CREATE POLICY "Users can update assigned tickets"
    ON common_util.tickets FOR UPDATE
    USING (
        core.get_clerk_user_id() IS NOT NULL AND
        (
            created_by = core.get_clerk_user_id() OR
            assignee_id IN (SELECT id FROM core.profiles WHERE user_id = core.get_clerk_user_id()) OR
            EXISTS (
                SELECT 1 FROM common_util.ticket_assignments
                WHERE ticket_id = tickets.id
                AND assignee_id IN (SELECT id FROM core.profiles WHERE user_id = core.get_clerk_user_id())
            )
        )
    );

-- Ticket Comments: Users can view comments for tickets they can see
CREATE POLICY "Users can view ticket comments"
    ON common_util.ticket_comments FOR SELECT
    USING (
        core.get_clerk_user_id() IS NOT NULL AND
        deleted_at IS NULL AND
        EXISTS (
            SELECT 1 FROM common_util.tickets
            WHERE id = ticket_comments.ticket_id
            AND deleted_at IS NULL
            AND (
                created_by = core.get_clerk_user_id() OR
                assignee_id IN (SELECT id FROM core.profiles WHERE user_id = core.get_clerk_user_id()) OR
                EXISTS (
                    SELECT 1 FROM common_util.ticket_assignments
                    WHERE ticket_id = ticket_comments.ticket_id
                    AND assignee_id IN (SELECT id FROM core.profiles WHERE user_id = core.get_clerk_user_id())
                )
            )
        )
    );

CREATE POLICY "Users can create ticket comments"
    ON common_util.ticket_comments FOR INSERT
    WITH CHECK (
        core.get_clerk_user_id() IS NOT NULL AND
        author_id IN (SELECT id FROM core.profiles WHERE user_id = core.get_clerk_user_id()) AND
        EXISTS (
            SELECT 1 FROM common_util.tickets
            WHERE id = ticket_comments.ticket_id
            AND deleted_at IS NULL
        )
    );

-- Ticket Assignments: Users can view assignments for tickets they can see
CREATE POLICY "Users can view ticket assignments"
    ON common_util.ticket_assignments FOR SELECT
    USING (
        core.get_clerk_user_id() IS NOT NULL AND
        EXISTS (
            SELECT 1 FROM common_util.tickets
            WHERE id = ticket_assignments.ticket_id
            AND deleted_at IS NULL
        )
    );

CREATE POLICY "Users can manage ticket assignments"
    ON common_util.ticket_assignments FOR ALL
    USING (
        core.get_clerk_user_id() IS NOT NULL AND
        EXISTS (
            SELECT 1 FROM common_util.tickets
            WHERE id = ticket_assignments.ticket_id
            AND (
                created_by = core.get_clerk_user_id() OR
                assignee_id IN (SELECT id FROM core.profiles WHERE user_id = core.get_clerk_user_id())
            )
        )
    );

-- Documents: Users can view documents assigned to them or created by them
CREATE POLICY "Users can view assigned documents"
    ON common_util.documents FOR SELECT
    USING (
        core.get_clerk_user_id() IS NOT NULL AND
        deleted_at IS NULL AND
        (
            created_by = core.get_clerk_user_id() OR
            EXISTS (
                SELECT 1 FROM common_util.document_assignments
                WHERE document_id = documents.id
                AND profile_id IN (SELECT id FROM core.profiles WHERE user_id = core.get_clerk_user_id())
                AND can_view = TRUE
            )
        )
    );

CREATE POLICY "Users can create documents"
    ON common_util.documents FOR INSERT
    WITH CHECK (core.get_clerk_user_id() IS NOT NULL);

CREATE POLICY "Users can update own documents"
    ON common_util.documents FOR UPDATE
    USING (
        core.get_clerk_user_id() IS NOT NULL AND
        created_by = core.get_clerk_user_id()
    );

-- Document Assignments: Users can view assignments for documents they can see
CREATE POLICY "Users can view document assignments"
    ON common_util.document_assignments FOR SELECT
    USING (
        core.get_clerk_user_id() IS NOT NULL AND
        EXISTS (
            SELECT 1 FROM common_util.documents
            WHERE id = document_assignments.document_id
            AND deleted_at IS NULL
        )
    );

CREATE POLICY "Users can manage document assignments"
    ON common_util.document_assignments FOR ALL
    USING (
        core.get_clerk_user_id() IS NOT NULL AND
        EXISTS (
            SELECT 1 FROM common_util.documents
            WHERE id = document_assignments.document_id
            AND created_by = core.get_clerk_user_id()
        )
    );

