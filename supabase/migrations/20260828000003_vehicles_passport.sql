-- Migration 000003: Viaturas e Passaporte Digital

-- 1. Viaturas
CREATE TABLE IF NOT EXISTS vehicles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    plate_display VARCHAR(50) NOT NULL,
    plate_normalized VARCHAR(50) NOT NULL,
    vin VARCHAR(50),
    make VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    generation_year INTEGER NOT NULL,
    body_type VARCHAR(50) NOT NULL CHECK (body_type IN ('sedan', 'coupe', 'suv', 'wagon', 'hatchback', 'cabrio', 'motorcycle', 'van')),
    original_color_name VARCHAR(100) NOT NULL,
    original_color_family VARCHAR(50) NOT NULL CHECK (original_color_family IN ('white', 'black', 'grey', 'silver', 'blue', 'red', 'green', 'yellow', 'orange', 'other')),
    original_color_code VARCHAR(50),
    current_mileage INTEGER,
    fuel_type VARCHAR(50) CHECK (fuel_type IN ('gasoline', 'diesel', 'electric', 'hybrid')),
    notes TEXT,
    photo_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (organization_id, plate_normalized)
);

CREATE INDEX IF NOT EXISTS idx_vehicles_org_plate ON vehicles (organization_id, plate_normalized);
CREATE INDEX IF NOT EXISTS idx_vehicles_org_make_model ON vehicles (organization_id, make, model);

-- 2. Associação Temporal Cliente - Viatura (Histórico de Posse)
CREATE TABLE IF NOT EXISTS vehicle_customer_links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    relationship_type VARCHAR(50) DEFAULT 'owner' CHECK (relationship_type IN ('owner', 'driver', 'fleet_manager')),
    started_at TIMESTAMPTZ DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    is_current BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vehicle_links_current ON vehicle_customer_links (vehicle_id, is_current);

-- 3. Notas Técnicas da Viatura
CREATE TABLE IF NOT EXISTS vehicle_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    author_id UUID REFERENCES profiles(id),
    category VARCHAR(50) DEFAULT 'general' CHECK (category IN ('technical', 'bodywork', 'general')),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
