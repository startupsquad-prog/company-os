-- ============================================================================
-- Migration: Migrate from Supabase Auth to Clerk Auth
-- ============================================================================
-- This migration changes all user_id and created_by columns from UUID FK 
-- references to auth.users(id) to TEXT to store Clerk user IDs instead.
-- ============================================================================

-- ============================================================================
-- Step 1: Drop Foreign Key Constraints
-- ============================================================================

-- Drop FK constraints on user_id columns
ALTER TABLE core.profiles DROP CONSTRAINT IF EXISTS profiles_user_id_fkey;
ALTER TABLE core.user_role_bindings DROP CONSTRAINT IF EXISTS user_role_bindings_user_id_fkey;

-- Drop FK constraints on created_by columns (we'll keep them as UUID for now but remove FK)
-- Note: We'll change these to TEXT in a later step, but first we need to handle data migration

-- ============================================================================
-- Step 2: Change user_id columns from UUID to TEXT
-- ============================================================================

-- Change core.profiles.user_id from UUID to TEXT
ALTER TABLE core.profiles 
  ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;

-- Change core.user_role_bindings.user_id from UUID to TEXT
ALTER TABLE core.user_role_bindings 
  ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;

-- Change core.notifications.user_id from UUID to TEXT
ALTER TABLE core.notifications 
  ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;

-- Change core.notification_preferences.user_id from UUID to TEXT
ALTER TABLE core.notification_preferences 
  ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;

-- ============================================================================
-- Step 3: Change created_by columns from UUID FK to TEXT
-- ============================================================================

-- Note: We're changing created_by to TEXT but keeping the column name
-- This allows storing Clerk user IDs while maintaining audit trail

ALTER TABLE core.departments 
  ALTER COLUMN created_by TYPE TEXT USING created_by::TEXT;

ALTER TABLE core.profiles 
  ALTER COLUMN created_by TYPE TEXT USING created_by::TEXT;

ALTER TABLE core.teams 
  ALTER COLUMN created_by TYPE TEXT USING created_by::TEXT;

ALTER TABLE core.employees 
  ALTER COLUMN created_by TYPE TEXT USING created_by::TEXT;

ALTER TABLE core.roles 
  ALTER COLUMN created_by TYPE TEXT USING created_by::TEXT;

ALTER TABLE core.user_role_bindings 
  ALTER COLUMN created_by TYPE TEXT USING created_by::TEXT;

ALTER TABLE core.contacts 
  ALTER COLUMN created_by TYPE TEXT USING created_by::TEXT;

ALTER TABLE core.companies 
  ALTER COLUMN created_by TYPE TEXT USING created_by::TEXT;

ALTER TABLE core.company_contacts 
  ALTER COLUMN created_by TYPE TEXT USING created_by::TEXT;

ALTER TABLE core.activity_events 
  ALTER COLUMN created_by TYPE TEXT USING created_by::TEXT;

-- Check if notification_triggers table exists and update it
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'core' AND table_name = 'notification_triggers') THEN
    ALTER TABLE core.notification_triggers 
      ALTER COLUMN created_by TYPE TEXT USING created_by::TEXT;
  END IF;
END $$;

-- ============================================================================
-- Step 4: Create Function to Get Clerk User ID from Request Headers
-- ============================================================================
-- This function will extract the Clerk user ID from the request context.
-- In practice, this will be set by middleware or a Supabase Edge Function
-- that reads the Clerk JWT and sets a custom header or uses request.set().
--
-- For now, we'll create a function that can be called with the user ID
-- passed as a parameter, and later we can enhance it to read from headers.

CREATE OR REPLACE FUNCTION core.get_clerk_user_id()
RETURNS TEXT AS $$
DECLARE
  user_id TEXT;
BEGIN
  -- Try to get user ID from request headers (set by middleware/edge function)
  -- This requires the user ID to be passed via a custom header or session variable
  -- For now, we'll use a session variable that can be set by the application
  
  -- Option 1: Read from a session variable (set by application)
  user_id := current_setting('app.clerk_user_id', true);
  
  -- If not found, return NULL (will be handled by RLS policies)
  RETURN NULLIF(user_id, '');
EXCEPTION
  WHEN OTHERS THEN
    -- If setting doesn't exist or any error, return NULL
    RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION core.get_clerk_user_id() TO authenticated, anon;

