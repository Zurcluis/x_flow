-- Migration 000009: Fases de Produção, Checklist, Timesheet, Consumo de Material e QC

-- 1. Fases Técnicas da Obra
CREATE TABLE IF NOT EXISTS work_order_phases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    work_order_id UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
    phase_key VARCHAR(50) NOT NULL CHECK (phase_key IN ('prep_decontamination', 'disassembly', 'film_cutting', 'application', 'assembly', 'thermal_cure', 'detailing_finish', 'quality_control')),
    name VARCHAR(100) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
    order_index INTEGER NOT NULL,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    estimated_hours NUMERIC(5,2) DEFAULT 0.00,
    actual_hours NUMERIC(5,2) DEFAULT 0.00
);

-- 2. Checklist Técnico por Fase
CREATE TABLE IF NOT EXISTS work_order_checklist_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phase_id UUID NOT NULL REFERENCES work_order_phases(id) ON DELETE CASCADE,
    label VARCHAR(255) NOT NULL,
    is_completed BOOLEAN DEFAULT FALSE,
    completed_by_name VARCHAR(100),
    completed_at TIMESTAMPTZ
);

-- 3. Timesheet de Técnicos
CREATE TABLE IF NOT EXISTS work_order_time_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    work_order_id UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
    phase_key VARCHAR(50) NOT NULL,
    technician_name VARCHAR(100) NOT NULL,
    hours_spent NUMERIC(5,2) NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Consumo Real de Materiais e Lote
CREATE TABLE IF NOT EXISTS work_order_material_usages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    work_order_id UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
    material_id UUID REFERENCES materials(id),
    material_name VARCHAR(150) NOT NULL,
    batch_number VARCHAR(100) NOT NULL,
    estimated_meters NUMERIC(6,2) NOT NULL,
    actual_meters NUMERIC(6,2) NOT NULL,
    scrap_percentage NUMERIC(5,2) DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Inspeções de Controlo de Qualidade (QC)
CREATE TABLE IF NOT EXISTS qc_inspections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    work_order_id UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
    inspector_name VARCHAR(100) NOT NULL,
    status VARCHAR(20) DEFAULT 'in_rework' CHECK (status IN ('passed', 'failed', 'in_rework')),
    overall_notes TEXT,
    approved_at TIMESTAMPTZ,
    certificate_number VARCHAR(100) UNIQUE,
    signature_data_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Itens de Inspeção de QC
CREATE TABLE IF NOT EXISTS qc_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    inspection_id UUID NOT NULL REFERENCES qc_inspections(id) ON DELETE CASCADE,
    criterion_name VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('finish', 'edges', 'alignment', 'cleanliness', 'safety')),
    status VARCHAR(10) DEFAULT 'pass' CHECK (status IN ('pass', 'fail', 'na')),
    rework_notes TEXT,
    photo_url TEXT,
    resolved_at TIMESTAMPTZ
);

-- RLS
ALTER TABLE work_order_phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_order_checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_order_time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_order_material_usages ENABLE ROW LEVEL SECURITY;
ALTER TABLE qc_inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE qc_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY org_isolation_phases ON work_order_phases FOR ALL USING (work_order_id IN (SELECT id FROM work_orders WHERE organization_id = current_organization_id()));
CREATE POLICY org_isolation_qc_inspections ON qc_inspections FOR ALL USING (work_order_id IN (SELECT id FROM work_orders WHERE organization_id = current_organization_id()));
