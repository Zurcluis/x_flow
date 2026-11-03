-- Migration 000032: Operações Go-Live (Sinal em Orçamentos, Movimentos/Retalhos/Encomendas de Stock e Pós-Venda)

-- 1. Colunas de Sinal na tabela quotes
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS deposit_required BOOLEAN DEFAULT FALSE;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS deposit_percentage NUMERIC(5,2) DEFAULT 30.00;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS deposit_amount NUMERIC(10,2) DEFAULT 0.00;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS deposit_status VARCHAR(20) DEFAULT 'not_required'
    CHECK (deposit_status IN ('not_required', 'pending', 'paid'));
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS deposit_paid_at TIMESTAMPTZ;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS deposit_payment_method VARCHAR(50);

-- 2. Movimentos de Stock (entradas, cortes por metro, desperdício, retalhos)
CREATE TABLE IF NOT EXISTS material_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    material_id UUID NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
    batch_id UUID REFERENCES material_batches(id) ON DELETE SET NULL,
    work_order_id UUID REFERENCES work_orders(id) ON DELETE SET NULL,
    movement_type VARCHAR(30) NOT NULL CHECK (movement_type IN ('entry', 'cut', 'waste', 'adjustment', 'remnant_created', 'remnant_used')),
    meters NUMERIC(10,2) NOT NULL,
    notes TEXT,
    author_name VARCHAR(150),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_material_movements_org_created ON material_movements (organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_material_movements_material ON material_movements (material_id);

-- 3. Gestão de Retalhos Aproveitáveis (sobras úteis com medidas, película e localização)
CREATE TABLE IF NOT EXISTS material_remnants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    material_id UUID NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
    batch_number VARCHAR(100),
    width_cm INTEGER NOT NULL CHECK (width_cm > 0),
    length_cm INTEGER NOT NULL CHECK (length_cm > 0),
    location VARCHAR(150) NOT NULL DEFAULT 'Estante de Retalhos',
    status VARCHAR(20) NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'used', 'discarded')),
    used_work_order_id UUID REFERENCES work_orders(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    used_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_material_remnants_org_status ON material_remnants (organization_id, status);
CREATE INDEX IF NOT EXISTS idx_material_remnants_material ON material_remnants (material_id);

-- 4. Encomendas a Fornecedores (envio WhatsApp / Email e receção de lotes)
CREATE TABLE IF NOT EXISTS purchase_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    order_number VARCHAR(50) NOT NULL,
    supplier_name VARCHAR(255) NOT NULL,
    supplier_phone VARCHAR(60),
    supplier_email VARCHAR(255),
    material_id UUID REFERENCES materials(id) ON DELETE SET NULL,
    material_name VARCHAR(255) NOT NULL,
    quantity_rolls INTEGER NOT NULL DEFAULT 1 CHECK (quantity_rolls > 0),
    meters_per_roll NUMERIC(10,2) NOT NULL DEFAULT 15.00 CHECK (meters_per_roll > 0),
    estimated_cost NUMERIC(10,2),
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'received', 'cancelled')),
    sent_via VARCHAR(30),
    notes TEXT,
    sent_at TIMESTAMPTZ,
    received_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (organization_id, order_number)
);

CREATE INDEX IF NOT EXISTS idx_purchase_orders_org_status ON purchase_orders (organization_id, status, created_at DESC);

-- 5. Pós-Venda e Satisfação na tabela deliveries (Inquérito, Google Review, D+7 e D+30)
ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS satisfaction_rating INTEGER CHECK (satisfaction_rating BETWEEN 1 AND 5);
ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS satisfaction_comment TEXT;
ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS satisfaction_submitted_at TIMESTAMPTZ;
ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS google_review_clicked BOOLEAN DEFAULT FALSE;
ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS followup_d7_sent_at TIMESTAMPTZ;
ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS review_d30_scheduled_at TIMESTAMPTZ;
ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS review_d30_completed_at TIMESTAMPTZ;
ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS review_d30_notes TEXT;

-- 6. Row Level Security (RLS)
ALTER TABLE material_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE material_remnants ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS org_isolation_material_movements ON material_movements;
CREATE POLICY org_isolation_material_movements ON material_movements
    FOR ALL
    USING (organization_id = current_organization_id())
    WITH CHECK (organization_id = current_organization_id());

DROP POLICY IF EXISTS org_isolation_material_remnants ON material_remnants;
CREATE POLICY org_isolation_material_remnants ON material_remnants
    FOR ALL
    USING (organization_id = current_organization_id())
    WITH CHECK (organization_id = current_organization_id());

DROP POLICY IF EXISTS org_isolation_purchase_orders ON purchase_orders;
CREATE POLICY org_isolation_purchase_orders ON purchase_orders
    FOR ALL
    USING (organization_id = current_organization_id())
    WITH CHECK (organization_id = current_organization_id());

-- Permitir leitura das organization_settings também em fluxos públicos por token (orçamento público e feedback de entrega)
DROP POLICY IF EXISTS org_isolation_organization_settings ON organization_settings;
CREATE POLICY org_isolation_organization_settings ON organization_settings
    FOR ALL
    USING (
        organization_id = current_organization_id()
        OR organization_id IN (
            SELECT q.organization_id FROM quotes q WHERE q.public_token = current_setting('app.public_token', true)
            UNION
            SELECT d.organization_id FROM deliveries d WHERE d.token = current_setting('app.public_token', true)
        )
    )
    WITH CHECK (organization_id = current_organization_id());

-- 7. Grants explícitos ao role da aplicação (xflow_app)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'xflow_app') THEN
        GRANT SELECT, INSERT, UPDATE, DELETE ON material_movements TO xflow_app;
        GRANT SELECT, INSERT, UPDATE, DELETE ON material_remnants TO xflow_app;
        GRANT SELECT, INSERT, UPDATE, DELETE ON purchase_orders TO xflow_app;
        GRANT SELECT, INSERT, UPDATE, DELETE ON organization_settings TO xflow_app;
    END IF;
END $$;

