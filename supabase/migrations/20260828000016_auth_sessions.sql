-- Migration 000016: Autenticação própria — credenciais em profiles, tabela de sessões e RLS
-- Contrato: hash scrypt no formato "scrypt:N:r:p:<saltHex>:<hashHex>" (N=16384, r=8, p=1,
-- keylen=64, salt=16 bytes). Token de sessão = 32 bytes base64url; na BD guardamos apenas
-- o SHA-256 hex (64 chars) em auth_sessions.token_hash.

-- 1. Credenciais em profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS password_hash TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;

-- 2. Backfill de auth_user_id para perfis criados antes da autenticação própria
UPDATE profiles SET auth_user_id = gen_random_uuid() WHERE auth_user_id IS NULL;

-- 3. Sessões de autenticação
CREATE TABLE IF NOT EXISTS auth_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    token_hash VARCHAR(64) UNIQUE NOT NULL,
    user_agent TEXT,
    ip_address VARCHAR(64),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    revoked_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_auth_sessions_profile_id ON auth_sessions (profile_id);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_expires_at ON auth_sessions (expires_at);

-- 4. RLS em auth_sessions: o fluxo de login consulta a tabela por token_hash antes de
--    existir contexto de organização/perfil — o hash do token é a própria credencial.
ALTER TABLE auth_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS auth_sessions_any ON auth_sessions;
CREATE POLICY auth_sessions_any ON auth_sessions FOR ALL USING (true);

-- 5. profiles: visível ao próprio perfil (GUC de sessão) ou durante o lookup de login
--    por email. GUCs não definidos devolvem NULL (missing_ok) → linha invisível.
DROP POLICY IF EXISTS profiles_self ON profiles;
CREATE POLICY profiles_self ON profiles
    FOR ALL
    USING (
        id::text = current_setting('app.current_profile_id', true)
        OR lower(email) = current_setting('app.auth_lookup_email', true)
    );

-- 6. Membros: pela organização ativa ou pelo próprio perfil (resolução de org no login)
DROP POLICY IF EXISTS memberships_org ON organization_memberships;
CREATE POLICY memberships_org ON organization_memberships
    FOR ALL
    USING (
        organization_id = current_organization_id()
        OR profile_id::text = current_setting('app.current_profile_id', true)
    );