-- ============================================================================
-- Step 5: Create Helper Function to Set Clerk User ID in Session
-- ============================================================================
-- This function can be called by the application to set the current user ID
-- in the session for RLS policies to use.

CREATE OR REPLACE FUNCTION core.set_clerk_user_id(p_user_id TEXT)
RETURNS VOID AS $$
BEGIN
  PERFORM set_config('app.clerk_user_id', p_user_id, false);
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION core.set_clerk_user_id(TEXT) TO authenticated, anon;

-- ============================================================================
-- Step 6: Update RLS Policies to Use get_clerk_user_id()
-- ============================================================================
-- We'll update all policies that use auth.uid() to use get_clerk_user_id() instead.
-- Note: This is a comprehensive update - all policies need to be recreated.

-- Drop existing policies that use auth.uid() or auth.role()
DROP POLICY IF EXISTS "Users can view own profile" ON core.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON core.profiles;
DROP POLICY IF EXISTS "Users can view own role bindings" ON core.user_role_bindings;
DROP POLICY IF EXISTS "Users can view their own notifications" ON core.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON core.notifications;
DROP POLICY IF EXISTS "Users can delete their own notifications" ON core.notifications;
DROP POLICY IF EXISTS "Users can view their own notification preferences" ON core.notification_preferences;
DROP POLICY IF EXISTS "Users can insert their own notification preferences" ON core.notification_preferences;
DROP POLICY IF EXISTS "Users can update their own notification preferences" ON core.notification_preferences;

-- Recreate policies using get_clerk_user_id()

-- Profiles: Users can view and update their own profile
CREATE POLICY "Users can view own profile"
  ON core.profiles FOR SELECT
  USING (core.get_clerk_user_id() = user_id);

CREATE POLICY "Users can update own profile"
  ON core.profiles FOR UPDATE
  USING (core.get_clerk_user_id() = user_id);

-- Keep the "Authenticated users can view profiles" policy but update it
-- Note: We'll need a way to check if Clerk user is authenticated
-- For now, we'll check if get_clerk_user_id() returns a non-null value
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON core.profiles;
CREATE POLICY "Authenticated users can view profiles"
  ON core.profiles FOR SELECT
  USING (core.get_clerk_user_id() IS NOT NULL);

-- User Role Bindings: Users can view their own bindings
CREATE POLICY "Users can view own role bindings"
  ON core.user_role_bindings FOR SELECT
  USING (core.get_clerk_user_id() = user_id);

-- Notifications: Users can only see their own notifications
CREATE POLICY "Users can view their own notifications"
  ON core.notifications FOR SELECT
  USING (core.get_clerk_user_id() = user_id AND deleted_at IS NULL);

CREATE POLICY "Users can update their own notifications"
  ON core.notifications FOR UPDATE
  USING (core.get_clerk_user_id() = user_id)
  WITH CHECK (core.get_clerk_user_id() = user_id);

CREATE POLICY "Users can delete their own notifications"
  ON core.notifications FOR DELETE
  USING (core.get_clerk_user_id() = user_id);

-- Notification Preferences: Users can manage their own preferences
CREATE POLICY "Users can view their own notification preferences"
  ON core.notification_preferences FOR SELECT
  USING (core.get_clerk_user_id() = user_id);

CREATE POLICY "Users can insert their own notification preferences"
  ON core.notification_preferences FOR INSERT
  WITH CHECK (core.get_clerk_user_id() = user_id);

CREATE POLICY "Users can update their own notification preferences"
  ON core.notification_preferences FOR UPDATE
  USING (core.get_clerk_user_id() = user_id)
  WITH CHECK (core.get_clerk_user_id() = user_id);

-- ============================================================================
-- Step 7: Update Other RLS Policies
-- ============================================================================
-- Update policies that check auth.role() = 'authenticated'
-- These should check if get_clerk_user_id() IS NOT NULL instead

-- Drop and recreate "Authenticated users can view" policies
DROP POLICY IF EXISTS "Authenticated users can view departments" ON core.departments;
DROP POLICY IF EXISTS "Authenticated users can view teams" ON core.teams;
DROP POLICY IF EXISTS "Authenticated users can view employees" ON core.employees;
DROP POLICY IF EXISTS "Authenticated users can view roles" ON core.roles;
DROP POLICY IF EXISTS "Authenticated users can view permissions" ON core.permissions;
DROP POLICY IF EXISTS "Authenticated users can view role_permissions" ON core.role_permissions;
DROP POLICY IF EXISTS "Authenticated users can view contacts" ON core.contacts;
DROP POLICY IF EXISTS "Authenticated users can view companies" ON core.companies;
DROP POLICY IF EXISTS "Authenticated users can view company_contacts" ON core.company_contacts;
DROP POLICY IF EXISTS "Authenticated users can view activity_events" ON core.activity_events;
DROP POLICY IF EXISTS "Authenticated users can view active enums" ON core.enum_registry;

