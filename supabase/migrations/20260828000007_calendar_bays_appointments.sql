-- Migration 000007: Baias e Agendamento da Oficina

-- 1. Baias de Trabalho
CREATE TABLE IF NOT EXISTS bays (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) NOT NULL,
    service_type VARCHAR(50) NOT NULL CHECK (service_type IN ('ppf', 'wrap', 'detailing', 'tint', 'general')),
    default_technician_id UUID REFERENCES profiles(id),
    status VARCHAR(20) DEFAULT 'available' CHECK (status IN ('available', 'occupied', 'maintenance')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Marcações na Agenda
CREATE TABLE IF NOT EXISTS appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    quote_id UUID REFERENCES quotes(id),
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    bay_id UUID NOT NULL REFERENCES bays(id) ON DELETE CASCADE,
    technician_id UUID REFERENCES profiles(id),
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    estimated_hours NUMERIC(5,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE bays ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY org_isolation_bays ON bays FOR ALL USING (organization_id = current_organization_id());
CREATE POLICY org_isolation_appointments ON appointments FOR ALL USING (organization_id = current_organization_id());
