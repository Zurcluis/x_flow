-- Migration 000034: Social Studio / Marketing (Simulador Instagram + Calendário Mensal)
-- Regista snapshot do perfil/publicações reais do Instagram e rascunhos/calendário de conteúdo
-- com isolamento estrito por organization_id e Row Level Security (RLS).

CREATE TABLE IF NOT EXISTS social_instagram_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    external_account_id TEXT,
    username TEXT NOT NULL DEFAULT 'x_motion.wrap' CHECK (char_length(username) BETWEEN 1 AND 120),
    display_name TEXT NOT NULL DEFAULT 'X-MOTION' CHECK (char_length(display_name) BETWEEN 1 AND 150),
    biography TEXT NOT NULL DEFAULT '',
    website_url TEXT NOT NULL DEFAULT '',
    profile_picture_url TEXT,
    followers_count INTEGER NOT NULL DEFAULT 0 CHECK (followers_count >= 0),
    follows_count INTEGER NOT NULL DEFAULT 0 CHECK (follows_count >= 0),
    media_count INTEGER NOT NULL DEFAULT 0 CHECK (media_count >= 0),
    simulated_name TEXT NOT NULL DEFAULT 'X-Motion | PPF & Car Wrap Barcelos',
    simulated_bio TEXT NOT NULL DEFAULT E'PPF, Car Wrap e Color PPF em Barcelos.\nProteção e mudança de cor com avaliação no nosso espaço.\nPede a tua proposta no link abaixo.',
    simulated_website TEXT NOT NULL DEFAULT 'https://x-flow-b8rt.vercel.app/ig',
    highlights_json JSONB NOT NULL DEFAULT '[{"id":"h1","title":"Avaliar","subtitle":"Como pedir proposta"},{"id":"h2","title":"PPF","subtitle":"Proteção de pintura"},{"id":"h3","title":"Car Wrap","subtitle":"Mudança de cor"},{"id":"h4","title":"Color PPF","subtitle":"Cor e proteção"},{"id":"h5","title":"Barcelos","subtitle":"Morada e horário"}]'::jsonb
        CHECK (jsonb_typeof(highlights_json) = 'array'),
    last_synced_at TIMESTAMPTZ,
    last_error TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_social_ig_profiles_org UNIQUE (organization_id)
);

CREATE TABLE IF NOT EXISTS social_instagram_published_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    external_media_id TEXT NOT NULL CHECK (char_length(external_media_id) BETWEEN 1 AND 160),
    media_type TEXT NOT NULL CHECK (media_type IN ('IMAGE', 'VIDEO', 'CAROUSEL_ALBUM')),
    media_product_type TEXT NOT NULL DEFAULT 'FEED' CHECK (media_product_type IN ('FEED', 'REELS')),
    caption TEXT NOT NULL DEFAULT '',
    media_url TEXT,
    thumbnail_url TEXT,
    children_json JSONB NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(children_json) = 'array'),
    permalink TEXT,
    like_count INTEGER NOT NULL DEFAULT 0 CHECK (like_count >= 0),
    comments_count INTEGER NOT NULL DEFAULT 0 CHECK (comments_count >= 0),
    is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
    published_at TIMESTAMPTZ NOT NULL,
    synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_social_ig_published_org_ext UNIQUE (organization_id, external_media_id)
);

CREATE INDEX IF NOT EXISTS idx_social_ig_published_org_date
    ON social_instagram_published_posts (organization_id, published_at DESC);

CREATE TABLE IF NOT EXISTS social_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
    title TEXT NOT NULL CHECK (char_length(title) BETWEEN 1 AND 180),
    format TEXT NOT NULL CHECK (format IN ('reel', 'carousel', 'static', 'story')),
    pillar TEXT NOT NULL DEFAULT 'process'
        CHECK (pillar IN ('ppf', 'wrap', 'process', 'details', 'institutional')),
    status TEXT NOT NULL DEFAULT 'idea'
        CHECK (status IN ('idea', 'production', 'ready', 'scheduled', 'published')),
    scheduled_for DATE,
    scheduled_time VARCHAR(5),
    grid_order INTEGER NOT NULL DEFAULT 100,
    is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
    hook TEXT NOT NULL DEFAULT '',
    caption TEXT NOT NULL DEFAULT '',
    script_notes TEXT NOT NULL DEFAULT '',
    cta TEXT NOT NULL DEFAULT '',
    media_items JSONB NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(media_items) = 'array'),
    owner_consent BOOLEAN NOT NULL DEFAULT FALSE,
    published_permalink TEXT,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_social_posts_org_schedule
    ON social_posts (organization_id, scheduled_for ASC, grid_order ASC);

CREATE INDEX IF NOT EXISTS idx_social_posts_org_grid
    ON social_posts (organization_id, is_pinned DESC, grid_order ASC, created_at DESC);

ALTER TABLE social_instagram_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_instagram_published_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS org_isolation_social_instagram_profiles ON social_instagram_profiles;
CREATE POLICY org_isolation_social_instagram_profiles ON social_instagram_profiles
    FOR ALL
    USING (organization_id = current_organization_id())
    WITH CHECK (organization_id = current_organization_id());

DROP POLICY IF EXISTS org_isolation_social_instagram_published_posts ON social_instagram_published_posts;
CREATE POLICY org_isolation_social_instagram_published_posts ON social_instagram_published_posts
    FOR ALL
    USING (organization_id = current_organization_id())
    WITH CHECK (organization_id = current_organization_id());

DROP POLICY IF EXISTS org_isolation_social_posts ON social_posts;
CREATE POLICY org_isolation_social_posts ON social_posts
    FOR ALL
    USING (organization_id = current_organization_id())
    WITH CHECK (organization_id = current_organization_id());

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'xflow_app') THEN
        EXECUTE 'GRANT SELECT, INSERT, UPDATE, DELETE ON social_instagram_profiles TO xflow_app';
        EXECUTE 'GRANT SELECT, INSERT, UPDATE, DELETE ON social_instagram_published_posts TO xflow_app';
        EXECUTE 'GRANT SELECT, INSERT, UPDATE, DELETE ON social_posts TO xflow_app';
    END IF;
END $$;
