-- Migration 000008: Check-ins, Inspeção Fotográfica, Danos e Ordens de Trabalho

-- 1. Check-ins de Entrada e Saída
CREATE TABLE IF NOT EXISTS checkins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    appointment_id UUID REFERENCES appointments(id),
    quote_id UUID REFERENCES quotes(id),
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    type VARCHAR(10) NOT NULL CHECK (type IN ('entry', 'exit')),
    mileage INTEGER NOT NULL,
    fuel_level VARCHAR(20) DEFAULT 'half' CHECK (fuel_level IN ('empty', 'quarter', 'half', 'three_quarters', 'full')),
    has_roof_photo BOOLEAN NOT NULL DEFAULT FALSE,
    cleanliness_status VARCHAR(50) DEFAULT 'clean' CHECK (cleanliness_status IN ('clean', 'dusty', 'dirty', 'needs_decontamination')),
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'completed', 'signed')),
    technician_id UUID REFERENCES profiles(id),
    signed_by_name VARCHAR(255),
    signature_data_url TEXT,
    token VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- 2. Fotografias da Inspeção de Entrada/Saída
CREATE TABLE IF NOT EXISTS checkin_photos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    checkin_id UUID NOT NULL REFERENCES checkins(id) ON DELETE CASCADE,
    photo_url TEXT NOT NULL,
    angle VARCHAR(50) NOT NULL CHECK (angle IN ('front_left_45', 'front_right_45', 'rear_left_45', 'rear_right_45', 'odometer', 'roof_top', 'roof_front', 'roof_rear', 'damage_detail')),
    is_mandatory BOOLEAN DEFAULT FALSE,
    label VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Mapeamento de Danos Pré-existentes
CREATE TABLE IF NOT EXISTS checkin_damages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    checkin_id UUID NOT NULL REFERENCES checkins(id) ON DELETE CASCADE,
    pos_x NUMERIC(5,2) NOT NULL,
    pos_y NUMERIC(5,2) NOT NULL,
    body_part VARCHAR(100) NOT NULL,
    damage_type VARCHAR(50) NOT NULL CHECK (damage_type IN ('stone_chip', 'scratch', 'dent', 'repainted', 'swirls', 'wear')),
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('minor', 'moderate', 'severe')),
    notes TEXT,
    photo_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Ordens de Trabalho (Produção da Oficina)
CREATE TABLE IF NOT EXISTS work_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    work_order_number VARCHAR(50) NOT NULL,
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    checkin_id UUID REFERENCES checkins(id),
    status VARCHAR(50) DEFAULT 'in_progress' CHECK (status IN ('draft', 'in_progress', 'waiting_parts', 'quality_control', 'completed')),
    service_title VARCHAR(255) NOT NULL,
    primary_technician_id UUID REFERENCES profiles(id),
    progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    estimated_hours NUMERIC(6,2) NOT NULL,
    actual_hours_spent NUMERIC(6,2) DEFAULT 0.00,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkin_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkin_damages ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY org_isolation_checkins ON checkins FOR ALL USING (organization_id = current_organization_id());
CREATE POLICY org_isolation_checkin_photos ON checkin_photos FOR ALL USING (checkin_id IN (SELECT id FROM checkins WHERE organization_id = current_organization_id()));
CREATE POLICY org_isolation_checkin_damages ON checkin_damages FOR ALL USING (checkin_id IN (SELECT id FROM checkins WHERE organization_id = current_organization_id()));
CREATE POLICY org_isolation_work_orders ON work_orders FOR ALL USING (organization_id = current_organization_id());
