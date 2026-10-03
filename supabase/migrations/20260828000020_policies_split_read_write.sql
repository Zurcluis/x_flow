-- Migration 000020: separação leitura/escrita em profiles e organization_memberships
-- Com FOR ALL, o USING serve também de WITH CHECK: um membro podia ALTERAR
-- (ou inserir/apagar) perfis e memberships da org — incl. a própria role.
-- Agora: leitura ampla (org/próprio/lookup), escrita restrita.

-- 1. profiles: leitura por membro da org, pelo próprio, ou lookup de login
DROP POLICY IF EXISTS profiles_self ON profiles;
CREATE POLICY profiles_read ON profiles
    FOR SELECT
    USING (
        id::text = current_setting('app.current_profile_id', true)
        OR lower(email) = current_setting('app.auth_lookup_email', true)
        OR EXISTS (
            SELECT 1
            FROM organization_memberships m
            WHERE m.organization_id = current_organization_id()
              AND m.profile_id = profiles.id
        )
    );

-- Escrita em profiles: só o próprio perfil (last_login_at no login)
DROP POLICY IF EXISTS profiles_write_self ON profiles;
CREATE POLICY profiles_write_self ON profiles
    FOR UPDATE
    USING (id::text = current_setting('app.current_profile_id', true))
    WITH CHECK (id::text = current_setting('app.current_profile_id', true));

-- 2. organization_memberships: leitura pela org ou pelo próprio; escrita só org-strict
DROP POLICY IF EXISTS memberships_org ON organization_memberships;
DROP POLICY IF EXISTS org_isolation_memberships ON organization_memberships;

CREATE POLICY memberships_read ON organization_memberships
    FOR SELECT
    USING (
        organization_id = current_organization_id()
        OR profile_id::text = current_setting('app.current_profile_id', true)
    );

CREATE POLICY memberships_org_write ON organization_memberships
    FOR ALL
    USING (organization_id = current_organization_id())
    WITH CHECK (organization_id = current_organization_id());
