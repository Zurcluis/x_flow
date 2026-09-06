-- Migration 000015: Catálogo de películas (simulador físico) + pertences de entrega

-- 1. Películas: vinil, PPF e color PPF com parâmetros físicos para simulação realista.
--    gloss_gu = brilho mediano a 60° (GU) dos datasheets/amostras; metallic 0-1 intensidade
--    de flocado; flake_scale granulação aproximada em px.
CREATE TABLE IF NOT EXISTS films (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    brand VARCHAR(100) NOT NULL,
    sku VARCHAR(100),
    type VARCHAR(20) NOT NULL CHECK (type IN ('clear_ppf_gloss', 'clear_ppf_matte', 'color_ppf', 'vinyl_wrap', 'chrome_delete')),
    finish VARCHAR(20) NOT NULL CHECK (finish IN ('gloss', 'satin', 'matte', 'carbon')),
    color_hex VARCHAR(9) NOT NULL,
    gloss_gu REAL NOT NULL DEFAULT 80 CHECK (gloss_gu >= 0 AND gloss_gu <= 120),
    metallic REAL NOT NULL DEFAULT 0 CHECK (metallic >= 0 AND metallic <= 1),
    flake_scale REAL NOT NULL DEFAULT 0 CHECK (flake_scale >= 0 AND flake_scale <= 3),
    cost_per_meter_cents INTEGER NOT NULL,
    warranty_years INTEGER NOT NULL DEFAULT 5,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (organization_id, brand, name)
);

ALTER TABLE films ENABLE ROW LEVEL SECURITY;
CREATE POLICY org_isolation_films ON films FOR ALL USING (organization_id = current_organization_id());

-- 2. Pertences devolvidos no ato de entrega (checklist persistido)
ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS belongings JSONB NOT NULL DEFAULT '[]';
