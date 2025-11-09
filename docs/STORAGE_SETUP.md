# Storage Bucket Setup Guide

## Task Attachments Bucket

This guide explains how to set up the `task-attachments` storage bucket in Supabase.

### Option 1: Via Supabase Dashboard (Recommended)

1. **Navigate to Storage**
   - Go to your Supabase Dashboard
   - Click on "Storage" in the left sidebar
   - Click "New bucket"

2. **Create the Bucket**
   - **Name**: `task-attachments`
   - **Public bucket**: Unchecked (Private)
   - **File size limit**: `52428800` (50 MB)
   - **Allowed MIME types**: 
     - `image/*`
     - `application/pdf`
     - `application/msword`
     - `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
     - `application/vnd.ms-excel`
     - `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
     - `text/plain`
     - `text/csv`
     - `application/zip`
     - `application/x-zip-compressed`

3. **Set Up RLS Policies**
   - Go to "Storage" → "Policies" → Select `task-attachments` bucket
   - Create the following policies:

#### SELECT Policy (Read/Download)
```sql
CREATE POLICY "Users can read task attachments"
ON storage.objects FOR SELECT
USING (
    bucket_id = 'task-attachments' AND
    auth.role() = 'authenticated' AND
    (storage.foldername(name))[1] IN (
        SELECT id::text FROM common_util.tasks
        WHERE deleted_at IS NULL AND (
            created_by = (SELECT id FROM core.profiles WHERE user_id = auth.uid())
            OR id IN (
                SELECT task_id FROM common_util.task_assignees
                WHERE profile_id = (SELECT id FROM core.profiles WHERE user_id = auth.uid())
            )
            OR department_id IN (
                SELECT department_id FROM core.profiles
                WHERE user_id = auth.uid()
            )
            OR EXISTS (
                SELECT 1 FROM core.user_role_bindings urb
                JOIN core.roles r ON urb.role_id = r.id
                WHERE urb.user_id = auth.uid()
                AND r.name IN ('admin', 'superadmin')
            )
        )
    )
);
```

#### INSERT Policy (Upload)
```sql
CREATE POLICY "Users can upload task attachments"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'task-attachments' AND
    auth.role() = 'authenticated' AND
    (storage.foldername(name))[1] IN (
        SELECT id::text FROM common_util.tasks
        WHERE deleted_at IS NULL AND (
            created_by = (SELECT id FROM core.profiles WHERE user_id = auth.uid())
            OR id IN (
                SELECT task_id FROM common_util.task_assignees
                WHERE profile_id = (SELECT id FROM core.profiles WHERE user_id = auth.uid())
                AND role IN ('owner', 'collaborator')
            )
            OR department_id IN (
                SELECT department_id FROM core.profiles
                WHERE user_id = auth.uid()
            )
            OR EXISTS (
                SELECT 1 FROM core.user_role_bindings urb
                JOIN core.roles r ON urb.role_id = r.id
                WHERE urb.user_id = auth.uid()
                AND r.name IN ('admin', 'superadmin')
            )
        )
    )
);
```

#### UPDATE Policy
```sql
CREATE POLICY "Users can update task attachments"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'task-attachments' AND
    auth.role() = 'authenticated' AND
    (storage.foldername(name))[1] IN (
        SELECT id::text FROM common_util.tasks
        WHERE deleted_at IS NULL AND (
            created_by = (SELECT id FROM core.profiles WHERE user_id = auth.uid())
            OR id IN (
                SELECT task_id FROM common_util.task_assignees
                WHERE profile_id = (SELECT id FROM core.profiles WHERE user_id = auth.uid())
                AND role IN ('owner', 'collaborator')
            )
            OR department_id IN (
                SELECT department_id FROM core.profiles
                WHERE user_id = auth.uid()
            )
            OR EXISTS (
                SELECT 1 FROM core.user_role_bindings urb
                JOIN core.roles r ON urb.role_id = r.id
                WHERE urb.user_id = auth.uid()
                AND r.name IN ('admin', 'superadmin')
            )
        )
    )
);
```

#### DELETE Policy
```sql
CREATE POLICY "Users can delete task attachments"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'task-attachments' AND
    auth.role() = 'authenticated' AND
    (storage.foldername(name))[1] IN (
        SELECT id::text FROM common_util.tasks
        WHERE deleted_at IS NULL AND (
            created_by = (SELECT id FROM core.profiles WHERE user_id = auth.uid())
            OR id IN (
                SELECT task_id FROM common_util.task_assignees
                WHERE profile_id = (SELECT id FROM core.profiles WHERE user_id = auth.uid())
                AND role IN ('owner', 'collaborator')
            )
            OR department_id IN (
                SELECT department_id FROM core.profiles
                WHERE user_id = auth.uid()
            )
            OR EXISTS (
                SELECT 1 FROM core.user_role_bindings urb
                JOIN core.roles r ON urb.role_id = r.id
                WHERE urb.user_id = auth.uid()
                AND r.name IN ('admin', 'superadmin')
            )
        )
    )
);
```

### Option 2: Via SQL Migration

If you have the necessary permissions, you can run the migration file:
```bash
supabase migration up
```

Or apply it directly via the Supabase SQL Editor:
1. Go to SQL Editor in Supabase Dashboard
2. Copy the contents of `supabase/migrations/20250109000001_create_task_attachments_bucket.sql`
3. Run the SQL

### File Path Structure

Files are stored with the following structure:
```
task-attachments/{task_id}/{timestamp}.{ext}
```

Example:
```
task-attachments/123e4567-e89b-12d3-a456-426614174000/1704067200000.pdf
```

### Verification

After setting up the bucket, verify it works by:
1. Opening a task in the application
2. Trying to upload a file attachment
3. Verifying the file appears in the task attachments list
4. Testing download functionality

### Troubleshooting

**Error: "Bucket not found"**
- Ensure the bucket name is exactly `task-attachments`
- Check that the bucket was created successfully in the Storage dashboard

**Error: "Permission denied"**
- Verify RLS policies are set up correctly
- Check that the user has the appropriate role/permissions
- Ensure the task access rules match the storage policies

**Error: "File size limit exceeded"**
- The bucket has a 50MB file size limit
- For larger files, increase the limit in bucket settings or split files


