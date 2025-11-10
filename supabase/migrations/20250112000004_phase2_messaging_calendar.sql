-- ============================================================================
-- Phase 2.1 & 2.2 — Messaging System & Calendar
-- Company OS: Internal messaging and event scheduling
-- ============================================================================
-- Purpose: Messaging between employees/leads and calendar event management
-- Relations: Link to core.profiles (participants), crm.leads (optional thread context)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Message Threads Table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS common_util.message_threads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject TEXT,
    thread_type TEXT DEFAULT 'direct' CHECK (thread_type IN ('direct', 'group', 'lead')),
    lead_id UUID REFERENCES crm.leads(id) ON DELETE SET NULL,
    last_message_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by TEXT,
    deleted_at TIMESTAMPTZ
);

-- ----------------------------------------------------------------------------
-- 2. Message Thread Participants Table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS common_util.message_thread_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    thread_id UUID NOT NULL REFERENCES common_util.message_threads(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES core.profiles(id) ON DELETE CASCADE,
    last_read_at TIMESTAMPTZ,
    is_muted BOOLEAN DEFAULT FALSE,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(thread_id, profile_id)
);

-- ----------------------------------------------------------------------------
-- 3. Messages Table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS common_util.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    thread_id UUID NOT NULL REFERENCES common_util.message_threads(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES core.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'file', 'system')),
    file_url TEXT,
    file_name TEXT,
    file_size BIGINT,
    is_edited BOOLEAN DEFAULT FALSE,
    edited_at TIMESTAMPTZ,
    meta JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- ----------------------------------------------------------------------------
-- 4. Events Table (Calendar)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS common_util.events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    event_type TEXT DEFAULT 'meeting' CHECK (event_type IN ('meeting', 'call', 'task', 'reminder', 'other')),
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    all_day BOOLEAN DEFAULT FALSE,
    location TEXT,
    organizer_id UUID NOT NULL REFERENCES core.profiles(id) ON DELETE CASCADE,
    lead_id UUID REFERENCES crm.leads(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
    reminder_minutes INTEGER[], -- Array of minutes before event to send reminders
    meta JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by TEXT,
    deleted_at TIMESTAMPTZ
);

-- ----------------------------------------------------------------------------
-- 5. Event Participants Table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS common_util.event_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES common_util.events(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES core.profiles(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'tentative')),
    response_at TIMESTAMPTZ,
    UNIQUE(event_id, profile_id)
);

