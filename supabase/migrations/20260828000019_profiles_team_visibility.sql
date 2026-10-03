-- Migration 000019: perfis da equipa visíveis aos membros da organização
-- O join em profiles (nomes de técnicos no dashboard, agenda, check-ins, B2B)
-- corre com o GUC da organização fixado no pool, sem o GUC do perfil ativo.
-- Com a política anterior, essas linhas ficavam invisíveis (nome a NULL).
-- Um membro da organização passa a ver os perfis da própria equipa.

DROP POLICY IF EXISTS profiles_self ON profiles;
CREATE POLICY profiles_self ON profiles
    FOR ALL
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
