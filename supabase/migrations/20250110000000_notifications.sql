-- ============================================================================
-- Notifications System
-- Company OS: Notification system with database storage and real-time updates
-- ============================================================================
-- Purpose: Store notifications in database, support real-time updates, and
--          integrate with Supabase Edge Functions for background processing
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Notifications Table
-- ----------------------------------------------------------------------------
CREATE TABLE core.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- References enum_registry.category='notification_type'
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    entity_type TEXT, -- Polymorphic: 'task', 'lead', 'order', 'quotation', etc.
    entity_id UUID, -- Polymorphic: ID of the entity
    read_at TIMESTAMPTZ, -- NULL = unread, timestamp = read
    action_url TEXT, -- Deep link to relevant page (e.g., '/dashboard/tasks/123')
    metadata JSONB, -- Extra data: actor_id, action details, etc.
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ -- Soft delete
);

-- Computed column for read status (read_at IS NULL = unread)
CREATE INDEX idx_notifications_read ON core.notifications(user_id, read_at) WHERE deleted_at IS NULL;

-- ----------------------------------------------------------------------------
-- 2. Notification Preferences Table
-- ----------------------------------------------------------------------------
CREATE TABLE core.notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    notification_type TEXT NOT NULL, -- References enum_registry.category='notification_type'
    enabled BOOLEAN NOT NULL DEFAULT TRUE, -- In-app notification enabled
    email_enabled BOOLEAN NOT NULL DEFAULT FALSE, -- Email notification enabled (future)
    whatsapp_enabled BOOLEAN NOT NULL DEFAULT FALSE, -- WhatsApp notification enabled (future)
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, notification_type)
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Notifications indexes
CREATE INDEX idx_notifications_user_id ON core.notifications(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_notifications_created_at ON core.notifications(created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_notifications_entity ON core.notifications(entity_type, entity_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_notifications_type ON core.notifications(type) WHERE deleted_at IS NULL;

-- Notification preferences indexes
CREATE INDEX idx_notification_preferences_user_id ON core.notification_preferences(user_id);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE core.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.notification_preferences ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- Notifications RLS Policies
-- ----------------------------------------------------------------------------

-- Users can only see their own notifications
CREATE POLICY "Users can view their own notifications"
    ON core.notifications FOR SELECT
    USING (auth.uid() = user_id AND deleted_at IS NULL);

-- System can create notifications (via service role)
-- Note: In practice, notifications are created via Supabase Edge Functions using service role
CREATE POLICY "Service role can create notifications"
    ON core.notifications FOR INSERT
    WITH CHECK (true); -- Service role bypasses RLS

-- Users can update their own notifications (mark as read, delete)
CREATE POLICY "Users can update their own notifications"
    ON core.notifications FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Users can delete their own notifications (soft delete)
CREATE POLICY "Users can delete their own notifications"
    ON core.notifications FOR DELETE
    USING (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- Notification Preferences RLS Policies
-- ----------------------------------------------------------------------------

-- Users can view their own preferences
CREATE POLICY "Users can view their own notification preferences"
    ON core.notification_preferences FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert their own preferences
CREATE POLICY "Users can insert their own notification preferences"
    ON core.notification_preferences FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own preferences
CREATE POLICY "Users can update their own notification preferences"
    ON core.notification_preferences FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- ENUM REGISTRY ENTRIES
-- ============================================================================

-- Notification types
INSERT INTO core.enum_registry (category, key, label, order_no, description) VALUES
    ('notification_type', 'task_assigned', 'Task Assigned', 1, 'Notification when a task is assigned to a user'),
    ('notification_type', 'task_commented', 'Task Commented', 2, 'Notification when someone comments on a task'),
    ('notification_type', 'task_status_changed', 'Task Status Changed', 3, 'Notification when task status changes'),
    ('notification_type', 'task_due_soon', 'Task Due Soon', 4, 'Notification when task is due soon'),
    ('notification_type', 'task_overdue', 'Task Overdue', 5, 'Notification when task is overdue'),
    ('notification_type', 'task_mentioned', 'Task Mentioned', 6, 'Notification when user is mentioned in a task comment'),
    ('notification_type', 'lead_assigned', 'Lead Assigned', 10, 'Notification when a lead is assigned to a user'),
    ('notification_type', 'lead_status_changed', 'Lead Status Changed', 11, 'Notification when lead status changes'),
    ('notification_type', 'order_created', 'Order Created', 20, 'Notification when a new order is created'),
    ('notification_type', 'order_status_changed', 'Order Status Changed', 21, 'Notification when order status changes'),
    ('notification_type', 'quotation_approved', 'Quotation Approved', 22, 'Notification when quotation is approved'),
    ('notification_type', 'quotation_rejected', 'Quotation Rejected', 23, 'Notification when quotation is rejected'),
    ('notification_type', 'shipment_delivered', 'Shipment Delivered', 24, 'Notification when shipment is delivered'),
    ('notification_type', 'system', 'System Notification', 100, 'System-wide notifications'),
    ('notification_type', 'mention', 'Mention', 101, 'Notification when user is mentioned')
ON CONFLICT (category, key) DO UPDATE SET
    label = EXCLUDED.label,
    order_no = EXCLUDED.order_no,
    description = EXCLUDED.description;

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to get unread notification count for a user
CREATE OR REPLACE FUNCTION core.get_unread_notification_count(user_id_param UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    unread_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO unread_count
    FROM core.notifications
    WHERE user_id = user_id_param
    AND read_at IS NULL
    AND deleted_at IS NULL;
    
    RETURN COALESCE(unread_count, 0);
END;
$$;

-- Function to mark all notifications as read for a user
CREATE OR REPLACE FUNCTION core.mark_all_notifications_read(user_id_param UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    updated_count INTEGER;
BEGIN
    UPDATE core.notifications
    SET read_at = NOW()
    WHERE user_id = user_id_param
    AND read_at IS NULL
    AND deleted_at IS NULL;
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RETURN updated_count;
END;
$$;

-- ============================================================================
-- NOTES
-- ============================================================================
/*
Notification System Design:

1. **Polymorphic Entity Links:**
   - Notifications use entity_type + entity_id to link to any entity
   - Examples: ('task', task_id), ('lead', lead_id), ('order', order_id)

2. **Read Status:**
   - read_at IS NULL = unread
   - read_at IS NOT NULL = read (timestamp indicates when read)

3. **Soft Deletes:**
   - deleted_at IS NULL = active notification
   - deleted_at IS NOT NULL = deleted notification (maintains history)

4. **Notification Types:**
   - Stored in enum_registry for flexibility
   - Can add new types without migrations

5. **Real-time Updates:**
   - Supabase Realtime can subscribe to INSERT events on notifications
   - Filter by user_id = current_user_id

6. **RLS Policies:**
   - Users can only see their own notifications
   - Service role can create notifications (via Trigger.dev jobs)
   - Users can update/delete their own notifications

7. **Action URLs:**
   - Deep links to relevant pages
   - Examples: '/dashboard/tasks/123', '/dashboard/leads/456'

8. **Metadata:**
   - JSONB field for extra data
   - Can store: actor_id, action details, custom fields

9. **Notification Preferences:**
   - Per-user, per-notification-type preferences
   - Supports in-app, email, and WhatsApp (future)
   - Default: in-app enabled, email/WhatsApp disabled
*/

-- Notifications System
-- Company OS: Notification tables in core schema
-- ============================================================================

-- ============================================================================
-- NOTIFICATION TABLES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. notifications - Main notification table
-- ----------------------------------------------------------------------------
CREATE TABLE core.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- References enum_registry.category='notification_type'
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    entity_type TEXT, -- Polymorphic: 'task', 'lead', 'order', 'quotation', etc.
    entity_id UUID, -- Polymorphic: ID of the entity
    read_at TIMESTAMPTZ, -- NULL = unread
    action_url TEXT, -- Deep link to relevant page
    metadata JSONB, -- Extra data like actor_id, action details, etc.
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ -- Soft delete
);

-- ----------------------------------------------------------------------------
-- 2. notification_preferences - User notification preferences
-- ----------------------------------------------------------------------------
CREATE TABLE core.notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    notification_type TEXT NOT NULL, -- References enum_registry.category='notification_type'
    enabled BOOLEAN DEFAULT TRUE, -- In-app notification enabled
    email_enabled BOOLEAN DEFAULT FALSE, -- Email notification enabled (future)
    whatsapp_enabled BOOLEAN DEFAULT FALSE, -- WhatsApp notification enabled (future)
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, notification_type)
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Notifications indexes
CREATE INDEX idx_notifications_user_id ON core.notifications(user_id);
CREATE INDEX idx_notifications_read_at ON core.notifications(read_at) WHERE read_at IS NULL;
CREATE INDEX idx_notifications_created_at ON core.notifications(created_at DESC);
CREATE INDEX idx_notifications_type ON core.notifications(type);
CREATE INDEX idx_notifications_entity ON core.notifications(entity_type, entity_id) WHERE entity_type IS NOT NULL AND entity_id IS NOT NULL;
CREATE INDEX idx_notifications_deleted_at ON core.notifications(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_notifications_user_unread ON core.notifications(user_id, read_at) WHERE read_at IS NULL AND deleted_at IS NULL;

-- Notification preferences indexes
CREATE INDEX idx_notification_preferences_user_id ON core.notification_preferences(user_id);
CREATE INDEX idx_notification_preferences_type ON core.notification_preferences(notification_type);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE core.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.notification_preferences ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- RLS Policies
-- ----------------------------------------------------------------------------

-- Notifications: Users can only see their own notifications
CREATE POLICY "Users can view own notifications"
    ON core.notifications FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
    ON core.notifications FOR UPDATE
    USING (auth.uid() = user_id);

-- System can insert notifications (via service role)
-- Note: This will be handled via service role in Supabase Edge Functions
-- For now, allow authenticated users to insert (will be restricted via service role in practice)
CREATE POLICY "System can create notifications"
    ON core.notifications FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- Notification preferences: Users can manage their own preferences
CREATE POLICY "Users can view own notification preferences"
    ON core.notification_preferences FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notification preferences"
    ON core.notification_preferences FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notification preferences"
    ON core.notification_preferences FOR UPDATE
    USING (auth.uid() = user_id);

-- ============================================================================
-- COMPUTED COLUMNS & FUNCTIONS
-- ============================================================================

-- Function to get unread count for a user
CREATE OR REPLACE FUNCTION core.get_unread_notification_count(p_user_id UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)
        FROM core.notifications
        WHERE user_id = p_user_id
            AND read_at IS NULL
            AND deleted_at IS NULL
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Update updated_at timestamp for notification_preferences
CREATE OR REPLACE FUNCTION update_notification_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_notification_preferences_updated_at
    BEFORE UPDATE ON core.notification_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_notification_preferences_updated_at();

-- ============================================================================
-- ENUM REGISTRY ENTRIES
-- ============================================================================

-- Notification types
INSERT INTO core.enum_registry (category, key, label, order_no, description) VALUES
('notification_type', 'task_assigned', 'Task Assigned', 1, 'Notification when a task is assigned to a user'),
('notification_type', 'task_commented', 'Task Commented', 2, 'Notification when a comment is added to a task'),
('notification_type', 'task_status_changed', 'Task Status Changed', 3, 'Notification when task status changes'),
('notification_type', 'task_due_soon', 'Task Due Soon', 4, 'Notification when a task is due soon'),
('notification_type', 'task_overdue', 'Task Overdue', 5, 'Notification when a task is overdue'),
('notification_type', 'task_mentioned', 'Task Mentioned', 6, 'Notification when user is mentioned in a task comment'),
('notification_type', 'lead_assigned', 'Lead Assigned', 10, 'Notification when a lead is assigned (future)'),
('notification_type', 'lead_status_changed', 'Lead Status Changed', 11, 'Notification when lead status changes (future)'),
('notification_type', 'quotation_approved', 'Quotation Approved', 20, 'Notification when a quotation is approved (future)'),
('notification_type', 'order_created', 'Order Created', 21, 'Notification when an order is created (future)'),
('notification_type', 'shipment_delivered', 'Shipment Delivered', 22, 'Notification when a shipment is delivered (future)'),
('notification_type', 'mention', 'Mention', 30, 'Generic mention notification'),
('notification_type', 'system', 'System', 40, 'System notification');

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE core.notifications IS 'Stores all notifications for users';
COMMENT ON TABLE core.notification_preferences IS 'User preferences for notification types';
COMMENT ON COLUMN core.notifications.read_at IS 'Timestamp when notification was read. NULL = unread';
COMMENT ON COLUMN core.notifications.entity_type IS 'Polymorphic: Type of entity this notification relates to';
COMMENT ON COLUMN core.notifications.entity_id IS 'Polymorphic: ID of entity this notification relates to';
COMMENT ON COLUMN core.notifications.metadata IS 'JSONB field for extra data like actor_id, action details, etc.';