-- Recreate with Clerk check
CREATE POLICY "Authenticated users can view departments"
  ON core.departments FOR SELECT
  USING (core.get_clerk_user_id() IS NOT NULL);

CREATE POLICY "Authenticated users can view teams"
  ON core.teams FOR SELECT
  USING (core.get_clerk_user_id() IS NOT NULL);

CREATE POLICY "Authenticated users can view employees"
  ON core.employees FOR SELECT
  USING (core.get_clerk_user_id() IS NOT NULL);

CREATE POLICY "Authenticated users can view roles"
  ON core.roles FOR SELECT
  USING (core.get_clerk_user_id() IS NOT NULL);

CREATE POLICY "Authenticated users can view permissions"
  ON core.permissions FOR SELECT
  USING (core.get_clerk_user_id() IS NOT NULL);

CREATE POLICY "Authenticated users can view role_permissions"
  ON core.role_permissions FOR SELECT
  USING (core.get_clerk_user_id() IS NOT NULL);

CREATE POLICY "Authenticated users can view contacts"
  ON core.contacts FOR SELECT
  USING (core.get_clerk_user_id() IS NOT NULL);

CREATE POLICY "Authenticated users can view companies"
  ON core.companies FOR SELECT
  USING (core.get_clerk_user_id() IS NOT NULL);

CREATE POLICY "Authenticated users can view company_contacts"
  ON core.company_contacts FOR SELECT
  USING (core.get_clerk_user_id() IS NOT NULL);

CREATE POLICY "Authenticated users can view activity_events"
  ON core.activity_events FOR SELECT
  USING (core.get_clerk_user_id() IS NOT NULL);

CREATE POLICY "Authenticated users can view active enums"
  ON core.enum_registry FOR SELECT
  USING (core.get_clerk_user_id() IS NOT NULL AND is_active = TRUE);

-- ============================================================================
-- Step 8: Update Task-related RLS Policies
-- ============================================================================
-- These policies are in common_util schema and also need updating

-- Check if tasks table exists and update its policies
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'common_util' AND table_name = 'tasks') THEN
    -- Drop existing task policies
    DROP POLICY IF EXISTS "Employees can read own and assigned tasks" ON common_util.tasks;
    DROP POLICY IF EXISTS "Managers can read department tasks" ON common_util.tasks;
    DROP POLICY IF EXISTS "Admins can read all tasks" ON common_util.tasks;
    DROP POLICY IF EXISTS "Employees can create tasks" ON common_util.tasks;
    DROP POLICY IF EXISTS "Employees can update own and assigned tasks" ON common_util.tasks;
    
    -- Recreate with Clerk user ID
    -- Note: These policies reference profiles, so we need to join through profiles
    CREATE POLICY "Employees can read own and assigned tasks"
      ON common_util.tasks FOR SELECT
      USING (
        core.get_clerk_user_id() IS NOT NULL AND (
          created_by IN (
            SELECT id FROM core.profiles WHERE user_id = core.get_clerk_user_id()
          )
          OR id IN (
            SELECT task_id FROM common_util.task_assignees 
            WHERE profile_id IN (
              SELECT id FROM core.profiles WHERE user_id = core.get_clerk_user_id()
            )
          )
        )
      );

    CREATE POLICY "Managers can read department tasks"
      ON common_util.tasks FOR SELECT
      USING (
        core.get_clerk_user_id() IS NOT NULL AND
        department_id IN (
          SELECT department_id FROM core.profiles 
          WHERE user_id = core.get_clerk_user_id()
        )
      );

    CREATE POLICY "Admins can read all tasks"
      ON common_util.tasks FOR SELECT
      USING (
        core.get_clerk_user_id() IS NOT NULL AND
        EXISTS (
          SELECT 1 FROM core.user_role_bindings urb
          JOIN core.roles r ON urb.role_id = r.id
          WHERE urb.user_id = core.get_clerk_user_id()
          AND r.name IN ('admin', 'superadmin')
        )
      );

    CREATE POLICY "Employees can create tasks"
      ON common_util.tasks FOR INSERT
      WITH CHECK (
        core.get_clerk_user_id() IS NOT NULL AND
        created_by IN (
          SELECT id FROM core.profiles WHERE user_id = core.get_clerk_user_id()
        )
      );

    CREATE POLICY "Employees can update own and assigned tasks"
      ON common_util.tasks FOR UPDATE
      USING (
        core.get_clerk_user_id() IS NOT NULL AND (
          created_by IN (
            SELECT id FROM core.profiles WHERE user_id = core.get_clerk_user_id()
          )
          OR id IN (
            SELECT task_id FROM common_util.task_assignees 
            WHERE profile_id IN (
              SELECT id FROM core.profiles WHERE user_id = core.get_clerk_user_id()
            )
          )
        )
      );
  END IF;
