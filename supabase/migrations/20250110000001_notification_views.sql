-- ============================================================================
-- Notification Views and Public Functions
-- Company OS: Expose core.notifications and core.notification_preferences
--             to public schema for Supabase SSR client access
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Create Views in Public Schema
-- ----------------------------------------------------------------------------

-- View for notifications
CREATE OR REPLACE VIEW public.notifications AS
SELECT 
    id,
    user_id,
    type,
    title,
    message,
    entity_type,
    entity_id,
    read_at,
    action_url,
    metadata,
    created_at,
    deleted_at
FROM core.notifications;

-- View for notification_preferences
CREATE OR REPLACE VIEW public.notification_preferences AS
SELECT 
    id,
    user_id,
    notification_type,
    enabled,
    email_enabled,
    whatsapp_enabled,
    created_at,
    updated_at
FROM core.notification_preferences;

-- ----------------------------------------------------------------------------
-- 2. Create INSTEAD OF Triggers for Writable Views
-- ----------------------------------------------------------------------------

-- Function to handle INSERT on public.notifications
CREATE OR REPLACE FUNCTION public.handle_notifications_insert()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO core.notifications (
        id, user_id, type, title, message, entity_type, entity_id,
        read_at, action_url, metadata, created_at, deleted_at
    ) VALUES (
        COALESCE(NEW.id, gen_random_uuid()),
        NEW.user_id,
        NEW.type,
        NEW.title,
        NEW.message,
        NEW.entity_type,
        NEW.entity_id,
        NEW.read_at,
        NEW.action_url,
        NEW.metadata,
        COALESCE(NEW.created_at, NOW()),
        NEW.deleted_at
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_notifications_insert
    INSTEAD OF INSERT ON public.notifications
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_notifications_insert();

-- Function to handle UPDATE on public.notifications
CREATE OR REPLACE FUNCTION public.handle_notifications_update()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE core.notifications SET
        user_id = NEW.user_id,
        type = NEW.type,
        title = NEW.title,
        message = NEW.message,
        entity_type = NEW.entity_type,
        entity_id = NEW.entity_id,
        read_at = NEW.read_at,
        action_url = NEW.action_url,
        metadata = NEW.metadata,
        created_at = NEW.created_at,
        deleted_at = NEW.deleted_at
    WHERE id = OLD.id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_notifications_update
    INSTEAD OF UPDATE ON public.notifications
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_notifications_update();

-- Function to handle DELETE on public.notifications
CREATE OR REPLACE FUNCTION public.handle_notifications_delete()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE core.notifications
    SET deleted_at = NOW()
    WHERE id = OLD.id;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_notifications_delete
    INSTEAD OF DELETE ON public.notifications
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_notifications_delete();

-- Function to handle INSERT on public.notification_preferences
CREATE OR REPLACE FUNCTION public.handle_notification_preferences_insert()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO core.notification_preferences (
        id, user_id, notification_type, enabled, email_enabled,
        whatsapp_enabled, created_at, updated_at
    ) VALUES (
        COALESCE(NEW.id, gen_random_uuid()),
        NEW.user_id,
        NEW.notification_type,
        COALESCE(NEW.enabled, TRUE),
        COALESCE(NEW.email_enabled, FALSE),
        COALESCE(NEW.whatsapp_enabled, FALSE),
        COALESCE(NEW.created_at, NOW()),
        COALESCE(NEW.updated_at, NOW())
    )
    ON CONFLICT (user_id, notification_type) 
    DO UPDATE SET
        enabled = EXCLUDED.enabled,
        email_enabled = EXCLUDED.email_enabled,
        whatsapp_enabled = EXCLUDED.whatsapp_enabled,
        updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_notification_preferences_insert
    INSTEAD OF INSERT ON public.notification_preferences
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_notification_preferences_insert();

-- Function to handle UPDATE on public.notification_preferences
CREATE OR REPLACE FUNCTION public.handle_notification_preferences_update()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE core.notification_preferences SET
        user_id = NEW.user_id,
        notification_type = NEW.notification_type,
        enabled = NEW.enabled,
        email_enabled = NEW.email_enabled,
        whatsapp_enabled = NEW.whatsapp_enabled,
        created_at = NEW.created_at,
        updated_at = NOW()
    WHERE id = OLD.id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_notification_preferences_update
    INSTEAD OF UPDATE ON public.notification_preferences
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_notification_preferences_update();

-- Function to handle DELETE on public.notification_preferences
CREATE OR REPLACE FUNCTION public.handle_notification_preferences_delete()
RETURNS TRIGGER AS $$
BEGIN
    DELETE FROM core.notification_preferences WHERE id = OLD.id;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_notification_preferences_delete
    INSTEAD OF DELETE ON public.notification_preferences
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_notification_preferences_delete();

-- ----------------------------------------------------------------------------
-- 3. Create Public Wrapper Functions for RPC Calls
-- ----------------------------------------------------------------------------

-- Wrapper for get_unread_notification_count
CREATE OR REPLACE FUNCTION public.get_unread_notification_count(user_id_param UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN core.get_unread_notification_count(user_id_param);
END;
$$;

-- Wrapper for mark_all_notifications_read
CREATE OR REPLACE FUNCTION public.mark_all_notifications_read(user_id_param UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN core.mark_all_notifications_read(user_id_param);
END;
$$;

-- ----------------------------------------------------------------------------
-- 4. Grant Permissions
-- ----------------------------------------------------------------------------

-- Grant SELECT on views to authenticated users
GRANT SELECT ON public.notifications TO authenticated;
GRANT SELECT ON public.notification_preferences TO authenticated;

-- Grant INSERT, UPDATE, DELETE on views to authenticated users (handled by triggers)
GRANT INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.notification_preferences TO authenticated;

-- Grant EXECUTE on RPC functions
GRANT EXECUTE ON FUNCTION public.get_unread_notification_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_all_notifications_read(UUID) TO authenticated;


