-- ============================================================================
-- Phase 0.1 — Core Schema Setup
-- Company OS: Internal platform for managing all departments
-- ============================================================================
-- Purpose: Base structure for Company OS (not USDrop or Faire)
-- Schemas: core, crm, ats, ops, common_util, import_ops
-- ============================================================================

-- Enable UUID extension (Supabase uses gen_random_uuid() for UUID v4)
-- Note: UUID v7 requires custom function, using gen_random_uuid() for now
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- SCHEMA CREATION
-- ============================================================================

CREATE SCHEMA IF NOT EXISTS core;
CREATE SCHEMA IF NOT EXISTS crm;
CREATE SCHEMA IF NOT EXISTS ats;
CREATE SCHEMA IF NOT EXISTS ops;
CREATE SCHEMA IF NOT EXISTS common_util;
CREATE SCHEMA IF NOT EXISTS import_ops;

-- ============================================================================
-- CORE SCHEMA — Foundation Tables
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Identity & Organization
-- ----------------------------------------------------------------------------

-- Departments (created first to avoid circular dependency)
CREATE TABLE core.departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    deleted_at TIMESTAMPTZ
);

-- Profiles: Extends Supabase auth.users
CREATE TABLE core.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    first_name TEXT,
    last_name TEXT,
    email TEXT,
    phone TEXT,
    department_id UUID REFERENCES core.departments(id) ON DELETE SET NULL,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    deleted_at TIMESTAMPTZ
);

-- Teams
CREATE TABLE core.teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    department_id UUID REFERENCES core.departments(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    deleted_at TIMESTAMPTZ
);

-- Employees: Links profiles to employment records
CREATE TABLE core.employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES core.profiles(id) ON DELETE CASCADE,
    employee_id TEXT UNIQUE,
    hire_date DATE,
    termination_date DATE,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    deleted_at TIMESTAMPTZ
);

-- ----------------------------------------------------------------------------
-- RBAC System
-- ----------------------------------------------------------------------------

-- Modules: System modules for permission organization
CREATE TABLE core.modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    order_no INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Roles
CREATE TABLE core.roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    module_id UUID REFERENCES core.modules(id) ON DELETE SET NULL,
    is_system BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    deleted_at TIMESTAMPTZ
);

-- Permissions
CREATE TABLE core.permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    resource TEXT NOT NULL,
    action TEXT NOT NULL,
    module_id UUID REFERENCES core.modules(id) ON DELETE SET NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Role Permissions: Many-to-many join
CREATE TABLE core.role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id UUID NOT NULL REFERENCES core.roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES core.permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(role_id, permission_id)
);

-- User Role Bindings: Links users to roles
CREATE TABLE core.user_role_bindings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES core.roles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    UNIQUE(user_id, role_id)
);

-- ----------------------------------------------------------------------------
-- Contacts & Companies (One Source of Truth)
-- ----------------------------------------------------------------------------

-- Contacts: People or organizations
CREATE TABLE core.contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    contact_type TEXT DEFAULT 'person', -- 'person' | 'organization'
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    deleted_at TIMESTAMPTZ
);

-- Companies
CREATE TABLE core.companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    legal_name TEXT,
    tax_id TEXT,
    website TEXT,
    industry TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    deleted_at TIMESTAMPTZ
);

-- Company Contacts: Many-to-many join
CREATE TABLE core.company_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES core.companies(id) ON DELETE CASCADE,
    contact_id UUID NOT NULL REFERENCES core.contacts(id) ON DELETE CASCADE,
    role TEXT, -- 'owner', 'manager', 'contact', etc.
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    UNIQUE(company_id, contact_id)
);

-- ----------------------------------------------------------------------------
-- Audit & Utilities
-- ----------------------------------------------------------------------------

-- Activity Events: Global audit log (polymorphic)
CREATE TABLE core.activity_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type TEXT NOT NULL, -- e.g., 'order', 'quotation', 'lead'
    entity_id UUID NOT NULL,
    action TEXT NOT NULL, -- 'created', 'updated', 'deleted', 'status_changed'
    metadata JSONB,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enum Registry: Dynamic enums (category, key, label, order_no)
