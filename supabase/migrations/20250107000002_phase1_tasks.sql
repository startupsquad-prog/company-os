-- ============================================================================
-- Phase 1.1 — Task Management Schema
-- Company OS: Task management tables in common_util schema
-- ============================================================================

-- ============================================================================
-- TASK MANAGEMENT TABLES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. tasks - Main task table
-- ----------------------------------------------------------------------------
CREATE TABLE common_util.tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    priority TEXT, -- References enum_registry.category='task_priority'
    status TEXT, -- References enum_registry.category='task_status'
    department_id UUID REFERENCES core.departments(id) ON DELETE SET NULL,
    vertical_key TEXT, -- For vertical-specific tasks
    due_date TIMESTAMPTZ,
    created_by UUID REFERENCES core.profiles(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES core.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- ----------------------------------------------------------------------------
-- 2. task_assignees - Many-to-many: tasks ↔ profiles
-- ----------------------------------------------------------------------------
CREATE TABLE common_util.task_assignees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES common_util.tasks(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES core.profiles(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'collaborator', -- 'owner', 'collaborator', 'watcher'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(task_id, profile_id),
    CHECK (role IN ('owner', 'collaborator', 'watcher'))
);

-- ----------------------------------------------------------------------------
-- 3. task_comments - Comments on tasks
-- ----------------------------------------------------------------------------
CREATE TABLE common_util.task_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES common_util.tasks(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES core.profiles(id) ON DELETE SET NULL,
    body TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 4. task_status_history - Status change audit trail
-- ----------------------------------------------------------------------------
CREATE TABLE common_util.task_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES common_util.tasks(id) ON DELETE CASCADE,
    from_status TEXT,
    to_status TEXT NOT NULL,
    changed_by UUID REFERENCES core.profiles(id) ON DELETE SET NULL,
    changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Tasks indexes
CREATE INDEX idx_tasks_department_id ON common_util.tasks(department_id);
CREATE INDEX idx_tasks_created_by ON common_util.tasks(created_by);
CREATE INDEX idx_tasks_updated_by ON common_util.tasks(updated_by);
CREATE INDEX idx_tasks_status ON common_util.tasks(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_tasks_priority ON common_util.tasks(priority) WHERE deleted_at IS NULL;
CREATE INDEX idx_tasks_due_date ON common_util.tasks(due_date) WHERE deleted_at IS NULL AND due_date IS NOT NULL;
CREATE INDEX idx_tasks_deleted_at ON common_util.tasks(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_tasks_vertical_key ON common_util.tasks(vertical_key) WHERE vertical_key IS NOT NULL;

-- Task assignees indexes
CREATE INDEX idx_task_assignees_task_id ON common_util.task_assignees(task_id);
CREATE INDEX idx_task_assignees_profile_id ON common_util.task_assignees(profile_id);
CREATE INDEX idx_task_assignees_role ON common_util.task_assignees(role);

-- Task comments indexes
CREATE INDEX idx_task_comments_task_id ON common_util.task_comments(task_id);
CREATE INDEX idx_task_comments_author_id ON common_util.task_comments(author_id);
CREATE INDEX idx_task_comments_created_at ON common_util.task_comments(created_at DESC);

-- Task status history indexes
CREATE INDEX idx_task_status_history_task_id ON common_util.task_status_history(task_id);
CREATE INDEX idx_task_status_history_changed_at ON common_util.task_status_history(changed_at DESC);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE common_util.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE common_util.task_assignees ENABLE ROW LEVEL SECURITY;
ALTER TABLE common_util.task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE common_util.task_status_history ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Tasks Policies
-- ----------------------------------------------------------------------------

-- Employees can read tasks they created or are assigned to
CREATE POLICY "Employees can read own and assigned tasks"
    ON common_util.tasks FOR SELECT
    USING (
        auth.role() = 'authenticated' AND (
            created_by = (SELECT id FROM core.profiles WHERE user_id = auth.uid())
            OR id IN (
                SELECT task_id FROM common_util.task_assignees 
                WHERE profile_id = (SELECT id FROM core.profiles WHERE user_id = auth.uid())
            )
        )
    );

-- Managers can read all tasks in their department
CREATE POLICY "Managers can read department tasks"
    ON common_util.tasks FOR SELECT
    USING (
        auth.role() = 'authenticated' AND
        department_id IN (
            SELECT department_id FROM core.profiles 
            WHERE user_id = auth.uid()
        )
    );

-- Admins/Superadmins can read all tasks
CREATE POLICY "Admins can read all tasks"
    ON common_util.tasks FOR SELECT
    USING (
        auth.role() = 'authenticated' AND
        EXISTS (
            SELECT 1 FROM core.user_role_bindings urb
            JOIN core.roles r ON urb.role_id = r.id
            WHERE urb.user_id = auth.uid()
            AND r.name IN ('admin', 'superadmin')
        )
    );

-- Employees can create tasks
CREATE POLICY "Employees can create tasks"
    ON common_util.tasks FOR INSERT
    WITH CHECK (
        auth.role() = 'authenticated' AND
        created_by = (SELECT id FROM core.profiles WHERE user_id = auth.uid())
    );

-- Employees can update tasks they created or are assigned to
CREATE POLICY "Employees can update own and assigned tasks"
    ON common_util.tasks FOR UPDATE
    USING (
        auth.role() = 'authenticated' AND (
            created_by = (SELECT id FROM core.profiles WHERE user_id = auth.uid())
            OR id IN (
                SELECT task_id FROM common_util.task_assignees 
                WHERE profile_id = (SELECT id FROM core.profiles WHERE user_id = auth.uid())
                AND role IN ('owner', 'collaborator')
            )
        )
    )
    WITH CHECK (
        updated_by = (SELECT id FROM core.profiles WHERE user_id = auth.uid())
    );

-- Managers can update tasks in their department
CREATE POLICY "Managers can update department tasks"
    ON common_util.tasks FOR UPDATE
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

-- Admins/Superadmins can update all tasks
CREATE POLICY "Admins can update all tasks"
    ON common_util.tasks FOR UPDATE
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

-- Employees can delete (soft delete) tasks they created
CREATE POLICY "Employees can delete own tasks"
    ON common_util.tasks FOR UPDATE
    USING (
        auth.role() = 'authenticated' AND
        created_by = (SELECT id FROM core.profiles WHERE user_id = auth.uid())
    )
    WITH CHECK (
        deleted_at IS NOT NULL AND
        updated_by = (SELECT id FROM core.profiles WHERE user_id = auth.uid())
    );

-- Managers can delete tasks in their department
CREATE POLICY "Managers can delete department tasks"
    ON common_util.tasks FOR UPDATE
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

-- Admins/Superadmins can delete all tasks
CREATE POLICY "Admins can delete all tasks"
    ON common_util.tasks FOR UPDATE
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
-- Task Assignees Policies
-- ----------------------------------------------------------------------------

-- Users can read assignees for tasks they can access
CREATE POLICY "Users can read task assignees"
    ON common_util.task_assignees FOR SELECT
    USING (
        auth.role() = 'authenticated' AND
        task_id IN (
            SELECT id FROM common_util.tasks WHERE deleted_at IS NULL
        )
    );

-- Task creators and owners can manage assignees
CREATE POLICY "Task owners can manage assignees"
    ON common_util.task_assignees FOR ALL
    USING (
        auth.role() = 'authenticated' AND (
            task_id IN (
                SELECT id FROM common_util.tasks 
                WHERE created_by = (SELECT id FROM core.profiles WHERE user_id = auth.uid())
            )
            OR task_id IN (
                SELECT task_id FROM common_util.task_assignees 
                WHERE profile_id = (SELECT id FROM core.profiles WHERE user_id = auth.uid())
                AND role = 'owner'
            )
        )
    );

-- Admins/Superadmins can manage all assignees
CREATE POLICY "Admins can manage all assignees"
    ON common_util.task_assignees FOR ALL
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
-- Task Comments Policies
-- ----------------------------------------------------------------------------

-- Users can read comments for tasks they can access
CREATE POLICY "Users can read task comments"
    ON common_util.task_comments FOR SELECT
    USING (
        auth.role() = 'authenticated' AND
        task_id IN (
            SELECT id FROM common_util.tasks WHERE deleted_at IS NULL
        )
    );

-- Authenticated users can create comments on accessible tasks
CREATE POLICY "Users can create comments on accessible tasks"
    ON common_util.task_comments FOR INSERT
    WITH CHECK (
        auth.role() = 'authenticated' AND
        author_id = (SELECT id FROM core.profiles WHERE user_id = auth.uid()) AND
        task_id IN (
            SELECT id FROM common_util.tasks WHERE deleted_at IS NULL
        )
    );

-- Comment authors can update their own comments
CREATE POLICY "Users can update own comments"
    ON common_util.task_comments FOR UPDATE
    USING (
        auth.role() = 'authenticated' AND
        author_id = (SELECT id FROM core.profiles WHERE user_id = auth.uid())
    );

-- Admins/Superadmins can update all comments
CREATE POLICY "Admins can update all comments"
    ON common_util.task_comments FOR UPDATE
    USING (
        auth.role() = 'authenticated' AND
        EXISTS (
            SELECT 1 FROM core.user_role_bindings urb
            JOIN core.roles r ON urb.role_id = r.id
            WHERE urb.user_id = auth.uid()
            AND r.name IN ('admin', 'superadmin')
        )
    );

-- Comment authors can delete their own comments
CREATE POLICY "Users can delete own comments"
    ON common_util.task_comments FOR DELETE
    USING (
        auth.role() = 'authenticated' AND
        author_id = (SELECT id FROM core.profiles WHERE user_id = auth.uid())
    );

-- Admins/Superadmins can delete all comments
CREATE POLICY "Admins can delete all comments"
    ON common_util.task_comments FOR DELETE
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
-- Task Status History Policies
-- ----------------------------------------------------------------------------

-- Users can read status history for tasks they can access
CREATE POLICY "Users can read task status history"
    ON common_util.task_status_history FOR SELECT
    USING (
        auth.role() = 'authenticated' AND
        task_id IN (
            SELECT id FROM common_util.tasks WHERE deleted_at IS NULL
        )
    );

-- System can insert status history (via triggers or application)
-- Note: In practice, status history is typically inserted via triggers
-- For now, allow authenticated users to insert (can be restricted later)
CREATE POLICY "Users can create status history"
    ON common_util.task_status_history FOR INSERT
    WITH CHECK (
        auth.role() = 'authenticated' AND
        changed_by = (SELECT id FROM core.profiles WHERE user_id = auth.uid())
    );

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION common_util.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to tasks
CREATE TRIGGER update_tasks_updated_at
    BEFORE UPDATE ON common_util.tasks
    FOR EACH ROW
    EXECUTE FUNCTION common_util.update_updated_at_column();

-- Function to automatically log status changes
CREATE OR REPLACE FUNCTION common_util.log_task_status_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Only log if status actually changed
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO common_util.task_status_history (
            task_id,
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
CREATE TRIGGER log_task_status_change
    AFTER UPDATE OF status ON common_util.tasks
    FOR EACH ROW
    WHEN (OLD.status IS DISTINCT FROM NEW.status)
    EXECUTE FUNCTION common_util.log_task_status_change();

-- ============================================================================
-- RELATIONSHIPS SUMMARY
-- ============================================================================
/*
KEY RELATIONSHIPS:

Task Management:
- common_util.tasks (many:1) → core.departments
- common_util.tasks (many:1) → core.profiles (created_by, updated_by)
- common_util.tasks (many:many) → core.profiles (via common_util.task_assignees)
- common_util.task_assignees (many:1) → common_util.tasks
- common_util.task_assignees (many:1) → core.profiles
- common_util.task_comments (many:1) → common_util.tasks
- common_util.task_comments (many:1) → core.profiles (author_id)
- common_util.task_status_history (many:1) → common_util.tasks
- common_util.task_status_history (many:1) → core.profiles (changed_by)

RLS Pattern:
- Employees: Read/write own tasks + assigned tasks
- Managers: Read/write all tasks in their department
- Admins/Superadmins: Full access to all tasks

Status History:
- Automatically logged via trigger when task status changes
- Always append records; never overwrite
*/

