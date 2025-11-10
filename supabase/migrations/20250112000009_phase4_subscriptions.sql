-- ============================================================================
-- Phase 4.1 — Enhanced Subscriptions Management
-- Company OS: Subscription tracking with KPI cards, spend charts, renewal tracking
-- ============================================================================
-- Purpose: Enhanced subscription management (create if doesn't exist, enhance if exists)
-- Relations: Link to core.profiles (owner), core.teams, core.contacts (vendor)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Subscriptions Table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS common_util.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_name TEXT NOT NULL,
    vendor_id UUID REFERENCES core.contacts(id) ON DELETE SET NULL,
    vendor_name TEXT, -- Denormalized for quick access
    plan_tier TEXT,
    cost_per_period NUMERIC(15, 2),
    cost_per_user NUMERIC(15, 2),
    billing_cycle TEXT CHECK (billing_cycle IN ('monthly', 'quarterly', 'yearly', 'one_time')),
    currency TEXT DEFAULT 'USD',
    auto_renewal_status TEXT DEFAULT 'enabled' CHECK (auto_renewal_status IN ('enabled', 'disabled', 'cancelled')),
    owner_id UUID REFERENCES core.profiles(id) ON DELETE SET NULL,
    team_id UUID REFERENCES core.teams(id) ON DELETE SET NULL,
    start_date DATE,
    expiry_date DATE,
    renewal_date DATE,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled', 'pending', 'trial')),
    number_of_users INTEGER DEFAULT 1,
    portal_url TEXT,
    category TEXT,
    notes TEXT,
    credentials_encrypted JSONB, -- Encrypted credentials storage
    meta JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by TEXT,
    deleted_at TIMESTAMPTZ
);

-- ----------------------------------------------------------------------------
-- 2. Subscription Users Table (many-to-many)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS common_util.subscription_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id UUID NOT NULL REFERENCES common_util.subscriptions(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES core.profiles(id) ON DELETE CASCADE,
    access_level TEXT DEFAULT 'user' CHECK (access_level IN ('admin', 'user', 'viewer')),
    added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    added_by TEXT,
    UNIQUE(subscription_id, profile_id)
);

-- ----------------------------------------------------------------------------
-- 3. Subscription Renewals History Table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS common_util.subscription_renewals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id UUID NOT NULL REFERENCES common_util.subscriptions(id) ON DELETE CASCADE,
    renewal_date DATE NOT NULL,
    amount NUMERIC(15, 2),
    currency TEXT DEFAULT 'USD',
    billing_cycle TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by TEXT
);

-- ----------------------------------------------------------------------------
-- 4. Indexes
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_subscriptions_vendor ON common_util.subscriptions(vendor_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_owner ON common_util.subscriptions(owner_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_team ON common_util.subscriptions(team_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON common_util.subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_category ON common_util.subscriptions(category);
CREATE INDEX IF NOT EXISTS idx_subscriptions_expiry_date ON common_util.subscriptions(expiry_date);
CREATE INDEX IF NOT EXISTS idx_subscriptions_renewal_date ON common_util.subscriptions(renewal_date);
CREATE INDEX IF NOT EXISTS idx_subscription_users_subscription ON common_util.subscription_users(subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscription_users_profile ON common_util.subscription_users(profile_id);
CREATE INDEX IF NOT EXISTS idx_subscription_renewals_subscription ON common_util.subscription_renewals(subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscription_renewals_date ON common_util.subscription_renewals(renewal_date);

-- ----------------------------------------------------------------------------
-- 5. Triggers
-- ----------------------------------------------------------------------------
CREATE TRIGGER update_subscriptions_updated_at
    BEFORE UPDATE ON common_util.subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate annual cost
CREATE OR REPLACE FUNCTION common_util.calculate_annual_cost(
    cost_per_period NUMERIC,
    billing_cycle TEXT
)
RETURNS NUMERIC AS $$
BEGIN
    CASE billing_cycle
        WHEN 'monthly' THEN RETURN cost_per_period * 12;
        WHEN 'quarterly' THEN RETURN cost_per_period * 4;
        WHEN 'yearly' THEN RETURN cost_per_period;
        WHEN 'one_time' THEN RETURN cost_per_period;
        ELSE RETURN NULL;
    END CASE;
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- 6. RLS Policies
-- ----------------------------------------------------------------------------
ALTER TABLE common_util.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE common_util.subscription_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE common_util.subscription_renewals ENABLE ROW LEVEL SECURITY;

-- Subscriptions: Users can view subscriptions they own, are assigned to, or belong to their team
CREATE POLICY "Users can view relevant subscriptions"
    ON common_util.subscriptions FOR SELECT
    USING (
        core.get_clerk_user_id() IS NOT NULL AND
        deleted_at IS NULL AND
        (
            owner_id IN (SELECT id FROM core.profiles WHERE user_id = core.get_clerk_user_id()) OR
            team_id IN (
                SELECT t.id FROM core.teams t
                JOIN core.profiles p ON p.department_id = t.department_id
                WHERE p.user_id = core.get_clerk_user_id()
            ) OR
            EXISTS (
                SELECT 1 FROM common_util.subscription_users
                WHERE subscription_id = subscriptions.id
                AND profile_id IN (SELECT id FROM core.profiles WHERE user_id = core.get_clerk_user_id())
            )
        )
    );

CREATE POLICY "Users can create subscriptions"
    ON common_util.subscriptions FOR INSERT
    WITH CHECK (core.get_clerk_user_id() IS NOT NULL);

CREATE POLICY "Users can update own subscriptions"
    ON common_util.subscriptions FOR UPDATE
    USING (
        core.get_clerk_user_id() IS NOT NULL AND
        (
            owner_id IN (SELECT id FROM core.profiles WHERE user_id = core.get_clerk_user_id()) OR
            created_by = core.get_clerk_user_id()
        )
    );

-- Subscription Users: Users can view users for subscriptions they can see
CREATE POLICY "Users can view subscription users"
    ON common_util.subscription_users FOR SELECT
    USING (
        core.get_clerk_user_id() IS NOT NULL AND
        EXISTS (
            SELECT 1 FROM common_util.subscriptions
            WHERE id = subscription_users.subscription_id
            AND deleted_at IS NULL
        )
    );

CREATE POLICY "Users can manage subscription users"
    ON common_util.subscription_users FOR ALL
    USING (
        core.get_clerk_user_id() IS NOT NULL AND
        EXISTS (
            SELECT 1 FROM common_util.subscriptions
            WHERE id = subscription_users.subscription_id
            AND (
                owner_id IN (SELECT id FROM core.profiles WHERE user_id = core.get_clerk_user_id()) OR
                created_by = core.get_clerk_user_id()
            )
        )
    );

-- Subscription Renewals: Users can view renewals for subscriptions they can see
CREATE POLICY "Users can view subscription renewals"
    ON common_util.subscription_renewals FOR SELECT
    USING (
        core.get_clerk_user_id() IS NOT NULL AND
        EXISTS (
            SELECT 1 FROM common_util.subscriptions
            WHERE id = subscription_renewals.subscription_id
            AND deleted_at IS NULL
        )
    );

CREATE POLICY "Users can create subscription renewals"
    ON common_util.subscription_renewals FOR INSERT
    WITH CHECK (
        core.get_clerk_user_id() IS NOT NULL AND
        EXISTS (
            SELECT 1 FROM common_util.subscriptions
            WHERE id = subscription_renewals.subscription_id
            AND (
                owner_id IN (SELECT id FROM core.profiles WHERE user_id = core.get_clerk_user_id()) OR
                created_by = core.get_clerk_user_id()
            )
        )
    );

