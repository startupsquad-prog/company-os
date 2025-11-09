-- ============================================================================
-- Phase 0.2 — Seed Data and RBAC Initialization
-- Company OS: Essential reference data and relationships
-- ============================================================================

-- ============================================================================
-- 1. INSERT BASE MODULES
-- ============================================================================

INSERT INTO core.modules (name, description, order_no) VALUES
    ('crm', 'Customer Relationship Management', 1),
    ('ats', 'Applicant Tracking System', 2),
    ('ops', 'Operations & Order Management', 3),
    ('common_util', 'Common Utilities (Tasks, SOPs, etc.)', 4),
    ('import_ops', 'Import Operations Vertical', 5)
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- 2. INSERT PERMISSIONS
-- ============================================================================

-- Get module IDs for reference
DO $$
DECLARE
    crm_module_id UUID;
    ats_module_id UUID;
    ops_module_id UUID;
    common_util_module_id UUID;
    import_ops_module_id UUID;
BEGIN
    SELECT id INTO crm_module_id FROM core.modules WHERE name = 'crm';
    SELECT id INTO ats_module_id FROM core.modules WHERE name = 'ats';
    SELECT id INTO ops_module_id FROM core.modules WHERE name = 'ops';
    SELECT id INTO common_util_module_id FROM core.modules WHERE name = 'common_util';
    SELECT id INTO import_ops_module_id FROM core.modules WHERE name = 'import_ops';

    -- Insert permissions (generic actions that apply to all modules)
    INSERT INTO core.permissions (name, resource, action, module_id, description) VALUES
        ('read', 'all', 'read', NULL, 'Read/view access'),
        ('create', 'all', 'create', NULL, 'Create new records'),
        ('update', 'all', 'update', NULL, 'Update existing records'),
        ('delete', 'all', 'delete', NULL, 'Delete records'),
        ('manage', 'all', 'manage', NULL, 'Full management access (read, create, update, delete)'),
        ('rbac_manage', 'rbac', 'manage', NULL, 'Manage roles, permissions, and user access')
    ON CONFLICT (name) DO NOTHING;
END $$;

-- ============================================================================
-- 3. INSERT ROLES
-- ============================================================================

INSERT INTO core.roles (name, description, is_system) VALUES
    ('viewer', 'View-only access to assigned modules', TRUE),
    ('editor', 'Can read, create, and update records', TRUE),
    ('manager', 'Can read, create, update, delete, and manage records', TRUE),
    ('admin', 'Full access to all modules except RBAC management', TRUE),
    ('superadmin', 'Full system access including RBAC management', TRUE)
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- 4. MAP ROLE PERMISSIONS
-- ============================================================================

DO $$
DECLARE
    viewer_role_id UUID;
    editor_role_id UUID;
    manager_role_id UUID;
    admin_role_id UUID;
    superadmin_role_id UUID;
    read_permission_id UUID;
    create_permission_id UUID;
    update_permission_id UUID;
    delete_permission_id UUID;
    manage_permission_id UUID;
    rbac_manage_permission_id UUID;
BEGIN
    -- Get role IDs
    SELECT id INTO viewer_role_id FROM core.roles WHERE name = 'viewer';
    SELECT id INTO editor_role_id FROM core.roles WHERE name = 'editor';
    SELECT id INTO manager_role_id FROM core.roles WHERE name = 'manager';
    SELECT id INTO admin_role_id FROM core.roles WHERE name = 'admin';
    SELECT id INTO superadmin_role_id FROM core.roles WHERE name = 'superadmin';

    -- Get permission IDs
    SELECT id INTO read_permission_id FROM core.permissions WHERE name = 'read';
    SELECT id INTO create_permission_id FROM core.permissions WHERE name = 'create';
    SELECT id INTO update_permission_id FROM core.permissions WHERE name = 'update';
    SELECT id INTO delete_permission_id FROM core.permissions WHERE name = 'delete';
    SELECT id INTO manage_permission_id FROM core.permissions WHERE name = 'manage';
    SELECT id INTO rbac_manage_permission_id FROM core.permissions WHERE name = 'rbac_manage';

    -- Viewer: read only
    INSERT INTO core.role_permissions (role_id, permission_id) VALUES
        (viewer_role_id, read_permission_id)
    ON CONFLICT (role_id, permission_id) DO NOTHING;

    -- Editor: read, create, update
    INSERT INTO core.role_permissions (role_id, permission_id) VALUES
        (editor_role_id, read_permission_id),
        (editor_role_id, create_permission_id),
        (editor_role_id, update_permission_id)
    ON CONFLICT (role_id, permission_id) DO NOTHING;

    -- Manager: read, create, update, delete, manage
    INSERT INTO core.role_permissions (role_id, permission_id) VALUES
        (manager_role_id, read_permission_id),
        (manager_role_id, create_permission_id),
        (manager_role_id, update_permission_id),
        (manager_role_id, delete_permission_id),
        (manager_role_id, manage_permission_id)
    ON CONFLICT (role_id, permission_id) DO NOTHING;

    -- Admin: all except rbac_manage
    INSERT INTO core.role_permissions (role_id, permission_id) VALUES
        (admin_role_id, read_permission_id),
        (admin_role_id, create_permission_id),
        (admin_role_id, update_permission_id),
        (admin_role_id, delete_permission_id),
        (admin_role_id, manage_permission_id)
    ON CONFLICT (role_id, permission_id) DO NOTHING;

    -- Superadmin: all including rbac_manage
    INSERT INTO core.role_permissions (role_id, permission_id) VALUES
        (superadmin_role_id, read_permission_id),
        (superadmin_role_id, create_permission_id),
        (superadmin_role_id, update_permission_id),
        (superadmin_role_id, delete_permission_id),
        (superadmin_role_id, manage_permission_id),
        (superadmin_role_id, rbac_manage_permission_id)
    ON CONFLICT (role_id, permission_id) DO NOTHING;
