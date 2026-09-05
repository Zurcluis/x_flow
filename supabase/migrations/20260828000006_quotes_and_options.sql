-- Migration 000006: Orçamentos, Opções e Eventos

-- 1. Orçamentos
CREATE TABLE IF NOT EXISTS quotes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    quote_number VARCHAR(50) NOT NULL,
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    version INTEGER DEFAULT 1,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'viewed', 'approved', 'rejected', 'expired')),
    selected_option_id UUID,
    public_token VARCHAR(100) UNIQUE NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    notes TEXT,
    created_by UUID REFERENCES profiles(id),
    approved_at TIMESTAMPTZ,
    approved_by_name VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (organization_id, quote_number)
);

CREATE INDEX IF NOT EXISTS idx_quotes_public_token ON quotes (public_token);
CREATE INDEX IF NOT EXISTS idx_quotes_vehicle ON quotes (vehicle_id);
CREATE INDEX IF NOT EXISTS idx_quotes_customer ON quotes (customer_id);

-- 2. Opções do Orçamento (Multi-Tier)
CREATE TABLE IF NOT EXISTS quote_options (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quote_id UUID NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
    tier VARCHAR(20) NOT NULL CHECK (tier IN ('essential', 'recommended', 'premium')),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_recommended BOOLEAN DEFAULT FALSE,
    warranty_years INTEGER DEFAULT 5,
    subtotal NUMERIC(10,2) NOT NULL,
    discount_rate NUMERIC(5,2) DEFAULT 0.00,
    discount_amount NUMERIC(10,2) DEFAULT 0.00,
    taxable_base NUMERIC(10,2) NOT NULL,
    vat_rate NUMERIC(4,2) DEFAULT 0.23,
    vat_amount NUMERIC(10,2) NOT NULL,
    total_with_vat NUMERIC(10,2) NOT NULL,
    estimated_cost NUMERIC(10,2) NOT NULL,
    estimated_margin_amount NUMERIC(10,2) NOT NULL,
    estimated_margin_percentage NUMERIC(5,2) NOT NULL,
    estimated_hours NUMERIC(6,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Itens das Opções
CREATE TABLE IF NOT EXISTS quote_option_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quote_option_id UUID NOT NULL REFERENCES quote_options(id) ON DELETE CASCADE,
    service_name VARCHAR(255) NOT NULL,
    body_part_code VARCHAR(100) NOT NULL,
    body_part_name VARCHAR(255) NOT NULL,
    material_name VARCHAR(255) NOT NULL,
    area_m2 NUMERIC(6,2) NOT NULL,
    labor_hours NUMERIC(6,2) NOT NULL,
    unit_price NUMERIC(10,2) NOT NULL,
    total_price NUMERIC(10,2) NOT NULL
);

-- 4. Eventos e Auditoria do Orçamento
CREATE TABLE IF NOT EXISTS quote_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quote_id UUID NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('created', 'sent_whatsapp', 'sent_email', 'viewed_by_client', 'option_selected', 'approved', 'rejected')),
    description TEXT NOT NULL,
    author_name VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_option_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY org_isolation_quotes ON quotes FOR ALL USING (organization_id = current_organization_id());
CREATE POLICY org_isolation_quote_options ON quote_options FOR ALL USING (quote_id IN (SELECT id FROM quotes WHERE organization_id = current_organization_id()));
CREATE POLICY org_isolation_quote_items ON quote_option_items FOR ALL USING (quote_option_id IN (SELECT id FROM quote_options WHERE quote_id IN (SELECT id FROM quotes WHERE organization_id = current_organization_id())));
CREATE POLICY org_isolation_quote_events ON quote_events FOR ALL USING (quote_id IN (SELECT id FROM quotes WHERE organization_id = current_organization_id()));
