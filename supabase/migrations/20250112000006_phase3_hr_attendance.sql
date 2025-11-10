-- ============================================================================
-- Phase 3.1 — HR Attendance Management
-- Company OS: Attendance tracking with HR/Admin/Accounts portals
-- ============================================================================
-- Purpose: Time tracking and attendance management
-- Relations: Link to core.profiles (employee), core.departments
-- ============================================================================

-- Create HR schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS hr;

-- ----------------------------------------------------------------------------
-- 1. Attendance Sessions Table (daily attendance records)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS hr.attendance_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES core.profiles(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    check_in_time TIMESTAMPTZ,
    check_out_time TIMESTAMPTZ,
    break_duration_minutes INTEGER DEFAULT 0,
    total_hours NUMERIC(5, 2),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'present', 'absent', 'half_day', 'leave', 'holiday')),
    notes TEXT,
    approved_by UUID REFERENCES core.profiles(id) ON DELETE SET NULL,
    approved_at TIMESTAMPTZ,
    meta JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by TEXT,
    deleted_at TIMESTAMPTZ,
    UNIQUE(employee_id, date)
);

-- ----------------------------------------------------------------------------
-- 2. Attendance Records Table (detailed time entries)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS hr.attendance_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES hr.attendance_sessions(id) ON DELETE CASCADE,
    record_type TEXT NOT NULL CHECK (record_type IN ('check_in', 'check_out', 'break_start', 'break_end', 'manual_entry')),
    timestamp TIMESTAMPTZ NOT NULL,
    location TEXT,
    device_info TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by TEXT
);

-- ----------------------------------------------------------------------------
-- 3. Leave Requests Table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS hr.leave_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES core.profiles(id) ON DELETE CASCADE,
    leave_type TEXT NOT NULL CHECK (leave_type IN ('sick', 'vacation', 'personal', 'maternity', 'paternity', 'other')),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    days_count NUMERIC(5, 2) NOT NULL,
    reason TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
    approved_by UUID REFERENCES core.profiles(id) ON DELETE SET NULL,
    approved_at TIMESTAMPTZ,
    rejection_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by TEXT,
    deleted_at TIMESTAMPTZ
);

