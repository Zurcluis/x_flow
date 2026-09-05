-- Migration 000005: Catálogo de Serviços, Peças e Materiais

-- 1. Categorias de Serviços
CREATE TABLE IF NOT EXISTS service_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(50) NOT NULL,
    description TEXT,
    icon_name VARCHAR(50),
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Serviços
CREATE TABLE IF NOT EXISTS services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES service_categories(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL,
    description TEXT,
    default_warranty_months INTEGER DEFAULT 60,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Materiais e Inventário
CREATE TABLE IF NOT EXISTS materials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    brand VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('ppf_gloss', 'ppf_matte', 'color_ppf', 'cast_vinyl', 'ceramic', 'tint')),
    thickness_microns INTEGER,
    finish VARCHAR(50) NOT NULL,
    roll_width_meters NUMERIC(4,2) DEFAULT 1.52,
    cost_per_meter NUMERIC(10,2) NOT NULL,
    price_per_meter NUMERIC(10,2) NOT NULL,
    current_stock_meters NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    minimum_stock_alert_meters NUMERIC(10,2) NOT NULL DEFAULT 15.00,
    unit VARCHAR(20) DEFAULT 'meter' CHECK (unit IN ('meter', 'bottle', 'kit')),
    status VARCHAR(20) DEFAULT 'available' CHECK (status IN ('available', 'low_stock', 'out_of_stock')),
    supplier_name VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Lotes de Material
CREATE TABLE IF NOT EXISTS material_batches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    material_id UUID NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
    batch_number VARCHAR(100) NOT NULL,
    supplier_name VARCHAR(255) NOT NULL,
    received_date DATE NOT NULL DEFAULT CURRENT_DATE,
    initial_meters NUMERIC(10,2) NOT NULL,
    remaining_meters NUMERIC(10,2) NOT NULL,
    expiry_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE service_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE material_batches ENABLE ROW LEVEL SECURITY;

CREATE POLICY org_isolation_categories ON service_categories FOR ALL USING (organization_id = current_organization_id());
CREATE POLICY org_isolation_services ON services FOR ALL USING (organization_id = current_organization_id());
CREATE POLICY org_isolation_materials ON materials FOR ALL USING (organization_id = current_organization_id());
CREATE POLICY org_isolation_batches ON material_batches FOR ALL USING (organization_id = current_organization_id());
