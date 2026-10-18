-- Migration 000028: indexes for the QC tables.
-- qc_items is queried by inspection_id on every certificate/detail view and by
-- the RLS policy; qc_inspections is queried by work_order_id on the QC page.
-- certificate_number already has a UNIQUE constraint and is used as the
-- semi-public lookup token, so it stays globally unique.

CREATE INDEX IF NOT EXISTS idx_qc_inspections_work_order
    ON qc_inspections (work_order_id);

CREATE INDEX IF NOT EXISTS idx_qc_items_inspection
    ON qc_items (inspection_id);
