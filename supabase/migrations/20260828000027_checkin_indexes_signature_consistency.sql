-- Migration 000027: indexes for check-in child tables and signature consistency.
-- checkin_photos/checkin_damages are queried by checkin_id on every detail view
-- and by the list aggregation subqueries; the composite photo index also serves
-- the roof-photo EXISTS filter.

CREATE INDEX IF NOT EXISTS idx_checkin_photos_checkin_angle
    ON checkin_photos (checkin_id, angle);

CREATE INDEX IF NOT EXISTS idx_checkin_damages_checkin
    ON checkin_damages (checkin_id);

-- Legacy rows were seeded as signed without a captured signature.
UPDATE checkins
SET status = 'completed'
WHERE status = 'signed'
  AND signature_data_url IS NULL;

-- Keep the invariant enforced from now on: signed implies a signature.
ALTER TABLE checkins DROP CONSTRAINT IF EXISTS checkins_signed_requires_signature;
ALTER TABLE checkins ADD CONSTRAINT checkins_signed_requires_signature
    CHECK (status <> 'signed' OR signature_data_url IS NOT NULL);
