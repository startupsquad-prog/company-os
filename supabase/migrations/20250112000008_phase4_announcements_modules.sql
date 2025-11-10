-- ============================================================================
-- Phase 4.3 & 4.5 — Announcements & Dynamic Modules Builder
-- Company OS: System announcements and dynamic module fields/records
-- ============================================================================
-- Purpose: Announcement banners and dynamic module data management
-- Relations: Link to core.profiles (created_by), use existing core.modules
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Announcements Table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS core.announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    announcement_type TEXT DEFAULT 'info' CHECK (announcement_type IN ('info', 'warning', 'success', 'error', 'maintenance')),
    priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    is_active BOOLEAN DEFAULT TRUE,
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    target_audience TEXT DEFAULT 'all' CHECK (target_audience IN ('all', 'admin', 'employee', 'specific')),
    target_roles TEXT[] DEFAULT '{}', -- Array of role names if target_audience is 'specific'
    target_departments UUID[] DEFAULT '{}', -- Array of department IDs
    dismissible BOOLEAN DEFAULT TRUE,
    action_url TEXT,
    action_label TEXT,
    view_count INTEGER DEFAULT 0,
    meta JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by TEXT,
    deleted_at TIMESTAMPTZ
);

-- ----------------------------------------------------------------------------
-- 2. Announcement Views Table (track who has seen/dismissed)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS core.announcement_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    announcement_id UUID NOT NULL REFERENCES core.announcements(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL, -- Clerk user ID
    viewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    dismissed_at TIMESTAMPTZ,
    UNIQUE(announcement_id, user_id)
);

-- ----------------------------------------------------------------------------
-- 3. Module Fields Table (for dynamic modules)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS core.module_fields (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_id UUID NOT NULL REFERENCES core.modules(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    label TEXT NOT NULL,
    field_type TEXT NOT NULL CHECK (field_type IN ('text', 'textarea', 'number', 'email', 'phone', 'date', 'datetime', 'boolean', 'select', 'multiselect', 'file', 'url', 'json')),
    is_required BOOLEAN DEFAULT FALSE,
    default_value TEXT,
    options JSONB DEFAULT '[]', -- For select/multiselect fields
    validation_rules JSONB DEFAULT '{}', -- e.g., {"min": 0, "max": 100, "pattern": "..."}
    order_no INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    meta JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by TEXT,
    deleted_at TIMESTAMPTZ
);

-- ----------------------------------------------------------------------------
-- 4. Module Records Table (data entries for dynamic modules)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS core.module_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_id UUID NOT NULL REFERENCES core.modules(id) ON DELETE CASCADE,
    data JSONB NOT NULL DEFAULT '{}', -- Flexible data storage based on module fields
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'deleted')),
    meta JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by TEXT,
    deleted_at TIMESTAMPTZ
);

-- ----------------------------------------------------------------------------
-- 5. Module Record Assignments Table (for assigning records to users/teams)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS core.module_record_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    record_id UUID NOT NULL REFERENCES core.module_records(id) ON DELETE CASCADE,
    profile_id UUID REFERENCES core.profiles(id) ON DELETE CASCADE,
    team_id UUID REFERENCES core.teams(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'viewer' CHECK (role IN ('viewer', 'editor', 'owner')),
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    assigned_by TEXT,
    CHECK ((profile_id IS NOT NULL AND team_id IS NULL) OR (profile_id IS NULL AND team_id IS NOT NULL))
);

