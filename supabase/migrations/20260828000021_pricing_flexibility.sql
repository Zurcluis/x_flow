-- Migration 000021: Preços flexíveis — políticas, rubricas, fórmulas, kits, fornecedores, linhas de custo e snapshots

-- 1. Tabelas

-- 1.1 Políticas de preços
CREATE TABLE IF NOT EXISTS pricing_policies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    version INTEGER NOT NULL,
    method VARCHAR(10) NOT NULL DEFAULT 'manual' CHECK (method IN ('manual', 'monthly')),
    manual_daily_expenses NUMERIC(12,2) NOT NULL DEFAULT 172.00,
    daily_capacity_hours NUMERIC(5,2) NOT NULL DEFAULT 8.00,
    profit_daily_target NUMERIC(12,2) NOT NULL DEFAULT 200.00,
    spot_surcharge_per_hour NUMERIC(12,2) NOT NULL DEFAULT 25.00,
    productive_days_per_month INTEGER,
    sublet_fee_percent NUMERIC(5,2) NOT NULL DEFAULT 15.00,
    waste_rate_percent NUMERIC(5,2) NOT NULL DEFAULT 15.00,
    vat_rate NUMERIC(4,2) NOT NULL DEFAULT 23.00,
    status VARCHAR(10) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived')),
    effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
    published_at TIMESTAMPTZ,
    published_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (organization_id, version)
);

-- 1.2 Rubricas de despesa
CREATE TABLE IF NOT EXISTS pricing_expense_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    version INTEGER NOT NULL DEFAULT 1,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    category VARCHAR(20) NOT NULL CHECK (category IN ('operational', 'acquisition')),
    kind VARCHAR(20) NOT NULL CHECK (kind IN ('expense', 'provision', 'reserve', 'cash_recovery')),
    amount NUMERIC(12,2) NOT NULL,
    periodicity VARCHAR(10) NOT NULL DEFAULT 'monthly' CHECK (periodicity IN ('monthly', 'yearly')),
    monthly_equivalent NUMERIC(12,2) NOT NULL,
    included_in_pricing BOOLEAN NOT NULL DEFAULT TRUE,
    includes_personnel BOOLEAN NOT NULL DEFAULT FALSE,
    source VARCHAR(200),
    validation_state VARCHAR(20) NOT NULL DEFAULT 'estimated' CHECK (validation_state IN ('estimated', 'validated', 'needs_breakdown')),
    effective_from DATE NOT NULL,
    effective_to DATE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pricing_expense_items_org_effective_from ON pricing_expense_items (organization_id, effective_from);
CREATE INDEX IF NOT EXISTS idx_pricing_expense_items_org_category ON pricing_expense_items (organization_id, category);

-- 1.3 Fórmulas de pricing
CREATE TABLE IF NOT EXISTS pricing_formulas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    code VARCHAR(20) NOT NULL CHECK (code IN ('complete', 'spot', 'custom')),
    name VARCHAR(120) NOT NULL,
    description TEXT,
    is_archived BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (organization_id, code)
);

-- 1.4 Versões de fórmula
CREATE TABLE IF NOT EXISTS pricing_formula_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    formula_id UUID NOT NULL REFERENCES pricing_formulas(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    version INTEGER NOT NULL,
    components JSONB NOT NULL,
    status VARCHAR(10) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
    published_at TIMESTAMPTZ,
    published_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.5 Fornecedores
CREATE TABLE IF NOT EXISTS suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    phone VARCHAR(50),
    email VARCHAR(200),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.6 Serviços de fornecedores (subcontratados)
CREATE TABLE IF NOT EXISTS supplier_services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    service_name VARCHAR(200) NOT NULL,
    base_price NUMERIC(12,2) NOT NULL,
    replaced_phase_key VARCHAR(80),
    phase_hours NUMERIC(6,2),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.7 Kits de consumíveis
CREATE TABLE IF NOT EXISTS consumable_kits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    code VARCHAR(80) NOT NULL,
    name VARCHAR(200) NOT NULL,
    kind VARCHAR(20) NOT NULL CHECK (kind IN ('spot', 'ppf_front', 'wrap_full', 'custom')),
    price NUMERIC(12,2) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (organization_id, code)
);

