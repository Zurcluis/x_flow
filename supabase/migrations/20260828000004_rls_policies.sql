-- Migration 000004: Row Level Security (RLS) e Isolamento Multi-Tenant

-- Habilitar RLS em todas as tabelas
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE b2b_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_customer_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_notes ENABLE ROW LEVEL SECURITY;

-- Helper Function para obter o organization_id da sessão ativa
CREATE OR REPLACE FUNCTION current_organization_id() RETURNS UUID AS $$
    SELECT (current_setting('app.current_organization_id', true))::UUID;
$$ LANGUAGE sql STABLE;

-- 1. Políticas para Organizações e Membros
CREATE POLICY org_isolation_memberships ON organization_memberships
    FOR ALL
    USING (organization_id = current_organization_id());

-- 2. Políticas para Clientes
CREATE POLICY org_isolation_customers ON customers
    FOR ALL
    USING (organization_id = current_organization_id());

CREATE POLICY org_isolation_contacts ON customer_contacts
    FOR ALL
    USING (customer_id IN (SELECT id FROM customers WHERE organization_id = current_organization_id()));

CREATE POLICY org_isolation_b2b ON b2b_accounts
    FOR ALL
    USING (customer_id IN (SELECT id FROM customers WHERE organization_id = current_organization_id()));

-- 3. Políticas para Viaturas e Histórico
CREATE POLICY org_isolation_vehicles ON vehicles
    FOR ALL
    USING (organization_id = current_organization_id());

CREATE POLICY org_isolation_vehicle_links ON vehicle_customer_links
    FOR ALL
    USING (organization_id = current_organization_id());

CREATE POLICY org_isolation_vehicle_notes ON vehicle_notes
    FOR ALL
    USING (vehicle_id IN (SELECT id FROM vehicles WHERE organization_id = current_organization_id()));
