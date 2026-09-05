-- Migration 000012: Ferramentas e Equipa Operacional
CREATE TABLE IF NOT EXISTS tools (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('corte', 'calor', 'iluminacao', 'limpeza', 'medicao')),
    brand VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    serial_number VARCHAR(100) NOT NULL,
    qr_code VARCHAR(100) UNIQUE NOT NULL,
    status VARCHAR(20) DEFAULT 'disponivel' CHECK (status IN ('disponivel', 'em_uso', 'manutencao')),
    assigned_to_name VARCHAR(255),
    location VARCHAR(255) NOT NULL,
    last_maintenance DATE,
    next_maintenance DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    profile_id UUID REFERENCES profiles(id),
    name VARCHAR(255) NOT NULL,
    role VARCHAR(100) NOT NULL,
    specialty VARCHAR(100) NOT NULL,
    level VARCHAR(20) NOT NULL CHECK (level IN ('Master', 'Sénior', 'Especialista', 'Assistente')),
    status VARCHAR(20) DEFAULT 'disponivel' CHECK (status IN ('disponivel', 'em_trabalho', 'ausente')),
    certifications JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE tools ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
CREATE POLICY org_isolation_tools ON tools FOR ALL USING (organization_id = current_organization_id());
CREATE POLICY org_isolation_employees ON employees FOR ALL USING (organization_id = current_organization_id());
