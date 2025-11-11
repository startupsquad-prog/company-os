-- ============================================================================
-- Schedule Notification Reminders with pg_cron
-- Company OS: Set up cron jobs to call task-reminders Edge Function
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create a function that can be called manually or via pg_cron
-- This function calls the task-reminders Edge Function
CREATE OR REPLACE FUNCTION public.call_task_reminders_edf(reminder_type TEXT DEFAULT 'due_soon')
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    project_url TEXT;
    service_role_key TEXT;
    response_id BIGINT;
BEGIN
    -- Get values from environment variables (set via Supabase dashboard secrets)
    -- These should be set as: ALTER DATABASE postgres SET app.settings.supabase_url = 'https://...';
    project_url := current_setting('app.settings.supabase_url', true);
    service_role_key := current_setting('app.settings.supabase_service_role_key', true);
    
    -- Fallback to hardcoded values if not set (update these with your actual values!)
    IF project_url IS NULL OR project_url = '' THEN
        project_url := 'https://ljbjtsfaeobajawamnft.supabase.co';
    END IF;
    
    IF service_role_key IS NULL OR service_role_key = '' THEN
        RAISE EXCEPTION 'Service role key not configured. Please set app.settings.supabase_service_role_key via Supabase dashboard';
    END IF;
    
    -- Call the Edge Function via HTTP
    SELECT net.http_post(
        url := project_url || '/functions/v1/task-reminders?type=' || reminder_type,
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || service_role_key
        ),
        body := '{}'::jsonb
    ) INTO response_id;
    
    RAISE NOTICE 'Called task-reminders Edge Function for type: %, response_id: %', reminder_type, response_id;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.call_task_reminders_edf(TEXT) TO authenticated;

-- Schedule cron jobs (if pg_cron is available)
-- Note: These may need to be set up manually via Supabase dashboard or SQL editor
DO $$
BEGIN
    -- Schedule task due soon reminders (every hour)
    PERFORM cron.schedule(
        'task-due-soon-reminders',
        '0 * * * *', -- Every hour at minute 0
        'SELECT public.call_task_reminders_edf(''due_soon'');'
    );
    
    -- Schedule overdue task reminders (daily at 9 AM)
    PERFORM cron.schedule(
        'task-overdue-reminders',
        '0 9 * * *', -- Daily at 9 AM
        'SELECT public.call_task_reminders_edf(''overdue'');'
    );
    
    RAISE NOTICE 'Scheduled notification reminder cron jobs successfully';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Could not schedule cron jobs automatically: %', SQLERRM;
        RAISE NOTICE 'You can schedule them manually by running:';
        RAISE NOTICE 'SELECT cron.schedule(''task-due-soon-reminders'', ''0 * * * *'', ''SELECT public.call_task_reminders_edf(''''due_soon'''');'');';
        RAISE NOTICE 'SELECT cron.schedule(''task-overdue-reminders'', ''0 9 * * *'', ''SELECT public.call_task_reminders_edf(''''overdue'''');'');';
END $$;

-- Comments
COMMENT ON FUNCTION public.call_task_reminders_edf IS 'Calls the task-reminders Edge Function. Can be scheduled via pg_cron or called manually.';
COMMENT ON EXTENSION pg_cron IS 'Extension for scheduling cron jobs in PostgreSQL';
COMMENT ON EXTENSION pg_net IS 'Extension for making HTTP requests from PostgreSQL';