-- ----------------------------------------------------------------------------
-- 4. Indexes
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_attendance_sessions_employee ON hr.attendance_sessions(employee_id);
CREATE INDEX IF NOT EXISTS idx_attendance_sessions_date ON hr.attendance_sessions(date);
CREATE INDEX IF NOT EXISTS idx_attendance_sessions_status ON hr.attendance_sessions(status);
CREATE INDEX IF NOT EXISTS idx_attendance_records_session ON hr.attendance_records(session_id);
CREATE INDEX IF NOT EXISTS idx_attendance_records_timestamp ON hr.attendance_records(timestamp);
CREATE INDEX IF NOT EXISTS idx_leave_requests_employee ON hr.leave_requests(employee_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_status ON hr.leave_requests(status);
CREATE INDEX IF NOT EXISTS idx_leave_requests_dates ON hr.leave_requests(start_date, end_date);

-- ----------------------------------------------------------------------------
-- 5. Triggers
-- ----------------------------------------------------------------------------
CREATE TRIGGER update_attendance_sessions_updated_at
    BEFORE UPDATE ON hr.attendance_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leave_requests_updated_at
    BEFORE UPDATE ON hr.leave_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate total hours from records
CREATE OR REPLACE FUNCTION hr.calculate_session_hours(session_uuid UUID)
RETURNS NUMERIC AS $$
DECLARE
    check_in_time TIMESTAMPTZ;
    check_out_time TIMESTAMPTZ;
    break_minutes INTEGER;
    total_hours NUMERIC;
BEGIN
    SELECT 
        MIN(CASE WHEN record_type = 'check_in' THEN timestamp END),
        MAX(CASE WHEN record_type = 'check_out' THEN timestamp END),
        COALESCE(SUM(CASE WHEN record_type IN ('break_start', 'break_end') THEN 1 END), 0) * 30 -- Estimate break time
    INTO check_in_time, check_out_time, break_minutes
    FROM hr.attendance_records
    WHERE session_id = session_uuid;
    
    IF check_in_time IS NOT NULL AND check_out_time IS NOT NULL THEN
        total_hours := EXTRACT(EPOCH FROM (check_out_time - check_in_time)) / 3600 - (break_minutes / 60.0);
    ELSE
        total_hours := NULL;
    END IF;
    
    RETURN total_hours;
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- 6. RLS Policies
-- ----------------------------------------------------------------------------
ALTER TABLE hr.attendance_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr.attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr.leave_requests ENABLE ROW LEVEL SECURITY;

-- Attendance Sessions: Employees can view their own, HR can view all
CREATE POLICY "Employees can view own attendance"
    ON hr.attendance_sessions FOR SELECT
    USING (
        core.get_clerk_user_id() IS NOT NULL AND
        deleted_at IS NULL AND
        (
            employee_id IN (SELECT id FROM core.profiles WHERE user_id = core.get_clerk_user_id()) OR
            -- HR/Admin can view all (check via role)
            EXISTS (
                SELECT 1 FROM core.user_role_bindings urb
                JOIN core.roles r ON r.id = urb.role_id
                WHERE urb.user_id = core.get_clerk_user_id()
                AND r.name IN ('admin', 'hr_manager', 'hr')
            )
        )
    );

CREATE POLICY "Employees can create own attendance"
    ON hr.attendance_sessions FOR INSERT
    WITH CHECK (
        core.get_clerk_user_id() IS NOT NULL AND
        employee_id IN (SELECT id FROM core.profiles WHERE user_id = core.get_clerk_user_id())
    );

CREATE POLICY "HR can manage all attendance"
    ON hr.attendance_sessions FOR ALL
    USING (
        core.get_clerk_user_id() IS NOT NULL AND
        EXISTS (
            SELECT 1 FROM core.user_role_bindings urb
            JOIN core.roles r ON r.id = urb.role_id
            WHERE urb.user_id = core.get_clerk_user_id()
            AND r.name IN ('admin', 'hr_manager', 'hr')
        )
    );

-- Attendance Records: Same as sessions
CREATE POLICY "Users can view attendance records"
    ON hr.attendance_records FOR SELECT
    USING (
        core.get_clerk_user_id() IS NOT NULL AND
        EXISTS (
            SELECT 1 FROM hr.attendance_sessions
            WHERE id = attendance_records.session_id
            AND deleted_at IS NULL
            AND (
                employee_id IN (SELECT id FROM core.profiles WHERE user_id = core.get_clerk_user_id()) OR
                EXISTS (
                    SELECT 1 FROM core.user_role_bindings urb
                    JOIN core.roles r ON r.id = urb.role_id
                    WHERE urb.user_id = core.get_clerk_user_id()
                    AND r.name IN ('admin', 'hr_manager', 'hr')
                )
            )
        )
    );

CREATE POLICY "Employees can create own attendance records"
    ON hr.attendance_records FOR INSERT
    WITH CHECK (
        core.get_clerk_user_id() IS NOT NULL AND
        EXISTS (
            SELECT 1 FROM hr.attendance_sessions
            WHERE id = attendance_records.session_id
            AND employee_id IN (SELECT id FROM core.profiles WHERE user_id = core.get_clerk_user_id())
        )
    );

-- Leave Requests: Employees can view their own, HR can view all
CREATE POLICY "Employees can view own leave requests"
    ON hr.leave_requests FOR SELECT
    USING (
        core.get_clerk_user_id() IS NOT NULL AND
        deleted_at IS NULL AND
        (
            employee_id IN (SELECT id FROM core.profiles WHERE user_id = core.get_clerk_user_id()) OR
            EXISTS (
                SELECT 1 FROM core.user_role_bindings urb
                JOIN core.roles r ON r.id = urb.role_id
                WHERE urb.user_id = core.get_clerk_user_id()
                AND r.name IN ('admin', 'hr_manager', 'hr')
            )
        )
    );

CREATE POLICY "Employees can create leave requests"
    ON hr.leave_requests FOR INSERT
    WITH CHECK (
        core.get_clerk_user_id() IS NOT NULL AND
        employee_id IN (SELECT id FROM core.profiles WHERE user_id = core.get_clerk_user_id())
    );

CREATE POLICY "HR can manage leave requests"
    ON hr.leave_requests FOR UPDATE
    USING (
        core.get_clerk_user_id() IS NOT NULL AND
        EXISTS (
            SELECT 1 FROM core.user_role_bindings urb
            JOIN core.roles r ON r.id = urb.role_id
            WHERE urb.user_id = core.get_clerk_user_id()
            AND r.name IN ('admin', 'hr_manager', 'hr')
        )
    );

