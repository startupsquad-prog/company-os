-- Phase 1: Task Management Seed Data (Final)
-- IMPORTANT: This seed requires at least ONE auth user to exist in auth.users
-- To create an auth user:
--   1. Sign up through your app's auth flow, OR
--   2. Use Supabase Dashboard > Authentication > Users > Add User
-- 
-- Once you have at least one auth user, run this migration again or execute it manually

DO $$
DECLARE
  profile_1 UUID;
  profile_2 UUID;
  profile_3 UUID;
  profile_4 UUID;
  profile_5 UUID;
  dept_sales UUID;
  dept_hr UUID;
  dept_ops UUID;
  dept_tech UUID;
  user_1 UUID;
  user_2 UUID;
  user_3 UUID;
  user_4 UUID;
  user_5 UUID;
  task_1 UUID;
  task_2 UUID;
  task_3 UUID;
  task_4 UUID;
  task_5 UUID;
  task_6 UUID;
  task_7 UUID;
  task_8 UUID;
  task_9 UUID;
  task_10 UUID;
  task_11 UUID;
  task_12 UUID;
  task_13 UUID;
  task_14 UUID;
  task_15 UUID;
  task_16 UUID;
  task_17 UUID;
  task_18 UUID;
  task_19 UUID;
  task_20 UUID;
  existing_profile_count INTEGER;
  auth_user_count INTEGER;
