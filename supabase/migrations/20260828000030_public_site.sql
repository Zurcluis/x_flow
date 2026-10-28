-- Migration 000030: site publico. Os pedidos do formulario entram apenas como
-- leads; nao criam clientes, viaturas ou orcamentos automaticamente.

CREATE TABLE IF NOT EXISTS website_leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    reference TEXT NOT NULL UNIQUE,
    idempotency_key TEXT NOT NULL CHECK (char_length(idempotency_key) BETWEEN 1 AND 100),
    service_requested TEXT NOT NULL CHECK (
        service_requested IN ('advice', 'ppf', 'car_wrap', 'color_ppf', 'details', 'motorcycle')
    ),
    vehicle_info TEXT NOT NULL CHECK (char_length(vehicle_info) BETWEEN 2 AND 160),
    customer_name TEXT NOT NULL CHECK (char_length(customer_name) BETWEEN 2 AND 100),
    customer_email TEXT NOT NULL CHECK (char_length(customer_email) BETWEEN 3 AND 200),
    customer_phone TEXT CHECK (customer_phone IS NULL OR char_length(customer_phone) <= 30),
    message TEXT CHECK (message IS NULL OR char_length(message) <= 2000),
    status TEXT NOT NULL DEFAULT 'new' CHECK (
        status IN ('new', 'contacted', 'qualified', 'quoted', 'won', 'lost', 'spam', 'duplicate')
    ),
    source TEXT NOT NULL DEFAULT 'website',
    utm JSONB,
    privacy_notice_version TEXT NOT NULL,
    consent_at TIMESTAMPTZ NOT NULL,
    consent_text_hash TEXT,
    marketing_opt_in BOOLEAN NOT NULL DEFAULT FALSE,
    first_response_at TIMESTAMPTZ,
    quote_value_cents INTEGER CHECK (quote_value_cents IS NULL OR quote_value_cents >= 0),
    lost_reason TEXT,
    notes TEXT,
    converted_customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    converted_vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
    converted_quote_id UUID REFERENCES quotes(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_website_leads_idempotency UNIQUE (organization_id, idempotency_key)
);

CREATE INDEX IF NOT EXISTS idx_website_leads_org_created
    ON website_leads (organization_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_website_leads_status
    ON website_leads (organization_id, status, created_at DESC);

ALTER TABLE website_leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS website_leads_org ON website_leads;
CREATE POLICY website_leads_org ON website_leads
    FOR ALL
    USING (organization_id = current_organization_id())
    WITH CHECK (organization_id = current_organization_id());

-- Contadores duraveis do endpoint publico. O bucket contem apenas um hash
-- (IP + segredo), nunca o IP em texto simples.
CREATE TABLE IF NOT EXISTS api_rate_limits (
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    bucket TEXT NOT NULL CHECK (char_length(bucket) BETWEEN 1 AND 200),
    window_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    count INTEGER NOT NULL DEFAULT 0 CHECK (count >= 0),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (organization_id, bucket)
);

CREATE INDEX IF NOT EXISTS idx_api_rate_limits_updated
    ON api_rate_limits (updated_at);

ALTER TABLE api_rate_limits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS api_rate_limits_org ON api_rate_limits;
CREATE POLICY api_rate_limits_org ON api_rate_limits
    FOR ALL
    USING (organization_id = current_organization_id())
    WITH CHECK (organization_id = current_organization_id());

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'xflow_app') THEN
        EXECUTE 'GRANT SELECT, INSERT, UPDATE, DELETE ON website_leads TO xflow_app';
        EXECUTE 'GRANT SELECT, INSERT, UPDATE, DELETE ON api_rate_limits TO xflow_app';
    END IF;
END $$;