END $$;

-- ============================================================================
-- 5. INSERT DEPARTMENTS AND TEAMS
-- ============================================================================

DO $$
DECLARE
    sales_dept_id UUID;
    hr_dept_id UUID;
    ops_dept_id UUID;
    tech_dept_id UUID;
BEGIN
    -- Insert departments
    INSERT INTO core.departments (name, description) VALUES
        ('Sales', 'Sales and Business Development'),
        ('HR', 'Human Resources and Employee Management'),
        ('Operations', 'Operations and Order Management'),
        ('Tech', 'Technology and Development')
    ON CONFLICT DO NOTHING;

    -- Get department IDs
    SELECT id INTO sales_dept_id FROM core.departments WHERE name = 'Sales';
    SELECT id INTO hr_dept_id FROM core.departments WHERE name = 'HR';
    SELECT id INTO ops_dept_id FROM core.departments WHERE name = 'Operations';
    SELECT id INTO tech_dept_id FROM core.departments WHERE name = 'Tech';

    -- Insert teams (only if they don't exist)
    INSERT INTO core.teams (name, description, department_id)
    SELECT 'Sales Team A', 'Primary sales team', sales_dept_id
    WHERE NOT EXISTS (SELECT 1 FROM core.teams WHERE name = 'Sales Team A');
    
    INSERT INTO core.teams (name, description, department_id)
    SELECT 'HR Core', 'Core HR operations team', hr_dept_id
    WHERE NOT EXISTS (SELECT 1 FROM core.teams WHERE name = 'HR Core');
    
    INSERT INTO core.teams (name, description, department_id)
    SELECT 'Ops Team 1', 'Primary operations team', ops_dept_id
    WHERE NOT EXISTS (SELECT 1 FROM core.teams WHERE name = 'Ops Team 1');
    
    INSERT INTO core.teams (name, description, department_id)
    SELECT 'Tech Team', 'Technology development team', tech_dept_id
    WHERE NOT EXISTS (SELECT 1 FROM core.teams WHERE name = 'Tech Team');
END $$;

-- ============================================================================
-- 6. INSERT SEED SUPERADMIN PROFILE (if auth user exists)
-- ============================================================================

DO $$
DECLARE
    first_user_id UUID;
    superadmin_role_id UUID;
    profile_id UUID;
BEGIN
    -- Get first auth user (if exists)
    SELECT id INTO first_user_id FROM auth.users ORDER BY created_at LIMIT 1;

    IF first_user_id IS NOT NULL THEN
        -- Get superadmin role
        SELECT id INTO superadmin_role_id FROM core.roles WHERE name = 'superadmin';

        -- Create profile for first user
        INSERT INTO core.profiles (user_id, first_name, last_name, email)
        SELECT 
            id,
            'Super',
            'Admin',
            email
        FROM auth.users
        WHERE id = first_user_id
        ON CONFLICT (user_id) DO NOTHING
        RETURNING id INTO profile_id;

        -- Get profile_id if it already existed
        IF profile_id IS NULL THEN
            SELECT id INTO profile_id FROM core.profiles WHERE user_id = first_user_id;
        END IF;

        -- Assign superadmin role
        IF superadmin_role_id IS NOT NULL AND profile_id IS NOT NULL THEN
            INSERT INTO core.user_role_bindings (user_id, role_id, created_by)
            VALUES (first_user_id, superadmin_role_id, first_user_id)
            ON CONFLICT (user_id, role_id) DO NOTHING;
        END IF;
    END IF;
END $$;

-- ============================================================================
-- 7. INSERT ENUM REGISTRY VALUES
-- ============================================================================

-- Quotation Types
INSERT INTO core.enum_registry (category, key, label, order_no, description) VALUES
    ('quotation_type', 'factory', 'Factory Purchase', 1, 'Quotation from factory for product purchase'),
    ('quotation_type', 'freight', 'Freight Forwarding', 2, 'Freight forwarding quotation'),
    ('quotation_type', 'client', 'Client Quotation', 3, 'Quotation sent to client'),
    ('quotation_type', 'warehouse', 'Warehouse Service', 4, 'Warehouse service quotation')
ON CONFLICT (category, key) DO NOTHING;

-- Shipment Types
INSERT INTO core.enum_registry (category, key, label, order_no, description) VALUES
    ('shipment_type', 'amazon_india', 'Amazon India', 1, 'Amazon India marketplace shipment'),
    ('shipment_type', 'website_india', 'Website India', 2, 'India website customer shipment'),
    ('shipment_type', 'freight_forwarding', 'Freight Forwarding', 3, 'International freight forwarding shipment')
ON CONFLICT (category, key) DO NOTHING;

-- Lead Status
INSERT INTO core.enum_registry (category, key, label, order_no, description) VALUES
    ('lead_status', 'new', 'New', 1, 'Newly created lead'),
    ('lead_status', 'qualified', 'Qualified', 2, 'Qualified lead'),
    ('lead_status', 'won', 'Won', 3, 'Converted to customer'),
    ('lead_status', 'lost', 'Lost', 4, 'Lost opportunity')
ON CONFLICT (category, key) DO NOTHING;

-- Order Status
INSERT INTO core.enum_registry (category, key, label, order_no, description) VALUES
    ('order_status', 'pending', 'Pending', 1, 'Order pending confirmation'),
    ('order_status', 'confirmed', 'Confirmed', 2, 'Order confirmed'),
    ('order_status', 'shipped', 'Shipped', 3, 'Order shipped'),
    ('order_status', 'delivered', 'Delivered', 4, 'Order delivered'),
    ('order_status', 'cancelled', 'Cancelled', 5, 'Order cancelled')
ON CONFLICT (category, key) DO NOTHING;

-- Task Priority
INSERT INTO core.enum_registry (category, key, label, order_no, description) VALUES
    ('task_priority', 'low', 'Low', 1, 'Low priority task'),
    ('task_priority', 'medium', 'Medium', 2, 'Medium priority task'),
    ('task_priority', 'high', 'High', 3, 'High priority task'),
    ('task_priority', 'urgent', 'Urgent', 4, 'Urgent priority task')
ON CONFLICT (category, key) DO NOTHING;

-- Task Status
INSERT INTO core.enum_registry (category, key, label, order_no, description) VALUES
    ('task_status', 'pending', 'Pending', 1, 'Task pending'),
    ('task_status', 'in_progress', 'In Progress', 2, 'Task in progress'),
    ('task_status', 'completed', 'Completed', 3, 'Task completed'),
    ('task_status', 'cancelled', 'Cancelled', 4, 'Task cancelled')
ON CONFLICT (category, key) DO NOTHING;

-- Vertical Keys
INSERT INTO core.enum_registry (category, key, label, order_no, description) VALUES
    ('vertical', 'import', 'Import Vertical', 1, 'Import operations business vertical'),
    ('vertical', 'india_website', 'India Website', 2, 'India website business vertical')
ON CONFLICT (category, key) DO NOTHING;

-- ============================================================================
-- 8. VERIFICATION QUERIES
-- ============================================================================

-- Verify counts (commented out - uncomment to run verification)
/*
SELECT 
    'roles' as table_name, COUNT(*) as count FROM core.roles
UNION ALL
SELECT 'modules', COUNT(*) FROM core.modules
UNION ALL
SELECT 'permissions', COUNT(*) FROM core.permissions
UNION ALL
SELECT 'role_permissions', COUNT(*) FROM core.role_permissions
UNION ALL
SELECT 'departments', COUNT(*) FROM core.departments
UNION ALL
SELECT 'teams', COUNT(*) FROM core.teams
UNION ALL
SELECT 'enum_registry', COUNT(*) FROM core.enum_registry;
*/