-- ----------------------------------------------------------------------------
-- 6. Indexes
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_announcements_active ON core.announcements(is_active) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_announcements_dates ON core.announcements(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_announcement_views_announcement ON core.announcement_views(announcement_id);
CREATE INDEX IF NOT EXISTS idx_announcement_views_user ON core.announcement_views(user_id);
CREATE INDEX IF NOT EXISTS idx_module_fields_module ON core.module_fields(module_id);
CREATE INDEX IF NOT EXISTS idx_module_fields_active ON core.module_fields(is_active) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_module_records_module ON core.module_records(module_id);
CREATE INDEX IF NOT EXISTS idx_module_records_status ON core.module_records(status);
CREATE INDEX IF NOT EXISTS idx_module_record_assignments_record ON core.module_record_assignments(record_id);
CREATE INDEX IF NOT EXISTS idx_module_record_assignments_profile ON core.module_record_assignments(profile_id);
CREATE INDEX IF NOT EXISTS idx_module_record_assignments_team ON core.module_record_assignments(team_id);

-- ----------------------------------------------------------------------------
-- 7. Triggers
-- ----------------------------------------------------------------------------
CREATE TRIGGER update_announcements_updated_at
    BEFORE UPDATE ON core.announcements
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_module_fields_updated_at
    BEFORE UPDATE ON core.module_fields
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_module_records_updated_at
    BEFORE UPDATE ON core.module_records
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ----------------------------------------------------------------------------
-- 8. RLS Policies
-- ----------------------------------------------------------------------------
ALTER TABLE core.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.announcement_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.module_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.module_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.module_record_assignments ENABLE ROW LEVEL SECURITY;

-- Announcements: All authenticated users can view active announcements
CREATE POLICY "Authenticated users can view active announcements"
    ON core.announcements FOR SELECT
    USING (
        core.get_clerk_user_id() IS NOT NULL AND
        deleted_at IS NULL AND
        is_active = TRUE AND
        (start_date IS NULL OR start_date <= NOW()) AND
        (end_date IS NULL OR end_date >= NOW())
    );

CREATE POLICY "Admins can manage announcements"
    ON core.announcements FOR ALL
    USING (
        core.get_clerk_user_id() IS NOT NULL AND
        EXISTS (
            SELECT 1 FROM core.user_role_bindings urb
            JOIN core.roles r ON r.id = urb.role_id
            WHERE urb.user_id = core.get_clerk_user_id()
            AND r.name = 'admin'
        )
    );

-- Announcement Views: Users can view/manage their own views
CREATE POLICY "Users can view own announcement views"
    ON core.announcement_views FOR SELECT
    USING (
        core.get_clerk_user_id() IS NOT NULL AND
        user_id = core.get_clerk_user_id()
    );

CREATE POLICY "Users can create announcement views"
    ON core.announcement_views FOR INSERT
    WITH CHECK (
        core.get_clerk_user_id() IS NOT NULL AND
        user_id = core.get_clerk_user_id()
    );

CREATE POLICY "Users can update own announcement views"
    ON core.announcement_views FOR UPDATE
    USING (
        core.get_clerk_user_id() IS NOT NULL AND
        user_id = core.get_clerk_user_id()
    );

-- Module Fields: All authenticated users can view, creators can manage
CREATE POLICY "Authenticated users can view module fields"
    ON core.module_fields FOR SELECT
    USING (
        core.get_clerk_user_id() IS NOT NULL AND
        deleted_at IS NULL AND
        is_active = TRUE
    );

CREATE POLICY "Users can create module fields"
    ON core.module_fields FOR INSERT
    WITH CHECK (core.get_clerk_user_id() IS NOT NULL);

CREATE POLICY "Users can update own module fields"
    ON core.module_fields FOR UPDATE
    USING (
        core.get_clerk_user_id() IS NOT NULL AND
        created_by = core.get_clerk_user_id()
    );

-- Module Records: Users can view records they created or are assigned to
CREATE POLICY "Users can view assigned module records"
    ON core.module_records FOR SELECT
    USING (
        core.get_clerk_user_id() IS NOT NULL AND
        deleted_at IS NULL AND
        (
            created_by = core.get_clerk_user_id() OR
            EXISTS (
                SELECT 1 FROM core.module_record_assignments
                WHERE record_id = module_records.id
                AND (
                    profile_id IN (SELECT id FROM core.profiles WHERE user_id = core.get_clerk_user_id()) OR
                    team_id IN (
                        SELECT t.id FROM core.teams t
                        JOIN core.profiles p ON p.department_id = t.department_id
                        WHERE p.user_id = core.get_clerk_user_id()
                    )
                )
            )
        )
    );

CREATE POLICY "Users can create module records"
    ON core.module_records FOR INSERT
    WITH CHECK (core.get_clerk_user_id() IS NOT NULL);

CREATE POLICY "Users can update own module records"
    ON core.module_records FOR UPDATE
    USING (
        core.get_clerk_user_id() IS NOT NULL AND
        (
            created_by = core.get_clerk_user_id() OR
            EXISTS (
                SELECT 1 FROM core.module_record_assignments
                WHERE record_id = module_records.id
                AND profile_id IN (SELECT id FROM core.profiles WHERE user_id = core.get_clerk_user_id())
                AND role IN ('editor', 'owner')
            )
        )
    );

-- Module Record Assignments: Users can view assignments for records they can see
CREATE POLICY "Users can view module record assignments"
    ON core.module_record_assignments FOR SELECT
    USING (
        core.get_clerk_user_id() IS NOT NULL AND
        EXISTS (
            SELECT 1 FROM core.module_records
            WHERE id = module_record_assignments.record_id
            AND deleted_at IS NULL
        )
    );

CREATE POLICY "Users can manage module record assignments"
    ON core.module_record_assignments FOR ALL
    USING (
        core.get_clerk_user_id() IS NOT NULL AND
        EXISTS (
            SELECT 1 FROM core.module_records
            WHERE id = module_record_assignments.record_id
            AND (
                created_by = core.get_clerk_user_id() OR
                EXISTS (
                    SELECT 1 FROM core.module_record_assignments mra
                    WHERE mra.record_id = module_record_assignments.record_id
                    AND mra.profile_id IN (SELECT id FROM core.profiles WHERE user_id = core.get_clerk_user_id())
                    AND mra.role = 'owner'
                )
            )
        )
    );

