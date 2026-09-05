-- Migration 000002: CRM de Clientes, Contactos e B2B

-- 1. Clientes (Particulares e Empresas)
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('individual', 'business')),
    name VARCHAR(255) NOT NULL,
    legal_name VARCHAR(255),
    nif VARCHAR(50),
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    phone_normalized VARCHAR(50) NOT NULL,
    preferred_channel VARCHAR(20) DEFAULT 'whatsapp' CHECK (preferred_channel IN ('whatsapp', 'phone', 'email')),
    notes TEXT,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'lead', 'archived')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customers_org_email ON customers (organization_id, email);
CREATE INDEX IF NOT EXISTS idx_customers_org_phone ON customers (organization_id, phone_normalized);
CREATE INDEX IF NOT EXISTS idx_customers_org_nif ON customers (organization_id, nif);

-- 2. Contactos Adicionais de Clientes / B2B
CREATE TABLE IF NOT EXISTS customer_contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(100),
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE,
    can_approve_quotes BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Condições Comerciais B2B
CREATE TABLE IF NOT EXISTS b2b_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID UNIQUE NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    discount_rate NUMERIC(5,2) DEFAULT 0.00,
    payment_terms_days INTEGER DEFAULT 30,
    priority_level VARCHAR(20) DEFAULT 'standard' CHECK (priority_level IN ('standard', 'high', 'vip')),
    commercial_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Registo de Comunicações
CREATE TABLE IF NOT EXISTS customer_communications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('call', 'whatsapp', 'email', 'meeting', 'note')),
    direction VARCHAR(10) NOT NULL CHECK (direction IN ('inbound', 'outbound')),
    summary TEXT NOT NULL,
    author_id UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
