-- Migration 000011: Rastreabilidade Orçamento → Ordem de Trabalho
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS quote_id UUID REFERENCES quotes(id);
CREATE INDEX IF NOT EXISTS idx_work_orders_quote ON work_orders (quote_id);
