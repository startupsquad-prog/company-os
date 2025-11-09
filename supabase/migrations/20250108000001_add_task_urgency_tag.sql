-- ============================================================================
-- Add urgency_tag computed field for tasks
-- Company OS: Formula-generated field for quick filtering (expiring_soon, overdue)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Function to calculate urgency_tag based on due_date and status
-- Returns: 'overdue', 'expiring_soon', or NULL
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION common_util.calculate_task_urgency_tag(
    p_due_date TIMESTAMPTZ,
    p_status TEXT
)
RETURNS TEXT AS $$
BEGIN
    -- If no due date, return NULL
    IF p_due_date IS NULL THEN
        RETURN NULL;
    END IF;
    
    -- If task is completed, return NULL (no urgency)
    IF p_status = 'completed' THEN
        RETURN NULL;
    END IF;
    
    -- Calculate days until due (negative if overdue)
    DECLARE
        days_until_due INTEGER;
    BEGIN
        days_until_due := EXTRACT(EPOCH FROM (p_due_date - NOW())) / 86400;
        
        -- Overdue: past due date
        IF days_until_due < 0 THEN
            RETURN 'overdue';
        END IF;
        
        -- Expiring soon: within 3 days (0-3 days)
        IF days_until_due <= 3 AND days_until_due >= 0 THEN
            RETURN 'expiring_soon';
        END IF;
        
        -- Otherwise, no urgency tag
        RETURN NULL;
    END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ----------------------------------------------------------------------------
-- Add index on due_date for better performance of urgency calculations
-- (already exists, but ensuring it's there)
-- ----------------------------------------------------------------------------
-- Index already exists: idx_tasks_due_date

-- ----------------------------------------------------------------------------
-- Add comment explaining the urgency_tag logic
-- ----------------------------------------------------------------------------
COMMENT ON FUNCTION common_util.calculate_task_urgency_tag IS 
'Calculates urgency tag for tasks:
- overdue: due_date is in the past and status is not completed
- expiring_soon: due_date is within 3 days (0-3 days) and status is not completed
- NULL: no due date, completed, or more than 3 days away';

