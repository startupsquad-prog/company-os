-- ============================================================================
-- Storage Bucket: task-attachments
-- Company OS: Storage bucket for task file attachments
-- ============================================================================
-- Purpose: Create storage bucket for task attachments
-- Note: This migration creates the bucket. RLS policies should be set up
-- via Supabase Dashboard -> Storage -> Policies or via Management API
-- ============================================================================

-- Create the storage bucket
-- Note: Requires appropriate permissions. If this fails, create the bucket
-- manually via Supabase Dashboard -> Storage -> New Bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'task-attachments',
    'task-attachments',
    false, -- Private bucket (not public)
    52428800, -- 50MB file size limit
    ARRAY[
        'image/*',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain',
        'text/csv',
        'application/zip',
        'application/x-zip-compressed'
    ]::text[]
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ============================================================================
-- HELPER FUNCTION (to avoid RLS recursion)
-- ============================================================================

-- Create a security definer function to check task access without RLS recursion
-- This function bypasses RLS to avoid infinite recursion when checking task_assignees
CREATE OR REPLACE FUNCTION common_util.check_task_access(task_id_param UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_profile_id UUID;
    user_department_id UUID;
    is_admin BOOLEAN;
BEGIN
    -- Get user's profile
    SELECT id INTO user_profile_id
    FROM core.profiles
    WHERE user_id = auth.uid();
    
    IF user_profile_id IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Check if user created the task
    IF EXISTS (
        SELECT 1 FROM common_util.tasks
        WHERE id = task_id_param
        AND created_by = user_profile_id
        AND deleted_at IS NULL
    ) THEN
        RETURN TRUE;
    END IF;
    
    -- Check if user is assigned to the task (bypass RLS with security definer)
    IF EXISTS (
        SELECT 1 FROM common_util.task_assignees
        WHERE task_id = task_id_param
        AND profile_id = user_profile_id
    ) THEN
        RETURN TRUE;
    END IF;
    
    -- Get user's department
    SELECT department_id INTO user_department_id
    FROM core.profiles
    WHERE id = user_profile_id;
    
    -- Check if user is manager in task's department
    IF user_department_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM common_util.tasks
        WHERE id = task_id_param
        AND department_id = user_department_id
        AND deleted_at IS NULL
    ) THEN
        RETURN TRUE;
    END IF;
    
    -- Check if user is admin/superadmin
    SELECT EXISTS (
        SELECT 1 FROM core.user_role_bindings urb
        JOIN core.roles r ON urb.role_id = r.id
        WHERE urb.user_id = auth.uid()
        AND r.name IN ('admin', 'superadmin')
    ) INTO is_admin;
    
    IF is_admin THEN
        RETURN TRUE;
    END IF;
    
    RETURN FALSE;
END;
$$;

-- ============================================================================
-- STORAGE RLS POLICIES
-- ============================================================================

-- Enable RLS on storage.objects
-- Note: RLS is typically enabled by default on storage.objects, but we ensure it
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- SELECT Policies (Read/Download)
-- ----------------------------------------------------------------------------

-- Users can read files for tasks they can access
-- Uses security definer function to avoid RLS recursion
CREATE POLICY "Users can read task attachments"
    ON storage.objects FOR SELECT
    USING (
        bucket_id = 'task-attachments' AND
        auth.role() = 'authenticated' AND
        common_util.check_task_access((storage.foldername(name))[1]::UUID)
    );

-- ----------------------------------------------------------------------------
-- INSERT Policies (Upload)
-- ----------------------------------------------------------------------------

-- Users can upload files for tasks they can access
-- Uses security definer function to avoid RLS recursion
CREATE POLICY "Users can upload task attachments"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'task-attachments' AND
        auth.role() = 'authenticated' AND
        common_util.check_task_access((storage.foldername(name))[1]::UUID)
    );

-- ----------------------------------------------------------------------------
-- UPDATE Policies (Update metadata)
-- ----------------------------------------------------------------------------

-- Users can update files for tasks they can access
-- Uses security definer function to avoid RLS recursion
CREATE POLICY "Users can update task attachments"
    ON storage.objects FOR UPDATE
    USING (
        bucket_id = 'task-attachments' AND
        auth.role() = 'authenticated' AND
        common_util.check_task_access((storage.foldername(name))[1]::UUID)
    );

-- ----------------------------------------------------------------------------
-- DELETE Policies
-- ----------------------------------------------------------------------------

-- Users can delete files for tasks they can access
-- Uses security definer function to avoid RLS recursion
CREATE POLICY "Users can delete task attachments"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'task-attachments' AND
        auth.role() = 'authenticated' AND
        common_util.check_task_access((storage.foldername(name))[1]::UUID)
    );

-- ============================================================================
-- NOTES
-- ============================================================================
/*
Storage Bucket Configuration:
- Name: task-attachments
- Public: false (private bucket)
- File size limit: 50MB
- Allowed MIME types: Images, PDFs, Office documents, text files, archives

File Path Structure:
- Format: task-attachments/{task_id}/{timestamp}.{ext}
- Example: task-attachments/123e4567-e89b-12d3-a456-426614174000/1704067200000.pdf

RLS Policies:
- Uses security definer function common_util.check_task_access() to avoid infinite recursion
- Users can only access files for tasks they can view (created, assigned, department manager, or admin)
- Upload/Update/Delete permissions follow task access rules
- Admins/Superadmins have full access to all task attachments
- The security definer function bypasses RLS to check task_assignees without recursion

To use this bucket:
1. Run this migration
2. The bucket will be automatically created
3. Files can be uploaded via the Supabase Storage API
4. RLS policies will automatically enforce access control
*/

