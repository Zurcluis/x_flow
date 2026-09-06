-- Migration 000014: Check-in — fotos reais (upload), danos por fotografia e pertences

-- Danos passam a referenciar a fotografia onde foram marcados
ALTER TABLE checkin_damages ADD COLUMN IF NOT EXISTS photo_id UUID REFERENCES checkin_photos(id) ON DELETE CASCADE;

-- Pertences a bordo guardados como JSON no próprio check-in
ALTER TABLE checkins ADD COLUMN IF NOT EXISTS belongings JSONB NOT NULL DEFAULT '[]'::jsonb;

-- Alinhar o CHECK de angle com os tipos do domínio (PhotoAngle)
ALTER TABLE checkin_photos DROP CONSTRAINT IF EXISTS checkin_photos_angle_check;
ALTER TABLE checkin_photos ADD CONSTRAINT checkin_photos_angle_check
    CHECK (angle IN ('front', 'left_side', 'right_side', 'rear', 'roof', 'odometer', 'damage_detail'));
