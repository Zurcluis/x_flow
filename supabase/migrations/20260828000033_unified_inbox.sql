-- Migration 000033: Caixa Unificada (Gmail + Instagram Direct)
-- Regista contas de canal, conversas (threads) e mensagens normalizadas com
-- isolamento estrito por organization_id e Row Level Security (RLS).

ALTER TABLE customers
    ADD COLUMN IF NOT EXISTS instagram_handle VARCHAR(100);

CREATE INDEX IF NOT EXISTS idx_customers_org_instagram
    ON customers (organization_id, lower(instagram_handle))
    WHERE instagram_handle IS NOT NULL;

CREATE TABLE IF NOT EXISTS inbox_channel_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    channel TEXT NOT NULL CHECK (channel IN ('gmail', 'instagram')),
    provider TEXT NOT NULL DEFAULT 'composio' CHECK (provider IN ('composio', 'oauth')),
    external_account_id TEXT NOT NULL CHECK (char_length(external_account_id) BETWEEN 1 AND 160),
    display_handle TEXT NOT NULL CHECK (char_length(display_handle) BETWEEN 1 AND 200),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'needs_reauth', 'paused')),
    sync_cursor JSONB NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(sync_cursor) = 'object'),
    last_synced_at TIMESTAMPTZ,
    last_error TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_inbox_channel_accounts_org_channel_ext UNIQUE (organization_id, channel, external_account_id)
);

CREATE TABLE IF NOT EXISTS inbox_threads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    channel_account_id UUID NOT NULL REFERENCES inbox_channel_accounts(id) ON DELETE CASCADE,
    channel TEXT NOT NULL CHECK (channel IN ('gmail', 'instagram')),
    external_thread_id TEXT NOT NULL CHECK (char_length(external_thread_id) BETWEEN 1 AND 255),
    participant_name TEXT,
    participant_handle TEXT,
    participant_external_id TEXT,
    subject TEXT,
    snippet TEXT,
    category TEXT NOT NULL DEFAULT 'other'
        CHECK (category IN ('lead', 'supplier', 'admin', 'hr', 'security', 'other')),
    status TEXT NOT NULL DEFAULT 'unread'
        CHECK (status IN ('unread', 'needs_reply', 'replied', 'converted', 'archived')),
    unread_count INTEGER NOT NULL DEFAULT 0 CHECK (unread_count >= 0),
    last_message_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_inbound_at TIMESTAMPTZ,
    last_outbound_at TIMESTAMPTZ,
    linked_customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    linked_vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
    linked_quote_id UUID REFERENCES quotes(id) ON DELETE SET NULL,
    ai_summary TEXT,
    ai_extracted_vehicle TEXT,
    ai_extracted_service TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_inbox_threads_org_channel_ext UNIQUE (organization_id, channel, external_thread_id)
);

CREATE INDEX IF NOT EXISTS idx_inbox_threads_org_last_msg
    ON inbox_threads (organization_id, last_message_at DESC);

CREATE INDEX IF NOT EXISTS idx_inbox_threads_org_status
    ON inbox_threads (organization_id, status, last_message_at DESC);

CREATE INDEX IF NOT EXISTS idx_inbox_threads_org_customer
    ON inbox_threads (organization_id, linked_customer_id)
    WHERE linked_customer_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS inbox_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    thread_id UUID NOT NULL REFERENCES inbox_threads(id) ON DELETE CASCADE,
    external_message_id TEXT NOT NULL CHECK (char_length(external_message_id) BETWEEN 1 AND 320),
    direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
    sender_name TEXT,
    sender_handle TEXT,
    recipient_handle TEXT,
    body_text TEXT NOT NULL DEFAULT '',
    body_html_sanitized TEXT,
    attachments JSONB NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(attachments) = 'array'),
    sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    sent_by_profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_inbox_messages_org_ext UNIQUE (organization_id, external_message_id)
);

CREATE INDEX IF NOT EXISTS idx_inbox_messages_thread_sent
    ON inbox_messages (thread_id, sent_at ASC);

ALTER TABLE inbox_channel_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE inbox_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE inbox_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS org_isolation_inbox_channel_accounts ON inbox_channel_accounts;
CREATE POLICY org_isolation_inbox_channel_accounts ON inbox_channel_accounts
    FOR ALL
    USING (organization_id = current_organization_id())
    WITH CHECK (organization_id = current_organization_id());

DROP POLICY IF EXISTS org_isolation_inbox_threads ON inbox_threads;
CREATE POLICY org_isolation_inbox_threads ON inbox_threads
    FOR ALL
    USING (organization_id = current_organization_id())
    WITH CHECK (organization_id = current_organization_id());

DROP POLICY IF EXISTS org_isolation_inbox_messages ON inbox_messages;
CREATE POLICY org_isolation_inbox_messages ON inbox_messages
    FOR ALL
    USING (organization_id = current_organization_id())
    WITH CHECK (organization_id = current_organization_id());

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'xflow_app') THEN
        EXECUTE 'GRANT SELECT, INSERT, UPDATE, DELETE ON inbox_channel_accounts TO xflow_app';
        EXECUTE 'GRANT SELECT, INSERT, UPDATE, DELETE ON inbox_threads TO xflow_app';
        EXECUTE 'GRANT SELECT, INSERT, UPDATE, DELETE ON inbox_messages TO xflow_app';
    END IF;
END $$;
