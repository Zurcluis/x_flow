-- Migration 000018: Helper current_organization_id() null-safe
-- O RESET de uma GUC (ou set_config com string vazia) deixa o setting como ''
-- em vez de NULL. O cast direto (''::uuid) gera erro "invalid input syntax for
-- type uuid". Com NULLIF, um setting vazio devolve NULL e as políticas RLS
-- comparam NULL = organization_id → linha invisível (comportamento deny-by-default).

CREATE OR REPLACE FUNCTION current_organization_id() RETURNS UUID AS $$
    SELECT NULLIF(current_setting('app.current_organization_id', true), '')::UUID;
$$ LANGUAGE sql STABLE;
