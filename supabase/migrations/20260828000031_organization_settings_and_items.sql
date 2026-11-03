-- Migration 000031: Configurações Globais, Itens Universais e Edição
-- Suporta o plano de Go-Live a 4 semanas:
-- 1. Definições gerais da organização (Google review, sinal, personalização da barra lateral)
-- 2. Alargamento de veículos para aceitar barcos, outros tipos e itens avulsos (capacetes, peças)
-- 3. Campos adicionais para CRM de clientes (origem)

-- 1. Tabela de Definições Gerais da Organização (Key-Value ou Documento JSON)
CREATE TABLE IF NOT EXISTS organization_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    google_review_url TEXT DEFAULT 'https://maps.app.goo.gl/W3RiGThiUjNGyNwX6',
    deposit_required BOOLEAN DEFAULT FALSE,
    deposit_percentage NUMERIC(5,2) DEFAULT 30.00,
    deposit_fixed_amount_cents BIGINT,
    sidebar_visible_items JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (organization_id)
);

-- RLS para organization_settings
ALTER TABLE organization_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS org_isolation_organization_settings ON organization_settings;
CREATE POLICY org_isolation_organization_settings ON organization_settings
    FOR ALL
    USING (organization_id = NULLIF(current_setting('app.current_organization_id', true), '')::uuid)
    WITH CHECK (organization_id = NULLIF(current_setting('app.current_organization_id', true), '')::uuid);

-- 2. Alteração na tabela vehicles para suportar novos tipos de carroçaria / itens
-- Adicionar coluna item_type ('vehicle' vs 'object')
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'vehicles' AND column_name = 'item_type'
    ) THEN
        ALTER TABLE vehicles ADD COLUMN item_type VARCHAR(20) DEFAULT 'vehicle' CHECK (item_type IN ('vehicle', 'object'));
    END IF;
END $$;

-- Tornar plate_display e plate_normalized e generation_year anuláveis para objetos que não são veículos
ALTER TABLE vehicles ALTER COLUMN plate_display DROP NOT NULL;
ALTER TABLE vehicles ALTER COLUMN plate_normalized DROP NOT NULL;
ALTER TABLE vehicles ALTER COLUMN generation_year DROP NOT NULL;
ALTER TABLE vehicles ALTER COLUMN original_color_family DROP NOT NULL;

-- Remover a restrição antiga de body_type para permitir barco, autocaravana, capacete, peca, outro
ALTER TABLE vehicles DROP CONSTRAINT IF EXISTS vehicles_body_type_check;

ALTER TABLE vehicles ADD CONSTRAINT vehicles_body_type_check 
    CHECK (body_type IN (
        'sedan', 'coupe', 'suv', 'wagon', 'hatchback', 'cabrio', 'van',
        'motorcycle', 'boat', 'motorhome', 'truck',
        'helmet', 'part', 'other'
    ));

-- 3. Adicionar coluna 'source' no cadastro de clientes para rastrear origem (Instagram, Site, Recomendação, etc.)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'customers' AND column_name = 'source'
    ) THEN
        ALTER TABLE customers ADD COLUMN source VARCHAR(50) DEFAULT 'direct';
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'xflow_app') THEN
        GRANT SELECT, INSERT, UPDATE, DELETE ON organization_settings TO xflow_app;
    END IF;
END $$;
