-- Migration 000024: Núcleo de Tesouraria — Gestão Financeira (Fase 2 do plano v2.0)
-- Livro de caixa real: movimentos (entradas/saídas), categorias, rubricas recorrentes
-- e contas (banco/caixa/MB WAY). O X-Flow é sistema de controlo gerencial:
-- NÃO substitui a contabilidade certificada nem o software faturador (weoInvoice).

-- 1. Categorias de movimento
CREATE TABLE IF NOT EXISTS transaction_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(120) NOT NULL,
    kind VARCHAR(30) NOT NULL DEFAULT 'operational'
        CHECK (kind IN ('operational','tax','payroll','rent','marketing','supplier','other')),
    is_recurring BOOLEAN DEFAULT FALSE,
    vat_default_rate NUMERIC(5,2) DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (organization_id, name)
);

-- 2. Contas (banco / caixa / MB WAY)
CREATE TABLE IF NOT EXISTS bank_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(120) NOT NULL,
    iban VARCHAR(34),
    bic VARCHAR(11),
    kind VARCHAR(20) NOT NULL DEFAULT 'bank' CHECK (kind IN ('bank','cash','mbway')),
    initial_balance NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (organization_id, name)
);

-- 3. Rubricas recorrentes (renda, acordo de transição, contabilidade, seguros…)
CREATE TABLE IF NOT EXISTS recurring_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(160) NOT NULL,
    category_id UUID REFERENCES transaction_categories(id),
    type VARCHAR(10) NOT NULL CHECK (type IN ('income','expense')),
    amount NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
    vat_rate NUMERIC(5,2) NOT NULL DEFAULT 0.00,
    frequency VARCHAR(20) NOT NULL DEFAULT 'monthly'
        CHECK (frequency IN ('monthly','quarterly','yearly')),
    day_of_month INTEGER NOT NULL DEFAULT 1 CHECK (day_of_month BETWEEN 1 AND 31),
    starts_at DATE NOT NULL DEFAULT CURRENT_DATE,
    ends_at DATE,
    active BOOLEAN DEFAULT TRUE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Movimentos (livro de caixa) — imutáveis por convenção: nunca DELETE; anular
-- é registo reverso (source_type 'manual' com referência ao original em reference).
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    type VARCHAR(10) NOT NULL CHECK (type IN ('income','expense','transfer')),
    occurred_at TIMESTAMPTZ NOT NULL,
    amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
    category_id UUID REFERENCES transaction_categories(id),
    bank_account_id UUID REFERENCES bank_accounts(id),
    description VARCHAR(400),
    payment_method VARCHAR(50) DEFAULT 'bank_transfer',
    reference VARCHAR(120),
    vat_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    source_type VARCHAR(30) NOT NULL DEFAULT 'manual'
        CHECK (source_type IN ('manual','invoice_payment','recurring','import','tax_payment')),
    source_id UUID,
    recurring_rule_id UUID REFERENCES recurring_rules(id),
    period_key VARCHAR(7), -- 'YYYY-MM' para deduplicação de recorrentes
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transactions_org_date ON transactions (organization_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_org_type ON transactions (organization_id, type);
CREATE INDEX IF NOT EXISTS idx_transactions_source ON transactions (source_type, source_id);
CREATE INDEX IF NOT EXISTS idx_transactions_recurring_period
    ON transactions (recurring_rule_id, period_key) WHERE recurring_rule_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_recurring_org_active ON recurring_rules (organization_id, active);
CREATE INDEX IF NOT EXISTS idx_categories_org ON transaction_categories (organization_id);

-- 5. RLS — isolamento por organização (padrão do projeto)
ALTER TABLE transaction_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY org_isolation_transaction_categories ON transaction_categories
    FOR ALL USING (organization_id = current_organization_id());
CREATE POLICY org_isolation_bank_accounts ON bank_accounts
    FOR ALL USING (organization_id = current_organization_id());
CREATE POLICY org_isolation_recurring_rules ON recurring_rules
    FOR ALL USING (organization_id = current_organization_id());
CREATE POLICY org_isolation_transactions ON transactions
    FOR ALL USING (organization_id = current_organization_id());
