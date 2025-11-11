-- ============================================================================
-- Notification Triggers/Automations Table
-- Company OS: Store automation rules for when and how to send notifications
-- ============================================================================
-- Purpose: Define reusable notification triggers that can be enabled/disabled
--          and configured per entity type, action, and conditions
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Notification Triggers Table
-- ----------------------------------------------------------------------------
CREATE TABLE core.notification_triggers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL, -- Human-readable name, e.g., "Task Assignment Notification"
    description TEXT, -- Description of what this trigger does
    entity_type TEXT NOT NULL, -- 'task', 'lead', 'order', 'quotation', etc.
    action TEXT NOT NULL, -- 'created', 'updated', 'assigned', 'status_changed', etc.
    notification_type TEXT NOT NULL, -- References enum_registry.category='notification_type'
    enabled BOOLEAN NOT NULL DEFAULT TRUE, -- Whether this trigger is active
    conditions JSONB, -- Conditions that must be met (e.g., {"status": "pending"})
    recipient_rules JSONB, -- Rules for determining recipients (e.g., {"include": ["assignees"], "exclude": ["actor"]})
    template_title TEXT, -- Optional: custom title template
    template_message TEXT, -- Optional: custom message template
    priority INTEGER DEFAULT 0, -- Higher priority triggers run first
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    deleted_at TIMESTAMPTZ -- Soft delete
);

-- ----------------------------------------------------------------------------
-- 2. Indexes
-- ----------------------------------------------------------------------------
CREATE INDEX idx_notification_triggers_entity_action ON core.notification_triggers(entity_type, action) WHERE deleted_at IS NULL;
CREATE INDEX idx_notification_triggers_enabled ON core.notification_triggers(enabled) WHERE deleted_at IS NULL AND enabled = TRUE;
CREATE INDEX idx_notification_triggers_priority ON core.notification_triggers(priority DESC) WHERE deleted_at IS NULL AND enabled = TRUE;
CREATE INDEX idx_notification_triggers_notification_type ON core.notification_triggers(notification_type) WHERE deleted_at IS NULL;

-- ----------------------------------------------------------------------------
-- 3. RLS Policies
-- ----------------------------------------------------------------------------
ALTER TABLE core.notification_triggers ENABLE ROW LEVEL SECURITY;

-- Only admins/system can view triggers (for now, allow authenticated users to view)
CREATE POLICY "Users can view notification triggers"
    ON core.notification_triggers FOR SELECT
    USING (auth.role() = 'authenticated' AND deleted_at IS NULL);

-- Only service role can insert/update/delete triggers
CREATE POLICY "Service role can manage notification triggers"
    ON core.notification_triggers FOR ALL
    USING (auth.role() = 'service_role');

-- ----------------------------------------------------------------------------
-- 4. Trigger Function for updated_at
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_notification_triggers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_notification_triggers_updated_at
    BEFORE UPDATE ON core.notification_triggers
    FOR EACH ROW
    EXECUTE FUNCTION update_notification_triggers_updated_at();

-- ----------------------------------------------------------------------------
-- 5. Seed Default Notification Triggers
-- ----------------------------------------------------------------------------

-- Task-related triggers
INSERT INTO core.notification_triggers (
    name, description, entity_type, action, notification_type, enabled, recipient_rules, priority
) VALUES
    -- Task Assignment
    (
        'Task Assignment',
        'Notify user when a task is assigned to them',
        'task',
        'assigned',
        'task_assigned',
        TRUE,
        '{"include": ["assignee"], "exclude": ["actor"]}'::jsonb,
        10
    ),
    -- Task Comment
    (
        'Task Comment',
        'Notify task assignees when a comment is added',
        'task',
        'commented',
        'task_commented',
        TRUE,
        '{"include": ["assignees"], "exclude": ["actor"]}'::jsonb,
        10
    ),
    -- Task Status Change
    (
        'Task Status Change',
        'Notify task assignees when task status changes',
        'task',
        'status_changed',
        'task_status_changed',
        TRUE,
        '{"include": ["assignees"], "exclude": ["actor"]}'::jsonb,
        10
    ),
    -- Task Due Soon (handled by scheduled job)
    (
        'Task Due Soon',
        'Notify assignees when task is due soon (24 hours)',
        'task',
        'due_soon',
        'task_due_soon',
        TRUE,
        '{"include": ["assignees"]}'::jsonb,
        5
    ),
    -- Task Overdue (handled by scheduled job)
    (
        'Task Overdue',
        'Notify assignees when task is overdue',
        'task',
        'overdue',
        'task_overdue',
        TRUE,
        '{"include": ["assignees"]}'::jsonb,
        5
    )
ON CONFLICT DO NOTHING;

-- Future: Add triggers for other entity types as they're implemented
-- Lead triggers
-- INSERT INTO core.notification_triggers (name, description, entity_type, action, notification_type, enabled, recipient_rules, priority)
-- VALUES ('Lead Assignment', 'Notify user when a lead is assigned', 'lead', 'assigned', 'lead_assigned', TRUE, '{"include": ["assignee"], "exclude": ["actor"]}'::jsonb, 10);

-- Order triggers
-- INSERT INTO core.notification_triggers (name, description, entity_type, action, notification_type, enabled, recipient_rules, priority)
-- VALUES ('Order Created', 'Notify relevant users when an order is created', 'order', 'created', 'order_created', TRUE, '{"include": ["owner", "department"]}'::jsonb, 10);

-- ----------------------------------------------------------------------------
-- 6. Helper Function: Get Active Triggers for Entity/Action
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION core.get_notification_triggers(
    p_entity_type TEXT,
    p_action TEXT
)
RETURNS TABLE (
    id UUID,
    name TEXT,
    notification_type TEXT,
    conditions JSONB,
    recipient_rules JSONB,
    template_title TEXT,
    template_message TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        nt.id,
        nt.name,
        nt.notification_type,
        nt.conditions,
        nt.recipient_rules,
        nt.template_title,
        nt.template_message
    FROM core.notification_triggers nt
    WHERE nt.entity_type = p_entity_type
        AND nt.action = p_action
        AND nt.enabled = TRUE
        AND nt.deleted_at IS NULL
    ORDER BY nt.priority DESC, nt.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ----------------------------------------------------------------------------
-- 7. Comments
-- ----------------------------------------------------------------------------
COMMENT ON TABLE core.notification_triggers IS 'Stores automation rules for notification triggers';
COMMENT ON COLUMN core.notification_triggers.conditions IS 'JSONB conditions that must be met (e.g., {"status": "pending", "priority": "high"})';
COMMENT ON COLUMN core.notification_triggers.recipient_rules IS 'JSONB rules for determining recipients (e.g., {"include": ["assignees", "department"], "exclude": ["actor"]})';
COMMENT ON COLUMN core.notification_triggers.template_title IS 'Optional: Custom title template with placeholders (e.g., "Task {{title}} was assigned")';
COMMENT ON COLUMN core.notification_triggers.template_message IS 'Optional: Custom message template with placeholders';