-- 1.8 Linhas de serviço de orçamentos flexíveis
CREATE TABLE IF NOT EXISTS quote_service_lines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quote_option_id UUID NOT NULL REFERENCES quote_options(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    mode VARCHAR(10) NOT NULL CHECK (mode IN ('complete', 'spot')),
    hours NUMERIC(6,2) NOT NULL,
    notes TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.9 Linhas de custo de orçamentos flexíveis
CREATE TABLE IF NOT EXISTS quote_cost_lines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quote_option_id UUID NOT NULL REFERENCES quote_options(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    line_type VARCHAR(20) NOT NULL CHECK (line_type IN ('material', 'consumable_kit', 'sublet', 'extra')),
    name VARCHAR(200) NOT NULL,
    quantity NUMERIC(12,3) NOT NULL DEFAULT 1,
    unit VARCHAR(20) NOT NULL DEFAULT 'unit' CHECK (unit IN ('linear_meter', 'm2', 'unit', 'package')),
    unit_cost NUMERIC(12,2) NOT NULL DEFAULT 0,
    waste_rate_percent NUMERIC(5,2) NOT NULL DEFAULT 0,
    total_cost NUMERIC(12,2) NOT NULL DEFAULT 0,
    kit_id UUID REFERENCES consumable_kits(id),
    supplier_service_id UUID REFERENCES supplier_services(id),
    material_id UUID REFERENCES materials(id),
    deducted_hours NUMERIC(6,2) NOT NULL DEFAULT 0,
    notes TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quote_cost_lines_option ON quote_cost_lines (quote_option_id);
CREATE INDEX IF NOT EXISTS idx_quote_cost_lines_org ON quote_cost_lines (organization_id);

-- 1.10 Snapshots de pricing (imutáveis)
CREATE TABLE IF NOT EXISTS quote_pricing_snapshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    quote_id UUID NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
    quote_option_id UUID NOT NULL REFERENCES quote_options(id) ON DELETE CASCADE,
    revision INTEGER NOT NULL,
    policy_id UUID,
    policy_version INTEGER,
    formula_version_id UUID,
    payload JSONB NOT NULL,
    suggested_price NUMERIC(12,2),
    manual_price NUMERIC(12,2),
    adjust_kind VARCHAR(30),
    adjust_value NUMERIC(12,2),
    price_before_vat NUMERIC(12,2),
    vat_rate NUMERIC(4,2),
    vat_amount NUMERIC(12,2),
    total_with_vat NUMERIC(12,2),
    schema_version INTEGER NOT NULL DEFAULT 1,
    created_by UUID REFERENCES profiles(id),
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (quote_option_id, revision)
);

CREATE INDEX IF NOT EXISTS idx_quote_pricing_snapshots_org_created_at ON quote_pricing_snapshots (organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_quote_pricing_snapshots_quote ON quote_pricing_snapshots (quote_id);

-- 2. Imutabilidade do snapshot (append-only)
-- UPDATE nunca; DELETE só permitido quando a proposta-mãe ainda é rascunho
-- (a edição de rascunho recria as opções em cascata; o histórico enviado/aprovado fica intacto)
CREATE OR REPLACE FUNCTION prevent_quote_pricing_snapshot_mutation() RETURNS trigger AS $$
DECLARE
  v_quote_status TEXT;
BEGIN
  IF TG_OP = 'UPDATE' THEN
    RAISE EXCEPTION 'quote_pricing_snapshots é imutável (append-only).';
  END IF;
  SELECT status INTO v_quote_status FROM quotes WHERE id = OLD.quote_id;
  IF v_quote_status IS DISTINCT FROM 'draft' THEN
    RAISE EXCEPTION 'O snapshot de propostas enviadas/aprovadas não pode ser eliminado.';
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_snapshot_immutable ON quote_pricing_snapshots;
CREATE TRIGGER trg_snapshot_immutable
  BEFORE UPDATE OR DELETE ON quote_pricing_snapshots
  FOR EACH ROW EXECUTE FUNCTION prevent_quote_pricing_snapshot_mutation();

-- 3. RLS
ALTER TABLE pricing_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_expense_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_formulas ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_formula_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE consumable_kits ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_service_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_cost_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_pricing_snapshots ENABLE ROW LEVEL SECURITY;

-- Políticas simples por organization_id
DROP POLICY IF EXISTS org_isolation_pricing_policies ON pricing_policies;
CREATE POLICY org_isolation_pricing_policies ON pricing_policies
    FOR ALL
    USING (organization_id = current_organization_id())
    WITH CHECK (organization_id = current_organization_id());

DROP POLICY IF EXISTS org_isolation_pricing_expense_items ON pricing_expense_items;
CREATE POLICY org_isolation_pricing_expense_items ON pricing_expense_items
    FOR ALL
    USING (organization_id = current_organization_id())
    WITH CHECK (organization_id = current_organization_id());

DROP POLICY IF EXISTS org_isolation_pricing_formulas ON pricing_formulas;
CREATE POLICY org_isolation_pricing_formulas ON pricing_formulas
    FOR ALL
    USING (organization_id = current_organization_id())
    WITH CHECK (organization_id = current_organization_id());

DROP POLICY IF EXISTS org_isolation_pricing_formula_versions ON pricing_formula_versions;
CREATE POLICY org_isolation_pricing_formula_versions ON pricing_formula_versions
    FOR ALL
    USING (organization_id = current_organization_id())
    WITH CHECK (organization_id = current_organization_id());

DROP POLICY IF EXISTS org_isolation_suppliers ON suppliers;
CREATE POLICY org_isolation_suppliers ON suppliers
    FOR ALL
    USING (organization_id = current_organization_id())
    WITH CHECK (organization_id = current_organization_id());

DROP POLICY IF EXISTS org_isolation_supplier_services ON supplier_services;
CREATE POLICY org_isolation_supplier_services ON supplier_services
    FOR ALL
    USING (organization_id = current_organization_id())
    WITH CHECK (organization_id = current_organization_id());

DROP POLICY IF EXISTS org_isolation_consumable_kits ON consumable_kits;
CREATE POLICY org_isolation_consumable_kits ON consumable_kits
    FOR ALL
    USING (organization_id = current_organization_id())
    WITH CHECK (organization_id = current_organization_id());

-- Linhas de orçamento: organização OU token público do pai (padrão 000017)
DROP POLICY IF EXISTS org_isolation_quote_service_lines ON quote_service_lines;
CREATE POLICY org_isolation_quote_service_lines ON quote_service_lines
    FOR ALL
    USING (
        organization_id = current_organization_id()
        OR quote_option_id IN (
            SELECT qo.id FROM quote_options qo
            JOIN quotes q ON q.id = qo.quote_id
            WHERE q.organization_id = current_organization_id()
               OR q.public_token = current_setting('app.public_token', true)
        )
    )
    WITH CHECK (
        organization_id = current_organization_id()
        OR quote_option_id IN (
            SELECT qo.id FROM quote_options qo
            JOIN quotes q ON q.id = qo.quote_id
            WHERE q.organization_id = current_organization_id()
               OR q.public_token = current_setting('app.public_token', true)
        )
    );

DROP POLICY IF EXISTS org_isolation_quote_cost_lines ON quote_cost_lines;
CREATE POLICY org_isolation_quote_cost_lines ON quote_cost_lines
    FOR ALL
    USING (
        organization_id = current_organization_id()
        OR quote_option_id IN (
            SELECT qo.id FROM quote_options qo
            JOIN quotes q ON q.id = qo.quote_id
            WHERE q.organization_id = current_organization_id()
               OR q.public_token = current_setting('app.public_token', true)
        )
    )
    WITH CHECK (
        organization_id = current_organization_id()
        OR quote_option_id IN (
            SELECT qo.id FROM quote_options qo
            JOIN quotes q ON q.id = qo.quote_id
            WHERE q.organization_id = current_organization_id()
               OR q.public_token = current_setting('app.public_token', true)
        )
    );

-- Snapshots: apenas SELECT e INSERT pela organização; sem UPDATE/DELETE (imutável, deny-by-default)
DROP POLICY IF EXISTS org_isolation_quote_pricing_snapshots_read ON quote_pricing_snapshots;
CREATE POLICY org_isolation_quote_pricing_snapshots_read ON quote_pricing_snapshots
    FOR SELECT
    USING (organization_id = current_organization_id());

DROP POLICY IF EXISTS org_isolation_quote_pricing_snapshots_insert ON quote_pricing_snapshots;
CREATE POLICY org_isolation_quote_pricing_snapshots_insert ON quote_pricing_snapshots
    FOR INSERT
    WITH CHECK (organization_id = current_organization_id());

-- 4. Seeds condicionais (idempotentes; apenas a organização 'x-motion')

-- 4.1 Rubricas iniciais (só se a organização não tiver nenhuma rubrica)
INSERT INTO pricing_expense_items (organization_id, version, name, description, category, kind, amount, periodicity, monthly_equivalent, included_in_pricing, includes_personnel, source, validation_state, effective_from)
SELECT o.id, 1, 'Remuneração e encargos', 'Salário bruto de referência de 920 €, contribuição patronal e provisão para subsídios de férias e Natal', 'operational', 'expense', 1328.25, 'monthly', 1328.25, TRUE, TRUE, 'Orçamento inicial — valores fornecidos pelo Luís', 'estimated', CURRENT_DATE
FROM organizations o
WHERE o.slug = 'x-motion'
  AND NOT EXISTS (SELECT 1 FROM pricing_expense_items pei WHERE pei.organization_id = o.id AND pei.name = 'Remuneração e encargos');

INSERT INTO pricing_expense_items (organization_id, version, name, description, category, kind, amount, periodicity, monthly_equivalent, included_in_pricing, includes_personnel, source, validation_state, effective_from)
SELECT o.id, 1, 'Renda do pavilhão', 'Contrato Renda_Proporcional: área exclusiva 238,69 m² (441,20 €) + 50% das zonas partilhadas 205,09 m² (189,54 €)', 'operational', 'expense', 630.74, 'monthly', 630.74, TRUE, FALSE, 'Orçamento inicial — valores fornecidos pelo Luís', 'estimated', CURRENT_DATE
FROM organizations o
WHERE o.slug = 'x-motion'
  AND NOT EXISTS (SELECT 1 FROM pricing_expense_items pei WHERE pei.organization_id = o.id AND pei.name = 'Renda do pavilhão');

INSERT INTO pricing_expense_items (organization_id, version, name, description, category, kind, amount, periodicity, monthly_equivalent, included_in_pricing, includes_personnel, source, validation_state, effective_from)
SELECT o.id, 1, 'Água e eletricidade', NULL, 'operational', 'expense', 200.00, 'monthly', 200.00, TRUE, FALSE, 'Orçamento inicial — valores fornecidos pelo Luís', 'estimated', CURRENT_DATE
FROM organizations o
WHERE o.slug = 'x-motion'
  AND NOT EXISTS (SELECT 1 FROM pricing_expense_items pei WHERE pei.organization_id = o.id AND pei.name = 'Água e eletricidade');

INSERT INTO pricing_expense_items (organization_id, version, name, description, category, kind, amount, periodicity, monthly_equivalent, included_in_pricing, includes_personnel, source, validation_state, effective_from)
SELECT o.id, 1, 'Contabilidade', NULL, 'operational', 'expense', 75.00, 'monthly', 75.00, TRUE, FALSE, 'Orçamento inicial — valores fornecidos pelo Luís', 'estimated', CURRENT_DATE
FROM organizations o
WHERE o.slug = 'x-motion'
  AND NOT EXISTS (SELECT 1 FROM pricing_expense_items pei WHERE pei.organization_id = o.id AND pei.name = 'Contabilidade');

INSERT INTO pricing_expense_items (organization_id, version, name, description, category, kind, amount, periodicity, monthly_equivalent, included_in_pricing, includes_personnel, source, validation_state, effective_from)
SELECT o.id, 1, 'Telefone, internet e software', NULL, 'operational', 'expense', 60.00, 'monthly', 60.00, TRUE, FALSE, 'Orçamento inicial — valores fornecidos pelo Luís', 'estimated', CURRENT_DATE
FROM organizations o
WHERE o.slug = 'x-motion'
  AND NOT EXISTS (SELECT 1 FROM pricing_expense_items pei WHERE pei.organization_id = o.id AND pei.name = 'Telefone, internet e software');

INSERT INTO pricing_expense_items (organization_id, version, name, description, category, kind, amount, periodicity, monthly_equivalent, included_in_pricing, includes_personnel, source, validation_state, effective_from)
SELECT o.id, 1, 'Seguros e saúde no trabalho', NULL, 'operational', 'expense', 120.00, 'monthly', 120.00, TRUE, FALSE, 'Orçamento inicial — valores fornecidos pelo Luís', 'estimated', CURRENT_DATE
FROM organizations o
WHERE o.slug = 'x-motion'
  AND NOT EXISTS (SELECT 1 FROM pricing_expense_items pei WHERE pei.organization_id = o.id AND pei.name = 'Seguros e saúde no trabalho');

INSERT INTO pricing_expense_items (organization_id, version, name, description, category, kind, amount, periodicity, monthly_equivalent, included_in_pricing, includes_personnel, source, validation_state, effective_from)
SELECT o.id, 1, 'Manutenção e ferramentas', 'Reserva para reparações e substituição de equipamento', 'operational', 'reserve', 200.00, 'monthly', 200.00, TRUE, FALSE, 'Orçamento inicial — valores fornecidos pelo Luís', 'estimated', CURRENT_DATE
FROM organizations o
WHERE o.slug = 'x-motion'
  AND NOT EXISTS (SELECT 1 FROM pricing_expense_items pei WHERE pei.organization_id = o.id AND pei.name = 'Manutenção e ferramentas');

INSERT INTO pricing_expense_items (organization_id, version, name, description, category, kind, amount, periodicity, monthly_equivalent, included_in_pricing, includes_personnel, source, validation_state, effective_from)
SELECT o.id, 1, 'Marketing e divulgação', NULL, 'operational', 'expense', 150.00, 'monthly', 150.00, TRUE, FALSE, 'Orçamento inicial — valores fornecidos pelo Luís', 'estimated', CURRENT_DATE
FROM organizations o
WHERE o.slug = 'x-motion'
  AND NOT EXISTS (SELECT 1 FROM pricing_expense_items pei WHERE pei.organization_id = o.id AND pei.name = 'Marketing e divulgação');

INSERT INTO pricing_expense_items (organization_id, version, name, description, category, kind, amount, periodicity, monthly_equivalent, included_in_pricing, includes_personnel, source, validation_state, effective_from)
SELECT o.id, 1, 'Alimentação e pequenas despesas', NULL, 'operational', 'provision', 250.00, 'monthly', 250.00, TRUE, FALSE, 'Orçamento inicial — valores fornecidos pelo Luís', 'needs_breakdown', CURRENT_DATE
FROM organizations o
WHERE o.slug = 'x-motion'
  AND NOT EXISTS (SELECT 1 FROM pricing_expense_items pei WHERE pei.organization_id = o.id AND pei.name = 'Alimentação e pequenas despesas');

INSERT INTO pricing_expense_items (organization_id, version, name, description, category, kind, amount, periodicity, monthly_equivalent, included_in_pricing, includes_personnel, source, validation_state, effective_from)
SELECT o.id, 1, 'Prestação ao Fábio (aquisição)', 'Acordo de transição societária: 20.000 € em 24 prestações mensais (24 × 833,33 € = 19.999,92 €; última prestação ajustada em 841,41 € ou compensação acordada)', 'acquisition', 'cash_recovery', 833.33, 'monthly', 833.33, TRUE, FALSE, 'Orçamento inicial — valores fornecidos pelo Luís', 'estimated', CURRENT_DATE
FROM organizations o
WHERE o.slug = 'x-motion'
  AND NOT EXISTS (SELECT 1 FROM pricing_expense_items pei WHERE pei.organization_id = o.id AND pei.name = 'Prestação ao Fábio (aquisição)');

-- 4.2 Kits de consumíveis (só se a organização não tiver nenhum kit)
INSERT INTO consumable_kits (organization_id, code, name, kind, price)
SELECT o.id, 'kit-spot', 'Kit de consumíveis — serviço pontual', 'spot', 8.00
FROM organizations o
WHERE o.slug = 'x-motion'
  AND NOT EXISTS (SELECT 1 FROM consumable_kits ck WHERE ck.organization_id = o.id AND ck.code = 'kit-spot');

INSERT INTO consumable_kits (organization_id, code, name, kind, price)
SELECT o.id, 'kit-ppf-front', 'Kit de consumíveis — PPF frente', 'ppf_front', 20.00
FROM organizations o
WHERE o.slug = 'x-motion'
  AND NOT EXISTS (SELECT 1 FROM consumable_kits ck WHERE ck.organization_id = o.id AND ck.code = 'kit-ppf-front');

INSERT INTO consumable_kits (organization_id, code, name, kind, price)
SELECT o.id, 'kit-wrap', 'Kit de consumíveis — wrap integral', 'wrap_full', 40.00
FROM organizations o
WHERE o.slug = 'x-motion'
  AND NOT EXISTS (SELECT 1 FROM consumable_kits ck WHERE ck.organization_id = o.id AND ck.code = 'kit-wrap');

-- 4.3 Fórmulas base + versão publicada v1 (só se não existirem)
INSERT INTO pricing_formulas (organization_id, code, name)
SELECT o.id, 'complete', 'Serviço completo'
FROM organizations o
WHERE o.slug = 'x-motion'
  AND NOT EXISTS (SELECT 1 FROM pricing_formulas pf WHERE pf.organization_id = o.id AND pf.code = 'complete');

INSERT INTO pricing_formulas (organization_id, code, name)
SELECT o.id, 'spot', 'Serviço pontual'
FROM organizations o
WHERE o.slug = 'x-motion'
  AND NOT EXISTS (SELECT 1 FROM pricing_formulas pf WHERE pf.organization_id = o.id AND pf.code = 'spot');

INSERT INTO pricing_formula_versions (formula_id, organization_id, version, components, status, effective_from, published_at)
SELECT pf.id, pf.organization_id, 1, '[{"id":"c1","type":"expense_base","label":"Despesas e reservas atribuídas","enabled":true,"params":{"scope":"aggregated"}},{"id":"c2","type":"profit_objective","label":"Objetivo de lucro","enabled":true,"params":{}},{"id":"c3","type":"material","label":"Material","enabled":true,"params":{}},{"id":"c4","type":"consumable_kits","label":"Kits de consumíveis","enabled":true,"params":{}},{"id":"c5","type":"sublet","label":"Serviços subcontratados","enabled":true,"params":{}},{"id":"c6","type":"extras","label":"Extras","enabled":true,"params":{}}]'::jsonb, 'published', CURRENT_DATE, NOW()
FROM pricing_formulas pf
WHERE pf.organization_id IN (SELECT o.id FROM organizations o WHERE o.slug = 'x-motion')
  AND pf.code = 'complete'
  AND NOT EXISTS (SELECT 1 FROM pricing_formula_versions pfv WHERE pfv.formula_id = pf.id AND pfv.version = 1);

INSERT INTO pricing_formula_versions (formula_id, organization_id, version, components, status, effective_from, published_at)
SELECT pf.id, pf.organization_id, 1, '[{"id":"s1","type":"expense_base","label":"Despesas e reservas atribuídas","enabled":true,"params":{"scope":"aggregated"}},{"id":"s2","type":"profit_objective","label":"Objetivo de lucro","enabled":true,"params":{}},{"id":"s3","type":"spot_surcharge","label":"Acréscimo pontual por hora","enabled":true,"params":{}},{"id":"s4","type":"material","label":"Material","enabled":true,"params":{}},{"id":"s5","type":"consumable_kits","label":"Kits de consumíveis","enabled":true,"params":{}},{"id":"s6","type":"sublet","label":"Serviços subcontratados","enabled":true,"params":{}},{"id":"s7","type":"extras","label":"Extras","enabled":true,"params":{}}]'::jsonb, 'published', CURRENT_DATE, NOW()
FROM pricing_formulas pf
WHERE pf.organization_id IN (SELECT o.id FROM organizations o WHERE o.slug = 'x-motion')
  AND pf.code = 'spot'
  AND NOT EXISTS (SELECT 1 FROM pricing_formula_versions pfv WHERE pfv.formula_id = pf.id AND pfv.version = 1);

-- 4.4 Política inicial v1 ativa (só se a organização não tiver nenhuma política)
INSERT INTO pricing_policies (organization_id, version, method, manual_daily_expenses, daily_capacity_hours, profit_daily_target, spot_surcharge_per_hour, sublet_fee_percent, waste_rate_percent, vat_rate, status, effective_from, published_at)
SELECT o.id, 1, 'manual', 172.00, 8.00, 200.00, 25.00, 15.00, 15.00, 23.00, 'active', CURRENT_DATE, NOW()
FROM organizations o
WHERE o.slug = 'x-motion'
  AND NOT EXISTS (SELECT 1 FROM pricing_policies pp WHERE pp.organization_id = o.id);
