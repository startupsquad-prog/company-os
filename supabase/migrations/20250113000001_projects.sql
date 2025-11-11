-- ============================================================================
-- Projects Management Schema
-- Company OS: Project management tables in common_util schema
-- ============================================================================

-- ============================================================================
-- PROJECT MANAGEMENT TABLES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. projects - Main project table
-- ----------------------------------------------------------------------------
CREATE TABLE common_util.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    category TEXT, -- References enum_registry.category='project_category'
    status TEXT, -- References enum_registry.category='project_status'
    start_date TIMESTAMPTZ,
    due_date TIMESTAMPTZ,
    department_id UUID REFERENCES core.departments(id) ON DELETE SET NULL,
    vertical_key TEXT, -- For vertical-specific projects
    created_by UUID REFERENCES core.profiles(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES core.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- ----------------------------------------------------------------------------
-- 2. project_members - Many-to-many: projects ↔ profiles
-- ----------------------------------------------------------------------------
CREATE TABLE common_util.project_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES common_util.projects(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES core.profiles(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'collaborator', -- 'owner', 'collaborator', 'watcher'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(project_id, profile_id),
    CHECK (role IN ('owner', 'collaborator', 'watcher'))
);

-- ----------------------------------------------------------------------------
-- 3. project_status_history - Status change audit trail
-- ----------------------------------------------------------------------------
CREATE TABLE common_util.project_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES common_util.projects(id) ON DELETE CASCADE,
    from_status TEXT,
    to_status TEXT NOT NULL,
    changed_by UUID REFERENCES core.profiles(id) ON DELETE SET NULL,
    changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 4. Add project_id to tasks table
-- ----------------------------------------------------------------------------
ALTER TABLE common_util.tasks
    ADD COLUMN project_id UUID REFERENCES common_util.projects(id) ON DELETE SET NULL;

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Projects indexes
CREATE INDEX idx_projects_department_id ON common_util.projects(department_id);
CREATE INDEX idx_projects_created_by ON common_util.projects(created_by);
CREATE INDEX idx_projects_updated_by ON common_util.projects(updated_by);
CREATE INDEX idx_projects_status ON common_util.projects(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_projects_category ON common_util.projects(category) WHERE deleted_at IS NULL;
CREATE INDEX idx_projects_due_date ON common_util.projects(due_date) WHERE deleted_at IS NULL AND due_date IS NOT NULL;
CREATE INDEX idx_projects_deleted_at ON common_util.projects(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_projects_vertical_key ON common_util.projects(vertical_key) WHERE vertical_key IS NOT NULL;

-- Project members indexes
CREATE INDEX idx_project_members_project_id ON common_util.project_members(project_id);
CREATE INDEX idx_project_members_profile_id ON common_util.project_members(profile_id);
CREATE INDEX idx_project_members_role ON common_util.project_members(role);

-- Project status history indexes
CREATE INDEX idx_project_status_history_project_id ON common_util.project_status_history(project_id);
CREATE INDEX idx_project_status_history_changed_at ON common_util.project_status_history(changed_at DESC);

-- Tasks project_id index
CREATE INDEX idx_tasks_project_id ON common_util.tasks(project_id) WHERE project_id IS NOT NULL;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE common_util.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE common_util.project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE common_util.project_status_history ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Projects Policies
-- ----------------------------------------------------------------------------

-- Employees can read projects they created or are members of
CREATE POLICY "Employees can read own and assigned projects"
    ON common_util.projects FOR SELECT
    USING (
        auth.role() = 'authenticated' AND (
            created_by = (SELECT id FROM core.profiles WHERE user_id = auth.uid())
            OR id IN (
                SELECT project_id FROM common_util.project_members 
                WHERE profile_id = (SELECT id FROM core.profiles WHERE user_id = auth.uid())
            )
        )
    );

-- Managers can read all projects in their department
CREATE POLICY "Managers can read department projects"
    ON common_util.projects FOR SELECT
    USING (
        auth.role() = 'authenticated' AND
        department_id IN (
            SELECT department_id FROM core.profiles 
            WHERE user_id = auth.uid()
        )
    );

-- Admins/Superadmins can read all projects
CREATE POLICY "Admins can read all projects"
    ON common_util.projects FOR SELECT
    USING (
        auth.role() = 'authenticated' AND
        EXISTS (
            SELECT 1 FROM core.user_role_bindings urb
            JOIN core.roles r ON urb.role_id = r.id
            WHERE urb.user_id = auth.uid()
            AND r.name IN ('admin', 'superadmin')
        )
    );

-- Employees can create projects
CREATE POLICY "Employees can create projects"
    ON common_util.projects FOR INSERT
    WITH CHECK (
        auth.role() = 'authenticated' AND
        created_by = (SELECT id FROM core.profiles WHERE user_id = auth.uid())
    );

-- Employees can update projects they created or are owners/collaborators of
CREATE POLICY "Employees can update own and assigned projects"
    ON common_util.projects FOR UPDATE
    USING (
        auth.role() = 'authenticated' AND (
            created_by = (SELECT id FROM core.profiles WHERE user_id = auth.uid())
            OR id IN (
                SELECT project_id FROM common_util.project_members 
                WHERE profile_id = (SELECT id FROM core.profiles WHERE user_id = auth.uid())
                AND role IN ('owner', 'collaborator')
            )
        )
    )
    WITH CHECK (
        updated_by = (SELECT id FROM core.profiles WHERE user_id = auth.uid())
    );

-- Managers can update projects in their department
CREATE POLICY "Managers can update department projects"
    ON common_util.projects FOR UPDATE
    USING (
        auth.role() = 'authenticated' AND
        department_id IN (
            SELECT department_id FROM core.profiles 
            WHERE user_id = auth.uid()
        )
    )
    WITH CHECK (
        updated_by = (SELECT id FROM core.profiles WHERE user_id = auth.uid())
    );

-- Admins/Superadmins can update all projects
CREATE POLICY "Admins can update all projects"
    ON common_util.projects FOR UPDATE
    USING (
        auth.role() = 'authenticated' AND
        EXISTS (
            SELECT 1 FROM core.user_role_bindings urb
            JOIN core.roles r ON urb.role_id = r.id
            WHERE urb.user_id = auth.uid()
            AND r.name IN ('admin', 'superadmin')
        )
    )
    WITH CHECK (
        updated_by = (SELECT id FROM core.profiles WHERE user_id = auth.uid())
    );

-- Employees can delete (soft delete) projects they created
CREATE POLICY "Employees can delete own projects"
    ON common_util.projects FOR UPDATE
    USING (
        auth.role() = 'authenticated' AND
        created_by = (SELECT id FROM core.profiles WHERE user_id = auth.uid())
    )
    WITH CHECK (
        deleted_at IS NOT NULL AND
        updated_by = (SELECT id FROM core.profiles WHERE user_id = auth.uid())
    );

-- Managers can delete projects in their department
CREATE POLICY "Managers can delete department projects"
    ON common_util.projects FOR UPDATE
    USING (
        auth.role() = 'authenticated' AND
        department_id IN (
            SELECT department_id FROM core.profiles 
            WHERE user_id = auth.uid()
        )
    )
    WITH CHECK (
        deleted_at IS NOT NULL AND
        updated_by = (SELECT id FROM core.profiles WHERE user_id = auth.uid())
    );

-- Admins/Superadmins can delete all projects
CREATE POLICY "Admins can delete all projects"
    ON common_util.projects FOR UPDATE
    USING (
        auth.role() = 'authenticated' AND
        EXISTS (
            SELECT 1 FROM core.user_role_bindings urb
            JOIN core.roles r ON urb.role_id = r.id
            WHERE urb.user_id = auth.uid()
            AND r.name IN ('admin', 'superadmin')
        )
    )
    WITH CHECK (
        deleted_at IS NOT NULL AND
        updated_by = (SELECT id FROM core.profiles WHERE user_id = auth.uid())
    );

-- ----------------------------------------------------------------------------
-- Project Members Policies
-- ----------------------------------------------------------------------------

-- Users can read members for projects they can access
CREATE POLICY "Users can read project members"
    ON common_util.project_members FOR SELECT
    USING (
        auth.role() = 'authenticated' AND
        project_id IN (
            SELECT id FROM common_util.projects WHERE deleted_at IS NULL
        )
    );

-- Project creators and owners can manage members
CREATE POLICY "Project owners can manage members"
    ON common_util.project_members FOR ALL
    USING (
        auth.role() = 'authenticated' AND (
            project_id IN (
                SELECT id FROM common_util.projects 
                WHERE created_by = (SELECT id FROM core.profiles WHERE user_id = auth.uid())
            )
            OR project_id IN (
                SELECT project_id FROM common_util.project_members 
                WHERE profile_id = (SELECT id FROM core.profiles WHERE user_id = auth.uid())
                AND role = 'owner'
            )
        )
    );

-- Admins/Superadmins can manage all members
CREATE POLICY "Admins can manage all members"
    ON common_util.project_members FOR ALL
    USING (
        auth.role() = 'authenticated' AND
        EXISTS (
            SELECT 1 FROM core.user_role_bindings urb
            JOIN core.roles r ON urb.role_id = r.id
            WHERE urb.user_id = auth.uid()
            AND r.name IN ('admin', 'superadmin')
        )
    );

-- ----------------------------------------------------------------------------
-- Project Status History Policies
-- ----------------------------------------------------------------------------

-- Users can read status history for projects they can access
CREATE POLICY "Users can read project status history"
    ON common_util.project_status_history FOR SELECT
    USING (
        auth.role() = 'authenticated' AND
        project_id IN (
            SELECT id FROM common_util.projects WHERE deleted_at IS NULL
        )
    );

-- System can insert status history (via triggers or application)
CREATE POLICY "Users can create status history"
    ON common_util.project_status_history FOR INSERT
    WITH CHECK (
        auth.role() = 'authenticated' AND
        changed_by = (SELECT id FROM core.profiles WHERE user_id = auth.uid())
    );

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
-- (Already exists from tasks migration, but ensuring it's available)
CREATE OR REPLACE FUNCTION common_util.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to projects
CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON common_util.projects
    FOR EACH ROW
    EXECUTE FUNCTION common_util.update_updated_at_column();

-- Function to automatically log status changes
CREATE OR REPLACE FUNCTION common_util.log_project_status_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Only log if status actually changed
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO common_util.project_status_history (
            project_id,
            from_status,
            to_status,
            changed_by,
            changed_at
        ) VALUES (
            NEW.id,
            OLD.status,
            NEW.status,
            NEW.updated_by,
            NOW()
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to log status changes
CREATE TRIGGER log_project_status_change
    AFTER UPDATE OF status ON common_util.projects
    FOR EACH ROW
    WHEN (OLD.status IS DISTINCT FROM NEW.status)
    EXECUTE FUNCTION common_util.log_project_status_change();

-- ============================================================================
-- ENUM REGISTRY ENTRIES
-- ============================================================================

-- Project Category
INSERT INTO core.enum_registry (category, key, label, order_no, description) VALUES
    ('project_category', 'prototyping', 'Prototyping', 1, 'Prototype development project'),
    ('project_category', 'ui_ux_design', 'UI/UX Design', 2, 'User interface and user experience design project'),
    ('project_category', 'development', 'Development', 3, 'Software development project'),
    ('project_category', 'marketing', 'Marketing', 4, 'Marketing campaign project'),
    ('project_category', 'research', 'Research', 5, 'Research and analysis project')
ON CONFLICT (category, key) DO NOTHING;

-- Project Status
INSERT INTO core.enum_registry (category, key, label, order_no, description) VALUES
    ('project_status', 'planning', 'Planning', 1, 'Project in planning phase'),
    ('project_status', 'in_progress', 'In Progress', 2, 'Project actively in progress'),
    ('project_status', 'on_hold', 'On Hold', 3, 'Project temporarily on hold'),
    ('project_status', 'completed', 'Completed', 4, 'Project completed'),
    ('project_status', 'cancelled', 'Cancelled', 5, 'Project cancelled')
ON CONFLICT (category, key) DO NOTHING;

-- ============================================================================
-- RELATIONSHIPS SUMMARY
-- ============================================================================
/*
KEY RELATIONSHIPS:

Project Management:
- common_util.projects (many:1) → core.departments
- common_util.projects (many:1) → core.profiles (created_by, updated_by)
- common_util.projects (many:many) → core.profiles (via common_util.project_members)
- common_util.project_members (many:1) → common_util.projects
- common_util.project_members (many:1) → core.profiles
- common_util.project_status_history (many:1) → common_util.projects
- common_util.project_status_history (many:1) → core.profiles (changed_by)
- common_util.tasks (many:1) → common_util.projects (via project_id)

RLS Pattern:
- Employees: Read/write own projects + assigned projects
- Managers: Read/write all projects in their department
- Admins/Superadmins: Full access to all projects

Status History:
- Automatically logged via trigger when project status changes
- Always append records; never overwrite
*/