BEGIN
  -- Check if auth users exist
  SELECT COUNT(*) INTO auth_user_count FROM auth.users;
  
  IF auth_user_count = 0 THEN
    RAISE EXCEPTION 'No auth users found. Please create at least one user first:
    1. Sign up through your app (visit /auth/login or signup page), OR
    2. Use Supabase Dashboard > Authentication > Users > Add User manually
    
    Once you have at least one user, this seed will create profiles and tasks automatically.';
  END IF;
  
  -- Get existing profiles count
  SELECT COUNT(*) INTO existing_profile_count FROM core.profiles WHERE deleted_at IS NULL;
  
  -- Get department IDs
  SELECT id INTO dept_sales FROM core.departments WHERE name = 'Sales' AND deleted_at IS NULL LIMIT 1;
  SELECT id INTO dept_hr FROM core.departments WHERE name = 'HR' AND deleted_at IS NULL LIMIT 1;
  SELECT id INTO dept_ops FROM core.departments WHERE name = 'Operations' AND deleted_at IS NULL LIMIT 1;
  SELECT id INTO dept_tech FROM core.departments WHERE name = 'Tech' AND deleted_at IS NULL LIMIT 1;
  
  -- Fallback to first available department
  IF dept_sales IS NULL THEN SELECT id INTO dept_sales FROM core.departments WHERE deleted_at IS NULL LIMIT 1; END IF;
  IF dept_hr IS NULL THEN dept_hr := dept_sales; END IF;
  IF dept_ops IS NULL THEN dept_ops := dept_sales; END IF;
  IF dept_tech IS NULL THEN dept_tech := dept_sales; END IF;

  -- Get auth user IDs
  SELECT id INTO user_1 FROM auth.users ORDER BY created_at LIMIT 1 OFFSET 0;
  SELECT id INTO user_2 FROM auth.users ORDER BY created_at LIMIT 1 OFFSET 1;
  SELECT id INTO user_3 FROM auth.users ORDER BY created_at LIMIT 1 OFFSET 2;
  SELECT id INTO user_4 FROM auth.users ORDER BY created_at LIMIT 1 OFFSET 3;
  SELECT id INTO user_5 FROM auth.users ORDER BY created_at LIMIT 1 OFFSET 4;
  
  -- Reuse first user if not enough exist
  IF user_2 IS NULL THEN user_2 := user_1; END IF;
  IF user_3 IS NULL THEN user_3 := user_1; END IF;
  IF user_4 IS NULL THEN user_4 := user_1; END IF;
  IF user_5 IS NULL THEN user_5 := user_1; END IF;

  -- Create profiles if they don't exist
  IF existing_profile_count = 0 THEN
    INSERT INTO core.profiles (user_id, first_name, last_name, email, department_id, created_at, updated_at)
    SELECT 
      user_1,
      'John', 
      'Doe', 
      COALESCE((SELECT email FROM auth.users WHERE id = user_1), 'john.doe@company.com'),
      dept_sales,
      NOW(),
      NOW()
    WHERE NOT EXISTS (SELECT 1 FROM core.profiles WHERE user_id = user_1)
    ON CONFLICT (user_id) DO NOTHING;
    
    INSERT INTO core.profiles (user_id, first_name, last_name, email, department_id, created_at, updated_at)
    SELECT 
      user_2,
      'Jane', 
      'Smith', 
      COALESCE((SELECT email FROM auth.users WHERE id = user_2), 'jane.smith@company.com'),
      dept_hr,
      NOW(),
      NOW()
    WHERE NOT EXISTS (SELECT 1 FROM core.profiles WHERE user_id = user_2)
    ON CONFLICT (user_id) DO NOTHING;
    
    INSERT INTO core.profiles (user_id, first_name, last_name, email, department_id, created_at, updated_at)
    SELECT 
      user_3,
      'Bob', 
      'Johnson', 
      COALESCE((SELECT email FROM auth.users WHERE id = user_3), 'bob.johnson@company.com'),
      dept_tech,
      NOW(),
      NOW()
    WHERE NOT EXISTS (SELECT 1 FROM core.profiles WHERE user_id = user_3)
    ON CONFLICT (user_id) DO NOTHING;
    
    INSERT INTO core.profiles (user_id, first_name, last_name, email, department_id, created_at, updated_at)
    SELECT 
      user_4,
      'Alice', 
      'Williams', 
      COALESCE((SELECT email FROM auth.users WHERE id = user_4), 'alice.williams@company.com'),
      dept_ops,
      NOW(),
      NOW()
    WHERE NOT EXISTS (SELECT 1 FROM core.profiles WHERE user_id = user_4)
    ON CONFLICT (user_id) DO NOTHING;
    
    INSERT INTO core.profiles (user_id, first_name, last_name, email, department_id, created_at, updated_at)
    SELECT 
      user_5,
      'Charlie', 
      'Brown', 
      COALESCE((SELECT email FROM auth.users WHERE id = user_5), 'charlie.brown@company.com'),
      dept_sales,
      NOW(),
      NOW()
    WHERE NOT EXISTS (SELECT 1 FROM core.profiles WHERE user_id = user_5)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
  
  -- Get profile IDs
  SELECT id INTO profile_1 FROM core.profiles WHERE deleted_at IS NULL ORDER BY created_at LIMIT 1 OFFSET 0;
  SELECT id INTO profile_2 FROM core.profiles WHERE deleted_at IS NULL ORDER BY created_at LIMIT 1 OFFSET 1;
  SELECT id INTO profile_3 FROM core.profiles WHERE deleted_at IS NULL ORDER BY created_at LIMIT 1 OFFSET 2;
  SELECT id INTO profile_4 FROM core.profiles WHERE deleted_at IS NULL ORDER BY created_at LIMIT 1 OFFSET 3;
  SELECT id INTO profile_5 FROM core.profiles WHERE deleted_at IS NULL ORDER BY created_at LIMIT 1 OFFSET 4;
  
  -- Fallback: reuse first profile if not enough exist
  IF profile_1 IS NULL THEN 
    RAISE EXCEPTION 'Failed to create profiles. Please check your database constraints.';
  END IF;
  IF profile_2 IS NULL THEN profile_2 := profile_1; END IF;
  IF profile_3 IS NULL THEN profile_3 := profile_1; END IF;
  IF profile_4 IS NULL THEN profile_4 := profile_1; END IF;
  IF profile_5 IS NULL THEN profile_5 := profile_1; END IF;

  -- Create 20 tasks with varied data (skip if already exist)
  -- Pending tasks (5)
  INSERT INTO common_util.tasks (title, description, priority, status, department_id, vertical_key, due_date, created_by, updated_by, created_at, updated_at)
  SELECT 
    'Review Q4 Sales Report', 'Analyze sales performance for Q4 and prepare summary', 'high', 'pending', dept_sales, 'crm', NOW() + INTERVAL '7 days', profile_1, profile_1, NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'
  WHERE NOT EXISTS (SELECT 1 FROM common_util.tasks WHERE title = 'Review Q4 Sales Report' AND deleted_at IS NULL);
  
  INSERT INTO common_util.tasks (title, description, priority, status, department_id, vertical_key, due_date, created_by, updated_by, created_at, updated_at)
  SELECT 
    'Update Employee Handbook', 'Revise company policies and update employee handbook', 'medium', 'pending', dept_hr, NULL, NOW() + INTERVAL '14 days', profile_2, profile_2, NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'
  WHERE NOT EXISTS (SELECT 1 FROM common_util.tasks WHERE title = 'Update Employee Handbook' AND deleted_at IS NULL);
  
  INSERT INTO common_util.tasks (title, description, priority, status, department_id, vertical_key, due_date, created_by, updated_by, created_at, updated_at)
  SELECT 
    'Setup New Server Infrastructure', 'Configure new cloud servers for production environment', 'urgent', 'pending', dept_tech, NULL, NOW() + INTERVAL '3 days', profile_3, profile_3, NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'
  WHERE NOT EXISTS (SELECT 1 FROM common_util.tasks WHERE title = 'Setup New Server Infrastructure' AND deleted_at IS NULL);
  
  INSERT INTO common_util.tasks (title, description, priority, status, department_id, vertical_key, due_date, created_by, updated_by, created_at, updated_at)
  SELECT 
    'Import Documentation Review', 'Review import procedures and update documentation', 'low', 'pending', dept_ops, 'import', NOW() + INTERVAL '21 days', profile_4, profile_4, NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'
  WHERE NOT EXISTS (SELECT 1 FROM common_util.tasks WHERE title = 'Import Documentation Review' AND deleted_at IS NULL);
  
  INSERT INTO common_util.tasks (title, description, priority, status, department_id, vertical_key, due_date, created_by, updated_by, created_at, updated_at)
  SELECT 
    'Client Onboarding Process', 'Design new client onboarding workflow', 'medium', 'pending', dept_sales, 'crm', NOW() + INTERVAL '10 days', profile_5, profile_5, NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'
  WHERE NOT EXISTS (SELECT 1 FROM common_util.tasks WHERE title = 'Client Onboarding Process' AND deleted_at IS NULL);
  
  -- Get task IDs
  SELECT id INTO task_1 FROM common_util.tasks WHERE title = 'Review Q4 Sales Report' AND deleted_at IS NULL LIMIT 1;
  SELECT id INTO task_2 FROM common_util.tasks WHERE title = 'Update Employee Handbook' AND deleted_at IS NULL LIMIT 1;
  SELECT id INTO task_3 FROM common_util.tasks WHERE title = 'Setup New Server Infrastructure' AND deleted_at IS NULL LIMIT 1;
  SELECT id INTO task_4 FROM common_util.tasks WHERE title = 'Import Documentation Review' AND deleted_at IS NULL LIMIT 1;
  SELECT id INTO task_5 FROM common_util.tasks WHERE title = 'Client Onboarding Process' AND deleted_at IS NULL LIMIT 1;

  -- In Progress tasks (6)
  INSERT INTO common_util.tasks (title, description, priority, status, department_id, vertical_key, due_date, created_by, updated_by, created_at, updated_at)
  SELECT 
    'Implement New Payment Gateway', 'Integrate Stripe payment gateway into checkout flow', 'high', 'in_progress', dept_tech, NULL, NOW() + INTERVAL '5 days', profile_1, profile_1, NOW() - INTERVAL '7 days', NOW() - INTERVAL '1 day'
  WHERE NOT EXISTS (SELECT 1 FROM common_util.tasks WHERE title = 'Implement New Payment Gateway' AND deleted_at IS NULL);
  
  INSERT INTO common_util.tasks (title, description, priority, status, department_id, vertical_key, due_date, created_by, updated_by, created_at, updated_at)
  SELECT 
    'Recruit Senior Developer', 'Screen and interview candidates for senior developer position', 'urgent', 'in_progress', dept_hr, 'ats', NOW() + INTERVAL '2 days', profile_2, profile_2, NOW() - INTERVAL '10 days', NOW() - INTERVAL '2 days'
  WHERE NOT EXISTS (SELECT 1 FROM common_util.tasks WHERE title = 'Recruit Senior Developer' AND deleted_at IS NULL);
  
  INSERT INTO common_util.tasks (title, description, priority, status, department_id, vertical_key, due_date, created_by, updated_by, created_at, updated_at)
  SELECT 
    'Optimize Database Queries', 'Review and optimize slow database queries', 'medium', 'in_progress', dept_tech, NULL, NOW() + INTERVAL '8 days', profile_3, profile_3, NOW() - INTERVAL '4 days', NOW() - INTERVAL '1 day'
  WHERE NOT EXISTS (SELECT 1 FROM common_util.tasks WHERE title = 'Optimize Database Queries' AND deleted_at IS NULL);
  
  INSERT INTO common_util.tasks (title, description, priority, status, department_id, vertical_key, due_date, created_by, updated_by, created_at, updated_at)
  SELECT 
    'Process Import Shipment', 'Handle incoming shipment from supplier and update inventory', 'high', 'in_progress', dept_ops, 'import', NOW() + INTERVAL '1 day', profile_4, profile_4, NOW() - INTERVAL '6 days', NOW() - INTERVAL '3 days'
  WHERE NOT EXISTS (SELECT 1 FROM common_util.tasks WHERE title = 'Process Import Shipment' AND deleted_at IS NULL);
  
  INSERT INTO common_util.tasks (title, description, priority, status, department_id, vertical_key, due_date, created_by, updated_by, created_at, updated_at)
  SELECT 
    'Design Marketing Campaign', 'Create assets and plan for Q1 marketing campaign', 'medium', 'in_progress', dept_sales, 'crm', NOW() + INTERVAL '12 days', profile_5, profile_5, NOW() - INTERVAL '8 days', NOW() - INTERVAL '2 days'
  WHERE NOT EXISTS (SELECT 1 FROM common_util.tasks WHERE title = 'Design Marketing Campaign' AND deleted_at IS NULL);
  
  INSERT INTO common_util.tasks (title, description, priority, status, department_id, vertical_key, due_date, created_by, updated_by, created_at, updated_at)
  SELECT 
    'Update Customer Support Scripts', 'Revise support scripts based on recent feedback', 'low', 'in_progress', dept_sales, 'crm', NOW() + INTERVAL '15 days', profile_1, profile_1, NOW() - INTERVAL '3 days', NOW() - INTERVAL '1 day'
  WHERE NOT EXISTS (SELECT 1 FROM common_util.tasks WHERE title = 'Update Customer Support Scripts' AND deleted_at IS NULL);
  
  SELECT id INTO task_6 FROM common_util.tasks WHERE title = 'Implement New Payment Gateway' AND deleted_at IS NULL LIMIT 1;
  SELECT id INTO task_7 FROM common_util.tasks WHERE title = 'Recruit Senior Developer' AND deleted_at IS NULL LIMIT 1;
  SELECT id INTO task_8 FROM common_util.tasks WHERE title = 'Optimize Database Queries' AND deleted_at IS NULL LIMIT 1;
  SELECT id INTO task_9 FROM common_util.tasks WHERE title = 'Process Import Shipment' AND deleted_at IS NULL LIMIT 1;
  SELECT id INTO task_10 FROM common_util.tasks WHERE title = 'Design Marketing Campaign' AND deleted_at IS NULL LIMIT 1;
  SELECT id INTO task_11 FROM common_util.tasks WHERE title = 'Update Customer Support Scripts' AND deleted_at IS NULL LIMIT 1;

  -- Completed tasks (6)
  INSERT INTO common_util.tasks (title, description, priority, status, department_id, vertical_key, due_date, created_by, updated_by, created_at, updated_at)
  SELECT 
    'Deploy Production Update', 'Deploy latest features to production environment', 'high', 'completed', dept_tech, NULL, NOW() - INTERVAL '2 days', profile_2, profile_2, NOW() - INTERVAL '15 days', NOW() - INTERVAL '2 days'
  WHERE NOT EXISTS (SELECT 1 FROM common_util.tasks WHERE title = 'Deploy Production Update' AND deleted_at IS NULL);
  
  INSERT INTO common_util.tasks (title, description, priority, status, department_id, vertical_key, due_date, created_by, updated_by, created_at, updated_at)
  SELECT 
    'Complete Employee Training', 'Conduct quarterly employee training sessions', 'medium', 'completed', dept_hr, NULL, NOW() - INTERVAL '5 days', profile_3, profile_3, NOW() - INTERVAL '20 days', NOW() - INTERVAL '5 days'
  WHERE NOT EXISTS (SELECT 1 FROM common_util.tasks WHERE title = 'Complete Employee Training' AND deleted_at IS NULL);
  
  INSERT INTO common_util.tasks (title, description, priority, status, department_id, vertical_key, due_date, created_by, updated_by, created_at, updated_at)
  SELECT 
    'Finalize Supplier Contract', 'Negotiate and sign contract with new supplier', 'urgent', 'completed', dept_ops, 'import', NOW() - INTERVAL '1 day', profile_4, profile_4, NOW() - INTERVAL '12 days', NOW() - INTERVAL '1 day'
  WHERE NOT EXISTS (SELECT 1 FROM common_util.tasks WHERE title = 'Finalize Supplier Contract' AND deleted_at IS NULL);
  
  INSERT INTO common_util.tasks (title, description, priority, status, department_id, vertical_key, due_date, created_by, updated_by, created_at, updated_at)
  SELECT 
    'Launch New Product Feature', 'Release new product feature to customers', 'high', 'completed', dept_tech, NULL, NOW() - INTERVAL '7 days', profile_5, profile_5, NOW() - INTERVAL '25 days', NOW() - INTERVAL '7 days'
  WHERE NOT EXISTS (SELECT 1 FROM common_util.tasks WHERE title = 'Launch New Product Feature' AND deleted_at IS NULL);
  
  INSERT INTO common_util.tasks (title, description, priority, status, department_id, vertical_key, due_date, created_by, updated_by, created_at, updated_at)
  SELECT 
    'Update Company Website', 'Refresh company website with new content and design', 'medium', 'completed', dept_sales, NULL, NOW() - INTERVAL '3 days', profile_1, profile_1, NOW() - INTERVAL '18 days', NOW() - INTERVAL '3 days'
  WHERE NOT EXISTS (SELECT 1 FROM common_util.tasks WHERE title = 'Update Company Website' AND deleted_at IS NULL);
  
  INSERT INTO common_util.tasks (title, description, priority, status, department_id, vertical_key, due_date, created_by, updated_by, created_at, updated_at)
  SELECT 
    'Conduct Performance Reviews', 'Complete annual performance reviews for team', 'high', 'completed', dept_hr, NULL, NOW() - INTERVAL '4 days', profile_2, profile_2, NOW() - INTERVAL '22 days', NOW() - INTERVAL '4 days'
  WHERE NOT EXISTS (SELECT 1 FROM common_util.tasks WHERE title = 'Conduct Performance Reviews' AND deleted_at IS NULL);
  
  SELECT id INTO task_12 FROM common_util.tasks WHERE title = 'Deploy Production Update' AND deleted_at IS NULL LIMIT 1;
  SELECT id INTO task_13 FROM common_util.tasks WHERE title = 'Complete Employee Training' AND deleted_at IS NULL LIMIT 1;
  SELECT id INTO task_14 FROM common_util.tasks WHERE title = 'Finalize Supplier Contract' AND deleted_at IS NULL LIMIT 1;
  SELECT id INTO task_15 FROM common_util.tasks WHERE title = 'Launch New Product Feature' AND deleted_at IS NULL LIMIT 1;
  SELECT id INTO task_16 FROM common_util.tasks WHERE title = 'Update Company Website' AND deleted_at IS NULL LIMIT 1;
  SELECT id INTO task_17 FROM common_util.tasks WHERE title = 'Conduct Performance Reviews' AND deleted_at IS NULL LIMIT 1;

  -- Cancelled tasks (3)
  INSERT INTO common_util.tasks (title, description, priority, status, department_id, vertical_key, due_date, created_by, updated_by, created_at, updated_at)
  SELECT 
    'Old Project Migration', 'Migrate legacy system (project cancelled)', 'low', 'cancelled', dept_tech, NULL, NOW() + INTERVAL '30 days', profile_3, profile_3, NOW() - INTERVAL '30 days', NOW() - INTERVAL '10 days'
  WHERE NOT EXISTS (SELECT 1 FROM common_util.tasks WHERE title = 'Old Project Migration' AND deleted_at IS NULL);
  
  INSERT INTO common_util.tasks (title, description, priority, status, department_id, vertical_key, due_date, created_by, updated_by, created_at, updated_at)
  SELECT 
    'Deprecated Feature Removal', 'Remove old feature (no longer needed)', 'medium', 'cancelled', dept_tech, NULL, NOW() + INTERVAL '20 days', profile_4, profile_4, NOW() - INTERVAL '25 days', NOW() - INTERVAL '8 days'
  WHERE NOT EXISTS (SELECT 1 FROM common_util.tasks WHERE title = 'Deprecated Feature Removal' AND deleted_at IS NULL);
  
  INSERT INTO common_util.tasks (title, description, priority, status, department_id, vertical_key, due_date, created_by, updated_by, created_at, updated_at)
  SELECT 
    'Cancelled Event Planning', 'Plan company event (event cancelled)', 'low', 'cancelled', dept_hr, NULL, NOW() + INTERVAL '45 days', profile_5, profile_5, NOW() - INTERVAL '20 days', NOW() - INTERVAL '5 days'
  WHERE NOT EXISTS (SELECT 1 FROM common_util.tasks WHERE title = 'Cancelled Event Planning' AND deleted_at IS NULL);
  
  SELECT id INTO task_18 FROM common_util.tasks WHERE title = 'Old Project Migration' AND deleted_at IS NULL LIMIT 1;
  SELECT id INTO task_19 FROM common_util.tasks WHERE title = 'Deprecated Feature Removal' AND deleted_at IS NULL LIMIT 1;
  SELECT id INTO task_20 FROM common_util.tasks WHERE title = 'Cancelled Event Planning' AND deleted_at IS NULL LIMIT 1;

  -- Create task assignees (2-3 per task) - only if tasks exist and assignees don't
  IF task_1 IS NOT NULL THEN
    INSERT INTO common_util.task_assignees (task_id, profile_id, role, created_at)
    SELECT task_1, profile_1, 'owner', NOW()
    WHERE NOT EXISTS (SELECT 1 FROM common_util.task_assignees WHERE task_id = task_1 AND profile_id = profile_1);
    
    INSERT INTO common_util.task_assignees (task_id, profile_id, role, created_at)
    VALUES 
      (task_1, profile_2, 'collaborator', NOW()),
      (task_2, profile_2, 'owner', NOW()),
      (task_2, profile_3, 'collaborator', NOW()),
      (task_3, profile_3, 'owner', NOW()),
      (task_3, profile_1, 'collaborator', NOW()),
      (task_3, profile_4, 'watcher', NOW()),
      (task_4, profile_4, 'owner', NOW()),
      (task_4, profile_5, 'collaborator', NOW()),
      (task_5, profile_5, 'owner', NOW()),
      (task_5, profile_1, 'collaborator', NOW()),
      (task_6, profile_1, 'owner', NOW()),
      (task_6, profile_2, 'collaborator', NOW()),
      (task_6, profile_3, 'watcher', NOW()),
      (task_7, profile_2, 'owner', NOW()),
      (task_7, profile_4, 'collaborator', NOW()),
      (task_8, profile_3, 'owner', NOW()),
      (task_8, profile_1, 'collaborator', NOW()),
      (task_9, profile_4, 'owner', NOW()),
      (task_9, profile_5, 'collaborator', NOW()),
      (task_10, profile_5, 'owner', NOW()),
      (task_10, profile_1, 'collaborator', NOW()),
      (task_11, profile_1, 'owner', NOW()),
      (task_12, profile_2, 'owner', NOW()),
      (task_12, profile_3, 'collaborator', NOW()),
      (task_13, profile_3, 'owner', NOW()),
      (task_14, profile_4, 'owner', NOW()),
      (task_14, profile_5, 'collaborator', NOW()),
      (task_15, profile_5, 'owner', NOW()),
      (task_15, profile_1, 'collaborator', NOW()),
      (task_16, profile_1, 'owner', NOW()),
      (task_17, profile_2, 'owner', NOW()),
      (task_17, profile_3, 'collaborator', NOW()),
      (task_18, profile_3, 'owner', NOW()),
      (task_19, profile_4, 'owner', NOW()),
      (task_20, profile_5, 'owner', NOW())
    ON CONFLICT DO NOTHING;
  END IF;

  -- Create task comments (3-5 comments on selected tasks) - only if tasks exist
  IF task_6 IS NOT NULL THEN
    INSERT INTO common_util.task_comments (task_id, author_id, body, created_at)
    VALUES
      (task_6, profile_1, 'Started working on the payment gateway integration. API keys have been configured.', NOW() - INTERVAL '6 days'),
      (task_6, profile_2, 'Please review the webhook implementation when you have a chance.', NOW() - INTERVAL '4 days'),
      (task_6, profile_3, 'Testing completed successfully. Ready for staging deployment.', NOW() - INTERVAL '1 day'),
      (task_7, profile_2, 'Scheduled interviews with 5 candidates for next week.', NOW() - INTERVAL '8 days'),
      (task_7, profile_4, 'Candidate profiles have been reviewed. Top 3 selected for final round.', NOW() - INTERVAL '3 days'),
      (task_12, profile_2, 'Deployment completed successfully. All systems operational.', NOW() - INTERVAL '2 days'),
      (task_12, profile_3, 'Great work on this! The new features are working perfectly.', NOW() - INTERVAL '2 days'),
      (task_14, profile_4, 'Contract signed and filed. Supplier onboarding process initiated.', NOW() - INTERVAL '1 day'),
      (task_14, profile_5, 'Excellent negotiation. Terms are very favorable.', NOW() - INTERVAL '1 day'),
      (task_15, profile_5, 'Feature launched successfully. User feedback is positive.', NOW() - INTERVAL '7 days'),
      (task_15, profile_1, 'Monitoring metrics show good adoption rates.', NOW() - INTERVAL '6 days'),
      (task_15, profile_5, 'No critical issues reported so far. Feature is stable.', NOW() - INTERVAL '5 days')
    ON CONFLICT DO NOTHING;
  END IF;

  -- Create task status history (for tasks that changed status) - only if tasks exist
  IF task_6 IS NOT NULL THEN
    INSERT INTO common_util.task_status_history (task_id, from_status, to_status, changed_by, changed_at)
    VALUES 
      (task_6, 'pending', 'in_progress', profile_1, NOW() - INTERVAL '6 days'),
      (task_7, 'pending', 'in_progress', profile_2, NOW() - INTERVAL '8 days'),
      (task_12, 'pending', 'in_progress', profile_2, NOW() - INTERVAL '12 days'),
      (task_12, 'in_progress', 'completed', profile_2, NOW() - INTERVAL '2 days'),
      (task_13, 'pending', 'in_progress', profile_3, NOW() - INTERVAL '15 days'),
      (task_13, 'in_progress', 'completed', profile_3, NOW() - INTERVAL '5 days'),
      (task_14, 'pending', 'in_progress', profile_4, NOW() - INTERVAL '10 days'),
      (task_14, 'in_progress', 'completed', profile_4, NOW() - INTERVAL '1 day'),
      (task_18, 'pending', 'cancelled', profile_3, NOW() - INTERVAL '10 days'),
      (task_19, 'pending', 'in_progress', profile_4, NOW() - INTERVAL '20 days'),
      (task_19, 'in_progress', 'cancelled', profile_4, NOW() - INTERVAL '8 days'),
      (task_20, 'pending', 'cancelled', profile_5, NOW() - INTERVAL '5 days')
    ON CONFLICT DO NOTHING;
  END IF;

  RAISE NOTICE 'Task seeding completed successfully! Created:
  - Tasks: 20 (5 pending, 6 in_progress, 6 completed, 3 cancelled)
  - Task Assignees: Multiple per task
  - Task Comments: 12 comments
  - Task Status History: 12 status changes';

END $$;