CREATE TABLE core.enum_registry (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category TEXT NOT NULL, -- e.g., 'quotation_type', 'shipment_type', 'vertical'
    key TEXT NOT NULL, -- e.g., 'factory', 'freight', 'import'
    label TEXT NOT NULL, -- e.g., 'Factory Purchase', 'Freight Forwarding'
    order_no INTEGER DEFAULT 0,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(category, key)
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Profiles
CREATE INDEX idx_profiles_user_id ON core.profiles(user_id);
CREATE INDEX idx_profiles_department_id ON core.profiles(department_id);
CREATE INDEX idx_profiles_deleted_at ON core.profiles(deleted_at) WHERE deleted_at IS NULL;

-- Employees
CREATE INDEX idx_employees_profile_id ON core.employees(profile_id);
CREATE INDEX idx_employees_deleted_at ON core.employees(deleted_at) WHERE deleted_at IS NULL;

-- RBAC
CREATE INDEX idx_roles_module_id ON core.roles(module_id);
CREATE INDEX idx_permissions_module_id ON core.permissions(module_id);
CREATE INDEX idx_role_permissions_role_id ON core.role_permissions(role_id);
CREATE INDEX idx_role_permissions_permission_id ON core.role_permissions(permission_id);
CREATE INDEX idx_user_role_bindings_user_id ON core.user_role_bindings(user_id);
CREATE INDEX idx_user_role_bindings_role_id ON core.user_role_bindings(role_id);

-- Contacts & Companies
CREATE INDEX idx_contacts_deleted_at ON core.contacts(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_contacts_email ON core.contacts(email) WHERE email IS NOT NULL;
CREATE INDEX idx_companies_deleted_at ON core.companies(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_company_contacts_company_id ON core.company_contacts(company_id);
CREATE INDEX idx_company_contacts_contact_id ON core.company_contacts(contact_id);

-- Activity Events
CREATE INDEX idx_activity_events_entity ON core.activity_events(entity_type, entity_id);
CREATE INDEX idx_activity_events_created_at ON core.activity_events(created_at DESC);

-- Enum Registry
CREATE INDEX idx_enum_registry_category ON core.enum_registry(category);
CREATE INDEX idx_enum_registry_category_key ON core.enum_registry(category, key);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE core.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.user_role_bindings ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.company_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.activity_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.enum_registry ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- Sample RLS Policies
-- ----------------------------------------------------------------------------

-- Profiles: Users can view their own profile, admins can view all
CREATE POLICY "Users can view own profile"
    ON core.profiles FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
    ON core.profiles FOR UPDATE
    USING (auth.uid() = user_id);

-- For now, allow authenticated users to view all profiles (can be restricted later with RBAC)
CREATE POLICY "Authenticated users can view profiles"
    ON core.profiles FOR SELECT
    USING (auth.role() = 'authenticated');

-- Departments: Authenticated users can view
CREATE POLICY "Authenticated users can view departments"
    ON core.departments FOR SELECT
    USING (auth.role() = 'authenticated');

-- Teams: Authenticated users can view
CREATE POLICY "Authenticated users can view teams"
    ON core.teams FOR SELECT
    USING (auth.role() = 'authenticated');

-- Employees: Authenticated users can view
CREATE POLICY "Authenticated users can view employees"
    ON core.employees FOR SELECT
    USING (auth.role() = 'authenticated');

-- Roles: Authenticated users can view
CREATE POLICY "Authenticated users can view roles"
    ON core.roles FOR SELECT
    USING (auth.role() = 'authenticated');

-- Permissions: Authenticated users can view
CREATE POLICY "Authenticated users can view permissions"
    ON core.permissions FOR SELECT
    USING (auth.role() = 'authenticated');

-- Role Permissions: Authenticated users can view
CREATE POLICY "Authenticated users can view role_permissions"
    ON core.role_permissions FOR SELECT
    USING (auth.role() = 'authenticated');

-- User Role Bindings: Users can view their own bindings
CREATE POLICY "Users can view own role bindings"
    ON core.user_role_bindings FOR SELECT
    USING (auth.uid() = user_id);

-- Contacts: Authenticated users can view
CREATE POLICY "Authenticated users can view contacts"
    ON core.contacts FOR SELECT
    USING (auth.role() = 'authenticated');

-- Companies: Authenticated users can view
CREATE POLICY "Authenticated users can view companies"
    ON core.companies FOR SELECT
    USING (auth.role() = 'authenticated');

-- Company Contacts: Authenticated users can view
CREATE POLICY "Authenticated users can view company_contacts"
    ON core.company_contacts FOR SELECT
    USING (auth.role() = 'authenticated');

-- Activity Events: Authenticated users can view
CREATE POLICY "Authenticated users can view activity_events"
    ON core.activity_events FOR SELECT
    USING (auth.role() = 'authenticated');

-- Enum Registry: Authenticated users can view active enums
CREATE POLICY "Authenticated users can view active enums"
    ON core.enum_registry FOR SELECT
    USING (auth.role() = 'authenticated' AND is_active = TRUE);

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION core.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all tables with updated_at column
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON core.profiles
    FOR EACH ROW
    EXECUTE FUNCTION core.update_updated_at_column();

CREATE TRIGGER update_departments_updated_at
    BEFORE UPDATE ON core.departments
    FOR EACH ROW
    EXECUTE FUNCTION core.update_updated_at_column();

CREATE TRIGGER update_teams_updated_at
    BEFORE UPDATE ON core.teams
    FOR EACH ROW
    EXECUTE FUNCTION core.update_updated_at_column();

CREATE TRIGGER update_employees_updated_at
    BEFORE UPDATE ON core.employees
    FOR EACH ROW
    EXECUTE FUNCTION core.update_updated_at_column();

CREATE TRIGGER update_roles_updated_at
    BEFORE UPDATE ON core.roles
    FOR EACH ROW
    EXECUTE FUNCTION core.update_updated_at_column();

CREATE TRIGGER update_permissions_updated_at
    BEFORE UPDATE ON core.permissions
    FOR EACH ROW
    EXECUTE FUNCTION core.update_updated_at_column();

CREATE TRIGGER update_contacts_updated_at
    BEFORE UPDATE ON core.contacts
    FOR EACH ROW
    EXECUTE FUNCTION core.update_updated_at_column();

CREATE TRIGGER update_companies_updated_at
    BEFORE UPDATE ON core.companies
    FOR EACH ROW
    EXECUTE FUNCTION core.update_updated_at_column();

CREATE TRIGGER update_enum_registry_updated_at
    BEFORE UPDATE ON core.enum_registry
    FOR EACH ROW
    EXECUTE FUNCTION core.update_updated_at_column();

-- ============================================================================
-- RELATIONSHIPS SUMMARY
-- ============================================================================
/*
KEY RELATIONSHIPS:

Identity & Organization:
- auth.users (1:1) → core.profiles
- core.profiles (many:1) → core.departments
- core.profiles (1:many) → core.employees
- core.teams (many:1) → core.departments (optional)

RBAC:
- core.roles (many:1) → core.modules (optional)
- core.permissions (many:1) → core.modules (optional)
- core.role_permissions (many:many) → core.roles ↔ core.permissions
- auth.users (many:many) → core.roles (via core.user_role_bindings)

Contacts & Companies:
- core.contacts (many:many) → core.companies (via core.company_contacts)
- core.company_contacts includes role and is_primary flags

Audit:
- core.activity_events uses polymorphic (entity_type, entity_id) pattern
- All tables reference auth.users via created_by

Common Patterns:
- All tables: id (UUID PK), created_at, updated_at, created_by, deleted_at
- Soft deletes via deleted_at timestamp
- RLS enabled on all tables
- Indexes on foreign keys and common query patterns
*/