END $$;

-- ============================================================================
-- Step 9: Update RPC Functions to Accept TEXT user_id
-- ============================================================================
-- Update ensure_profile and other RPC functions to work with Clerk user IDs

-- Check if ensure_profile function exists and update it
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'core' AND p.proname = 'ensure_profile'
  ) THEN
    -- Drop and recreate with TEXT parameter
    DROP FUNCTION IF EXISTS core.ensure_profile(UUID, TEXT);
    
    CREATE OR REPLACE FUNCTION core.ensure_profile(
      p_user_id TEXT,
      p_email TEXT
    )
    RETURNS core.profiles AS $$
    DECLARE
      v_profile core.profiles;
      v_viewer_role_id UUID;
    BEGIN
      -- Check if profile exists
      SELECT * INTO v_profile
      FROM core.profiles
      WHERE user_id = p_user_id
      LIMIT 1;

      -- If profile doesn't exist, create it
      IF v_profile IS NULL THEN
        INSERT INTO core.profiles (user_id, email, first_name, last_name)
        VALUES (p_user_id, p_email, '', '')
        RETURNING * INTO v_profile;
      ELSE
        -- Update email if provided and different
        IF p_email IS NOT NULL AND v_profile.email IS DISTINCT FROM p_email THEN
          UPDATE core.profiles
          SET email = p_email, updated_at = NOW()
          WHERE id = v_profile.id
          RETURNING * INTO v_profile;
        END IF;
      END IF;

      -- Assign default "viewer" role if user has no roles
      IF NOT EXISTS (
        SELECT 1 FROM core.user_role_bindings WHERE user_id = p_user_id
      ) THEN
        SELECT id INTO v_viewer_role_id
        FROM core.roles
        WHERE name = 'viewer'
        LIMIT 1;

        IF v_viewer_role_id IS NOT NULL THEN
          INSERT INTO core.user_role_bindings (user_id, role_id)
          VALUES (p_user_id, v_viewer_role_id)
          ON CONFLICT (user_id, role_id) DO NOTHING;
        END IF;
      END IF;

      RETURN v_profile;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;

    GRANT EXECUTE ON FUNCTION core.ensure_profile(TEXT, TEXT) TO authenticated, anon;
  END IF;
END $$;

-- Update get_user_roles to accept TEXT
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'core' AND p.proname = 'get_user_roles'
  ) THEN
    DROP FUNCTION IF EXISTS core.get_user_roles(UUID);
    
    CREATE OR REPLACE FUNCTION core.get_user_roles(p_user_id TEXT)
    RETURNS JSON AS $$
    BEGIN
      RETURN (
        SELECT COALESCE(json_agg(
          json_build_object(
            'role_id', r.id,
            'role_name', r.name,
            'description', r.description
          )
        ), '[]'::json)
        FROM core.roles r
        INNER JOIN core.user_role_bindings urb ON r.id = urb.role_id
        WHERE urb.user_id = p_user_id
        AND r.deleted_at IS NULL
      );
    END;
    $$ LANGUAGE plpgsql STABLE;

    GRANT EXECUTE ON FUNCTION core.get_user_roles(TEXT) TO authenticated, anon;
  END IF;
END $$;

