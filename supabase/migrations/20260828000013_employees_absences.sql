-- Migration 000013: Contactos de colaboradores + Ausências/Abonos
ALTER TABLE employees ADD COLUMN IF NOT EXISTS email VARCHAR(255);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS phone VARCHAR(50);

CREATE TABLE IF NOT EXISTS employee_absences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    type VARCHAR(30) NOT NULL CHECK (type IN ('ferias', 'baixa', 'ausencia', 'formacao', 'outro')),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE employee_absences ENABLE ROW LEVEL SECURITY;
CREATE POLICY org_isolation_absences ON employee_absences FOR ALL USING (organization_id = current_organization_id());
