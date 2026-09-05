-- Migration 000010: Entregas, Faturação e Garantias Digitais

-- 1. Faturas & Documentos Financeiros
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL,
    invoice_number VARCHAR(50) NOT NULL UNIQUE,
    work_order_id UUID REFERENCES work_orders(id),
    quote_id UUID REFERENCES quotes(id),
    customer_id UUID NOT NULL REFERENCES customers(id),
    customer_name VARCHAR(150) NOT NULL,
    customer_nif VARCHAR(20) NOT NULL,
    vehicle_plate VARCHAR(20) NOT NULL,
    vehicle_model VARCHAR(100) NOT NULL,
    subtotal NUMERIC(10,2) NOT NULL,
    vat_rate NUMERIC(5,2) DEFAULT 23.00,
    vat_amount NUMERIC(10,2) NOT NULL,
    total_amount NUMERIC(10,2) NOT NULL,
    payment_method VARCHAR(50) DEFAULT 'bank_transfer',
    payment_status VARCHAR(20) DEFAULT 'paid' CHECK (payment_status IN ('paid', 'pending', 'overdue', 'cancelled')),
    issued_at TIMESTAMPTZ DEFAULT NOW(),
    due_at TIMESTAMPTZ DEFAULT NOW(),
    paid_at TIMESTAMPTZ
);

-- 2. Linhas de Fatura
CREATE TABLE IF NOT EXISTS invoice_lines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    description VARCHAR(255) NOT NULL,
    quantity NUMERIC(6,2) DEFAULT 1.00,
    unit_price NUMERIC(10,2) NOT NULL,
    vat_rate NUMERIC(5,2) DEFAULT 23.00,
    line_total NUMERIC(10,2) NOT NULL
);

-- 3. Entregas de Viaturas e Levantamentos
CREATE TABLE IF NOT EXISTS deliveries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL,
    work_order_id UUID NOT NULL REFERENCES work_orders(id),
    vehicle_id UUID NOT NULL REFERENCES vehicles(id),
    customer_id UUID NOT NULL REFERENCES customers(id),
    delivered_by_name VARCHAR(100) NOT NULL,
    receiver_name VARCHAR(100) NOT NULL,
    receiver_id_document VARCHAR(50),
    signature_data_url TEXT,
    belongings_returned_confirmed BOOLEAN DEFAULT TRUE,
    notes TEXT,
    delivered_at TIMESTAMPTZ DEFAULT NOW(),
    token VARCHAR(100) UNIQUE NOT NULL
);

-- 4. Garantias Digitais Ativas
CREATE TABLE IF NOT EXISTS warranties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL,
    vehicle_id UUID NOT NULL REFERENCES vehicles(id),
    customer_id UUID NOT NULL REFERENCES customers(id),
    work_order_id UUID NOT NULL REFERENCES work_orders(id),
    material_name VARCHAR(150) NOT NULL,
    batch_number VARCHAR(100) NOT NULL,
    warranty_years INTEGER DEFAULT 10,
    certificate_number VARCHAR(100) UNIQUE NOT NULL,
    qc_certificate_number VARCHAR(100) NOT NULL,
    terms_text TEXT,
    maintenance_guide_json JSONB,
    starts_at DATE NOT NULL,
    expires_at DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'expired', 'revoked')),
    token VARCHAR(100) UNIQUE NOT NULL
);

-- RLS
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE warranties ENABLE ROW LEVEL SECURITY;

CREATE POLICY org_isolation_invoices ON invoices FOR ALL USING (organization_id = current_organization_id());
CREATE POLICY org_isolation_deliveries ON deliveries FOR ALL USING (organization_id = current_organization_id());
CREATE POLICY org_isolation_warranties ON warranties FOR ALL USING (organization_id = current_organization_id());