-- Update get_allowed_modules to accept TEXT
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'core' AND p.proname = 'get_allowed_modules'
  ) THEN
    DROP FUNCTION IF EXISTS core.get_allowed_modules(UUID);
    
    CREATE OR REPLACE FUNCTION core.get_allowed_modules(p_user_id TEXT)
    RETURNS JSON AS $$
    BEGIN
      RETURN (
        SELECT COALESCE(json_agg(DISTINCT m.name), '[]'::json)
        FROM core.modules m
        INNER JOIN core.roles r ON r.module_id = m.id
        INNER JOIN core.user_role_bindings urb ON r.id = urb.role_id
        WHERE urb.user_id = p_user_id
        AND r.deleted_at IS NULL
        UNION
        -- Also include modules based on role level (viewer/editor/manager/admin/superadmin)
        SELECT COALESCE(json_agg(DISTINCT m.name), '[]'::json)
        FROM core.modules m
        INNER JOIN core.roles r ON r.module_id = m.id OR r.module_id IS NULL
        INNER JOIN core.user_role_bindings urb ON r.id = urb.role_id
        WHERE urb.user_id = p_user_id
        AND r.name IN ('admin', 'superadmin')
        AND r.deleted_at IS NULL
      );
    END;
    $$ LANGUAGE plpgsql STABLE;

    GRANT EXECUTE ON FUNCTION core.get_allowed_modules(TEXT) TO authenticated, anon;
  END IF;
END $$;

-- Update get_user_permissions to accept TEXT
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'core' AND p.proname = 'get_user_permissions'
  ) THEN
    DROP FUNCTION IF EXISTS core.get_user_permissions(UUID, TEXT);
    
    CREATE OR REPLACE FUNCTION core.get_user_permissions(
      p_user_id TEXT,
      p_module_name TEXT DEFAULT NULL
    )
    RETURNS JSON AS $$
    BEGIN
      RETURN (
        SELECT COALESCE(json_agg(DISTINCT p.name), '[]'::json)
        FROM core.permissions p
        INNER JOIN core.role_permissions rp ON p.id = rp.permission_id
        INNER JOIN core.roles r ON rp.role_id = r.id
        INNER JOIN core.user_role_bindings urb ON r.id = urb.role_id
        WHERE urb.user_id = p_user_id
        AND (p_module_name IS NULL OR p.module_id IN (
          SELECT id FROM core.modules WHERE name = p_module_name
        ))
        AND r.deleted_at IS NULL
      );
    END;
    $$ LANGUAGE plpgsql STABLE;

    GRANT EXECUTE ON FUNCTION core.get_user_permissions(TEXT, TEXT) TO authenticated, anon;
  END IF;
END $$;

-- Update notification RPC functions
DO $$
BEGIN
  -- Update get_unread_notification_count
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'core' AND p.proname = 'get_unread_notification_count'
  ) THEN
    DROP FUNCTION IF EXISTS core.get_unread_notification_count(UUID);
    
    CREATE OR REPLACE FUNCTION core.get_unread_notification_count(p_user_id TEXT)
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
    $$ LANGUAGE plpgsql STABLE;

    GRANT EXECUTE ON FUNCTION core.get_unread_notification_count(TEXT) TO authenticated, anon;
  END IF;

  -- Update mark_all_notifications_read
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'core' AND p.proname = 'mark_all_notifications_read'
  ) THEN
    DROP FUNCTION IF EXISTS core.mark_all_notifications_read(UUID);
    
    CREATE OR REPLACE FUNCTION core.mark_all_notifications_read(p_user_id TEXT)
    RETURNS INTEGER AS $$
    DECLARE
      v_count INTEGER;
    BEGIN
      UPDATE core.notifications
      SET read_at = NOW()
      WHERE user_id = p_user_id
      AND read_at IS NULL
      AND deleted_at IS NULL;

      GET DIAGNOSTICS v_count = ROW_COUNT;
      RETURN v_count;
    END;
    $$ LANGUAGE plpgsql;

    GRANT EXECUTE ON FUNCTION core.mark_all_notifications_read(TEXT) TO authenticated, anon;
  END IF;
END $$;

-- ============================================================================
-- Migration Complete
-- ============================================================================
-- All user_id and created_by columns have been changed from UUID FK to TEXT.
-- RLS policies have been updated to use get_clerk_user_id().
-- RPC functions have been updated to accept TEXT user IDs.
--
-- IMPORTANT: The application must call core.set_clerk_user_id() before
-- executing any queries that need RLS to work correctly. This should be
-- done in middleware or a Supabase Edge Function that reads the Clerk JWT.
-- ============================================================================