-- ----------------------------------------------------------------------------
-- 6. Indexes
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_message_threads_lead ON common_util.message_threads(lead_id);
CREATE INDEX IF NOT EXISTS idx_message_threads_last_message ON common_util.message_threads(last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_message_thread_participants_thread ON common_util.message_thread_participants(thread_id);
CREATE INDEX IF NOT EXISTS idx_message_thread_participants_profile ON common_util.message_thread_participants(profile_id);
CREATE INDEX IF NOT EXISTS idx_messages_thread ON common_util.messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON common_util.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON common_util.messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_organizer ON common_util.events(organizer_id);
CREATE INDEX IF NOT EXISTS idx_events_lead ON common_util.events(lead_id);
CREATE INDEX IF NOT EXISTS idx_events_start_time ON common_util.events(start_time);
CREATE INDEX IF NOT EXISTS idx_events_status ON common_util.events(status);
CREATE INDEX IF NOT EXISTS idx_event_participants_event ON common_util.event_participants(event_id);
CREATE INDEX IF NOT EXISTS idx_event_participants_profile ON common_util.event_participants(profile_id);

-- ----------------------------------------------------------------------------
-- 7. Triggers
-- ----------------------------------------------------------------------------
CREATE TRIGGER update_message_threads_updated_at
    BEFORE UPDATE ON common_util.message_threads
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at
    BEFORE UPDATE ON common_util.events
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger to update last_message_at when a message is created
CREATE OR REPLACE FUNCTION common_util.update_thread_last_message()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE common_util.message_threads
    SET last_message_at = NEW.created_at
    WHERE id = NEW.thread_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_thread_last_message_trigger
    AFTER INSERT ON common_util.messages
    FOR EACH ROW
    EXECUTE FUNCTION common_util.update_thread_last_message();

-- ----------------------------------------------------------------------------
-- 8. RLS Policies
-- ----------------------------------------------------------------------------
ALTER TABLE common_util.message_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE common_util.message_thread_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE common_util.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE common_util.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE common_util.event_participants ENABLE ROW LEVEL SECURITY;

-- Message Threads: Users can view threads they participate in
CREATE POLICY "Users can view participating threads"
    ON common_util.message_threads FOR SELECT
    USING (
        core.get_clerk_user_id() IS NOT NULL AND
        deleted_at IS NULL AND
        EXISTS (
            SELECT 1 FROM common_util.message_thread_participants
            WHERE thread_id = message_threads.id
            AND profile_id IN (SELECT id FROM core.profiles WHERE user_id = core.get_clerk_user_id())
        )
    );

CREATE POLICY "Users can create threads"
    ON common_util.message_threads FOR INSERT
    WITH CHECK (core.get_clerk_user_id() IS NOT NULL);

CREATE POLICY "Users can update own threads"
    ON common_util.message_threads FOR UPDATE
    USING (
        core.get_clerk_user_id() IS NOT NULL AND
        created_by = core.get_clerk_user_id()
    );

-- Message Thread Participants: Users can view participants of their threads
CREATE POLICY "Users can view thread participants"
    ON common_util.message_thread_participants FOR SELECT
    USING (
        core.get_clerk_user_id() IS NOT NULL AND
        EXISTS (
            SELECT 1 FROM common_util.message_thread_participants mtp
            WHERE mtp.thread_id = message_thread_participants.thread_id
            AND mtp.profile_id IN (SELECT id FROM core.profiles WHERE user_id = core.get_clerk_user_id())
        )
    );

CREATE POLICY "Users can manage thread participants"
    ON common_util.message_thread_participants FOR ALL
    USING (
        core.get_clerk_user_id() IS NOT NULL AND
        EXISTS (
            SELECT 1 FROM common_util.message_threads
            WHERE id = message_thread_participants.thread_id
            AND created_by = core.get_clerk_user_id()
        )
    );

-- Messages: Users can view messages in threads they participate in
CREATE POLICY "Users can view thread messages"
    ON common_util.messages FOR SELECT
    USING (
        core.get_clerk_user_id() IS NOT NULL AND
        deleted_at IS NULL AND
        EXISTS (
            SELECT 1 FROM common_util.message_thread_participants
            WHERE thread_id = messages.thread_id
            AND profile_id IN (SELECT id FROM core.profiles WHERE user_id = core.get_clerk_user_id())
        )
    );

CREATE POLICY "Users can create messages"
    ON common_util.messages FOR INSERT
    WITH CHECK (
        core.get_clerk_user_id() IS NOT NULL AND
        sender_id IN (SELECT id FROM core.profiles WHERE user_id = core.get_clerk_user_id()) AND
        EXISTS (
            SELECT 1 FROM common_util.message_thread_participants
            WHERE thread_id = messages.thread_id
            AND profile_id = messages.sender_id
        )
    );

CREATE POLICY "Users can update own messages"
    ON common_util.messages FOR UPDATE
    USING (
        core.get_clerk_user_id() IS NOT NULL AND
        sender_id IN (SELECT id FROM core.profiles WHERE user_id = core.get_clerk_user_id())
    );

CREATE POLICY "Users can delete own messages"
    ON common_util.messages FOR DELETE
    USING (
        core.get_clerk_user_id() IS NOT NULL AND
        sender_id IN (SELECT id FROM core.profiles WHERE user_id = core.get_clerk_user_id())
    );

-- Events: Users can view events they organize or participate in
CREATE POLICY "Users can view participating events"
    ON common_util.events FOR SELECT
    USING (
        core.get_clerk_user_id() IS NOT NULL AND
        deleted_at IS NULL AND
        (
            organizer_id IN (SELECT id FROM core.profiles WHERE user_id = core.get_clerk_user_id()) OR
            EXISTS (
                SELECT 1 FROM common_util.event_participants
                WHERE event_id = events.id
                AND profile_id IN (SELECT id FROM core.profiles WHERE user_id = core.get_clerk_user_id())
            )
        )
    );

CREATE POLICY "Users can create events"
    ON common_util.events FOR INSERT
    WITH CHECK (
        core.get_clerk_user_id() IS NOT NULL AND
        organizer_id IN (SELECT id FROM core.profiles WHERE user_id = core.get_clerk_user_id())
    );

CREATE POLICY "Users can update own events"
    ON common_util.events FOR UPDATE
    USING (
        core.get_clerk_user_id() IS NOT NULL AND
        organizer_id IN (SELECT id FROM core.profiles WHERE user_id = core.get_clerk_user_id())
    );

CREATE POLICY "Users can delete own events"
    ON common_util.events FOR DELETE
    USING (
        core.get_clerk_user_id() IS NOT NULL AND
        organizer_id IN (SELECT id FROM core.profiles WHERE user_id = core.get_clerk_user_id())
    );

-- Event Participants: Users can view participants of events they can see
CREATE POLICY "Users can view event participants"
    ON common_util.event_participants FOR SELECT
    USING (
        core.get_clerk_user_id() IS NOT NULL AND
        EXISTS (
            SELECT 1 FROM common_util.events
            WHERE id = event_participants.event_id
            AND deleted_at IS NULL
            AND (
                organizer_id IN (SELECT id FROM core.profiles WHERE user_id = core.get_clerk_user_id()) OR
                EXISTS (
                    SELECT 1 FROM common_util.event_participants ep
                    WHERE ep.event_id = event_participants.event_id
                    AND ep.profile_id IN (SELECT id FROM core.profiles WHERE user_id = core.get_clerk_user_id())
                )
            )
        )
    );

CREATE POLICY "Users can manage event participants"
    ON common_util.event_participants FOR ALL
    USING (
        core.get_clerk_user_id() IS NOT NULL AND
        (
            EXISTS (
                SELECT 1 FROM common_util.events
                WHERE id = event_participants.event_id
                AND organizer_id IN (SELECT id FROM core.profiles WHERE user_id = core.get_clerk_user_id())
            ) OR
            profile_id IN (SELECT id FROM core.profiles WHERE user_id = core.get_clerk_user_id())
        )
    );

