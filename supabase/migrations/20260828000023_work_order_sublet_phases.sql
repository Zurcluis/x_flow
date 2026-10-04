-- Migration 000023: fases de subcontratação na ordem de trabalho
-- Orçamentos flexíveis aprovados criam uma fase por linha sublet, com o serviço do
-- fornecedor e o custo real (total da linha + taxa de gestão). Quando o serviço de
-- fornecedor define uma fase interna substituída, essa fase interna deixa de ser criada;
-- subcontratações sem fase interna mapeada ficam sob a chave 'subcontracted'.

-- 1. Chave de fase para subcontratações sem fase interna mapeada
-- (substitui o CHECK de 000009, que só admitia as 8 fases técnicas)
DO $$
DECLARE
  c record;
BEGIN
  FOR c IN
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'work_order_phases'::regclass
      AND contype = 'c'
      AND conname LIKE 'work_order_phases_phase_key%'
  LOOP
    EXECUTE format('ALTER TABLE work_order_phases DROP CONSTRAINT %I', c.conname);
  END LOOP;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'work_order_phases'::regclass
      AND conname = 'work_order_phases_phase_key_check'
  ) THEN
    EXECUTE 'ALTER TABLE work_order_phases ADD CONSTRAINT work_order_phases_phase_key_check CHECK (phase_key IN (''prep_decontamination'', ''disassembly'', ''film_cutting'', ''application'', ''assembly'', ''thermal_cure'', ''detailing_finish'', ''quality_control'', ''subcontracted''))';
  END IF;
END $$;

-- 2. Referência e custo real da subcontratação na fase
ALTER TABLE work_order_phases
  ADD COLUMN IF NOT EXISTS supplier_service_id UUID REFERENCES supplier_services(id) ON DELETE SET NULL;
ALTER TABLE work_order_phases
  ADD COLUMN IF NOT EXISTS sublet_base_cost NUMERIC(12,2);
ALTER TABLE work_order_phases
  ADD COLUMN IF NOT EXISTS sublet_fee_cost NUMERIC(12,2);
