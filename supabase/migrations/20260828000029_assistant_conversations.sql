-- Migration 000029: histórico de conversas do assistente X-Flow.
-- Cada conversa pertence a um perfil e a uma organização; as mensagens guardam
-- apenas o texto e as referências mostradas (sem áudio nem dados internos extra).

CREATE TABLE IF NOT EXISTS assistant_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL CHECK (char_length(title) BETWEEN 1 AND 160),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_assistant_conversations_owner
    ON assistant_conversations (organization_id, profile_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS assistant_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES assistant_conversations(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL CHECK (char_length(content) BETWEEN 1 AND 4000),
    references_json JSONB NOT NULL DEFAULT '[]'::jsonb
        CHECK (jsonb_typeof(references_json) = 'array'),
    engine TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_assistant_messages_conversation
    ON assistant_messages (conversation_id, created_at);

ALTER TABLE assistant_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE assistant_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS assistant_conversations_owner ON assistant_conversations;
CREATE POLICY assistant_conversations_owner ON assistant_conversations
    FOR ALL
    USING (
        organization_id = current_organization_id()
        AND profile_id::text = current_setting('app.current_profile_id', true)
    )
    WITH CHECK (
        organization_id = current_organization_id()
        AND profile_id::text = current_setting('app.current_profile_id', true)
    );

DROP POLICY IF EXISTS assistant_messages_owner ON assistant_messages;
CREATE POLICY assistant_messages_owner ON assistant_messages
    FOR ALL
    USING (
        organization_id = current_organization_id()
        AND EXISTS (
            SELECT 1
            FROM assistant_conversations c
            WHERE c.id = assistant_messages.conversation_id
              AND c.profile_id::text = current_setting('app.current_profile_id', true)
        )
    )
    WITH CHECK (
        organization_id = current_organization_id()
        AND EXISTS (
            SELECT 1
            FROM assistant_conversations c
            WHERE c.id = assistant_messages.conversation_id
              AND c.profile_id::text = current_setting('app.current_profile_id', true)
        )
    );

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'xflow_app') THEN
        EXECUTE 'GRANT SELECT, INSERT, UPDATE, DELETE ON assistant_conversations TO xflow_app';
        EXECUTE 'GRANT SELECT, INSERT, UPDATE, DELETE ON assistant_messages TO xflow_app';
    END IF;
END $$;
