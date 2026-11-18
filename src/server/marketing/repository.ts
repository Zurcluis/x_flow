import { buildDecember2026SeedPosts } from "@/domains/marketing/december-seed";
import {
  validateSimulatedProfileInput,
  validateSocialPostInput,
} from "@/domains/marketing/rules";
import type {
  SocialHighlightItem,
  SocialInstagramChildMedia,
  SocialInstagramProfile,
  SocialInstagramPublishedPost,
  SocialMediaItem,
  SocialPostRecord,
} from "@/domains/marketing/types";
import { withOrgTransaction } from "@/server/inbox/repository";
import type {
  FetchedInstagramMediaItem,
  FetchedInstagramProfileSnapshot,
} from "./composio-instagram";

export interface MarketingVehicleOption {
  id: string;
  label: string;
}

function toIso(value: unknown): string {
  if (value instanceof Date) return value.toISOString();
  return String(value ?? "");
}

function toIsoOrNull(value: unknown): string | null {
  if (value == null) return null;
  if (value instanceof Date) return value.toISOString();
  const s = String(value).trim();
  return s || null;
}

function toDateKeyOrNull(value: unknown): string | null {
  if (value == null) return null;
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  const s = String(value).trim();
  return s ? s.slice(0, 10) : null;
}

function mapProfile(row: Record<string, unknown>): SocialInstagramProfile {
  const highlightsRaw = Array.isArray(row.highlights_json)
    ? (row.highlights_json as SocialHighlightItem[])
    : [];
  return {
    id: String(row.id),
    organizationId: String(row.organization_id),
    externalAccountId: row.external_account_id ? String(row.external_account_id) : null,
    username: String(row.username ?? "x_motion.wrap"),
    displayName: String(row.display_name ?? "X-MOTION"),
    biography: String(row.biography ?? ""),
    websiteUrl: String(row.website_url ?? ""),
    profilePictureUrl: row.profile_picture_url ? String(row.profile_picture_url) : null,
    followersCount: Number(row.followers_count ?? 0),
    followsCount: Number(row.follows_count ?? 0),
    mediaCount: Number(row.media_count ?? 0),
    simulatedName: String(row.simulated_name ?? "X-Motion | PPF & Car Wrap Barcelos"),
    simulatedBio: String(row.simulated_bio ?? ""),
    simulatedWebsite: String(row.simulated_website ?? ""),
    highlights: highlightsRaw,
    lastSyncedAt: toIsoOrNull(row.last_synced_at),
    lastError: row.last_error ? String(row.last_error) : null,
  };
}

function mapPublishedPost(row: Record<string, unknown>): SocialInstagramPublishedPost {
  return {
    id: String(row.id),
    organizationId: String(row.organization_id),
    externalMediaId: String(row.external_media_id),
    mediaType: row.media_type as SocialInstagramPublishedPost["mediaType"],
    mediaProductType: (row.media_product_type as SocialInstagramPublishedPost["mediaProductType"]) ?? "FEED",
    caption: String(row.caption ?? ""),
    mediaUrl: row.media_url ? String(row.media_url) : null,
    thumbnailUrl: row.thumbnail_url ? String(row.thumbnail_url) : null,
    children: Array.isArray(row.children_json)
      ? (row.children_json as SocialInstagramChildMedia[])
      : [],
    permalink: row.permalink ? String(row.permalink) : null,
    likeCount: Number(row.like_count ?? 0),
    commentsCount: Number(row.comments_count ?? 0),
    isPinned: Boolean(row.is_pinned),
    publishedAt: toIso(row.published_at),
    syncedAt: toIso(row.synced_at),
  };
}

function mapSocialPost(row: Record<string, unknown>): SocialPostRecord {
  const vehicleMake = row.vehicle_make ? String(row.vehicle_make) : "";
  const vehicleModel = row.vehicle_model ? String(row.vehicle_model) : "";
  const vehiclePlate = row.vehicle_plate ? String(row.vehicle_plate) : "";
  const vehicleLabel = vehicleMake
    ? `${vehicleMake} ${vehicleModel}${vehiclePlate ? ` (${vehiclePlate})` : ""}`.trim()
    : null;

  return {
    id: String(row.id),
    organizationId: String(row.organization_id),
    vehicleId: row.vehicle_id ? String(row.vehicle_id) : null,
    vehicleLabel,
    title: String(row.title),
    format: row.format as SocialPostRecord["format"],
    pillar: row.pillar as SocialPostRecord["pillar"],
    status: row.status as SocialPostRecord["status"],
    scheduledFor: toDateKeyOrNull(row.scheduled_for),
    scheduledTime: row.scheduled_time ? String(row.scheduled_time) : null,
    gridOrder: Number(row.grid_order ?? 100),
    isPinned: Boolean(row.is_pinned),
    hook: String(row.hook ?? ""),
    caption: String(row.caption ?? ""),
    scriptNotes: String(row.script_notes ?? ""),
    cta: String(row.cta ?? ""),
    mediaItems: Array.isArray(row.media_items) ? (row.media_items as SocialMediaItem[]) : [],
    ownerConsent: Boolean(row.owner_consent),
    publishedPermalink: row.published_permalink ? String(row.published_permalink) : null,
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
  };
}

export async function getOrCreateInstagramProfile(
  organizationId: string
): Promise<SocialInstagramProfile> {
  return withOrgTransaction(organizationId, async (client) => {
    await client.query(
      `INSERT INTO social_instagram_profiles (organization_id)
       VALUES ($1)
       ON CONFLICT (organization_id) DO NOTHING`,
      [organizationId]
    );
    const { rows } = await client.query<Record<string, unknown>>(
      `SELECT * FROM social_instagram_profiles WHERE organization_id = $1 LIMIT 1`,
      [organizationId]
    );
    return mapProfile(rows[0]);
  });
}

export async function saveInstagramSyncSnapshot(
  organizationId: string,
  profile: FetchedInstagramProfileSnapshot,
  media: FetchedInstagramMediaItem[]
): Promise<{
  profile: SocialInstagramProfile;
  publishedPosts: SocialInstagramPublishedPost[];
}> {
  return withOrgTransaction(organizationId, async (client) => {
    const { rows: profRows } = await client.query<Record<string, unknown>>(
      `INSERT INTO social_instagram_profiles (
         organization_id, external_account_id, username, display_name,
         biography, website_url, profile_picture_url,
         followers_count, follows_count, media_count, last_synced_at, last_error, updated_at
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NULL, NOW())
       ON CONFLICT (organization_id) DO UPDATE SET
         external_account_id = EXCLUDED.external_account_id,
         username = EXCLUDED.username,
         display_name = EXCLUDED.display_name,
         biography = CASE WHEN EXCLUDED.biography <> '' THEN EXCLUDED.biography ELSE social_instagram_profiles.biography END,
         website_url = CASE WHEN EXCLUDED.website_url <> '' THEN EXCLUDED.website_url ELSE social_instagram_profiles.website_url END,
         profile_picture_url = EXCLUDED.profile_picture_url,
         followers_count = EXCLUDED.followers_count,
         follows_count = EXCLUDED.follows_count,
         media_count = EXCLUDED.media_count,
         last_synced_at = NOW(),
         last_error = NULL,
         updated_at = NOW()
       RETURNING *`,
      [
        organizationId,
        profile.externalAccountId,
        profile.username,
        profile.displayName,
        profile.biography,
        profile.websiteUrl,
        profile.profilePictureUrl,
        profile.followersCount,
        profile.followsCount,
        profile.mediaCount,
      ]
    );

    if (media.length > 0) {
      for (const item of media) {
        await client.query(
          `INSERT INTO social_instagram_published_posts (
             organization_id, external_media_id, media_type, media_product_type,
             caption, media_url, thumbnail_url, children_json, permalink,
             like_count, comments_count, published_at, synced_at
           ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9, $10, $11, $12, NOW())
           ON CONFLICT (organization_id, external_media_id) DO UPDATE SET
             media_type = EXCLUDED.media_type,
             media_product_type = EXCLUDED.media_product_type,
             caption = EXCLUDED.caption,
             media_url = EXCLUDED.media_url,
             thumbnail_url = EXCLUDED.thumbnail_url,
             children_json = EXCLUDED.children_json,
             permalink = EXCLUDED.permalink,
             like_count = EXCLUDED.like_count,
             comments_count = EXCLUDED.comments_count,
             published_at = EXCLUDED.published_at,
             synced_at = NOW()`,
          [
            organizationId,
            item.externalMediaId,
            item.mediaType,
            item.mediaProductType,
            item.caption,
            item.mediaUrl,
            item.thumbnailUrl,
            JSON.stringify(item.children),
            item.permalink,
            item.likeCount,
            item.commentsCount,
            item.publishedAt,
          ]
        );
      }
    }

    const { rows: mediaRows } = await client.query<Record<string, unknown>>(
      `SELECT * FROM social_instagram_published_posts
       WHERE organization_id = $1
       ORDER BY is_pinned DESC, published_at DESC
       LIMIT 36`,
      [organizationId]
    );

    return {
      profile: mapProfile(profRows[0]),
      publishedPosts: mediaRows.map(mapPublishedPost),
    };
  });
}

export async function recordInstagramSyncError(
  organizationId: string,
  errorMessage: string
): Promise<void> {
  await withOrgTransaction(organizationId, async (client) => {
    await client.query(
      `INSERT INTO social_instagram_profiles (organization_id, last_error, updated_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (organization_id) DO UPDATE SET
         last_error = EXCLUDED.last_error,
         updated_at = NOW()`,
      [organizationId, errorMessage.slice(0, 400)]
    );
  });
}

export async function listPublishedInstagramPosts(
  organizationId: string,
  limit = 36
): Promise<SocialInstagramPublishedPost[]> {
  return withOrgTransaction(organizationId, async (client) => {
    const { rows } = await client.query<Record<string, unknown>>(
      `SELECT * FROM social_instagram_published_posts
       WHERE organization_id = $1
       ORDER BY is_pinned DESC, published_at DESC
       LIMIT $2`,
      [organizationId, limit]
    );
    return rows.map(mapPublishedPost);
  });
}

export async function updateSimulatedInstagramProfile(
  organizationId: string,
  raw: {
    simulatedName: string;
    simulatedBio: string;
    simulatedWebsite: string;
    highlights: SocialHighlightItem[];
  }
): Promise<SocialInstagramProfile> {
  const valid = validateSimulatedProfileInput(raw);
  return withOrgTransaction(organizationId, async (client) => {
    const { rows } = await client.query<Record<string, unknown>>(
      `INSERT INTO social_instagram_profiles (
         organization_id, simulated_name, simulated_bio, simulated_website, highlights_json, updated_at
       ) VALUES ($1, $2, $3, $4, $5::jsonb, NOW())
       ON CONFLICT (organization_id) DO UPDATE SET
         simulated_name = EXCLUDED.simulated_name,
         simulated_bio = EXCLUDED.simulated_bio,
         simulated_website = EXCLUDED.simulated_website,
         highlights_json = EXCLUDED.highlights_json,
         updated_at = NOW()
       RETURNING *`,
      [
        organizationId,
        valid.simulatedName,
        valid.simulatedBio,
        valid.simulatedWebsite,
        JSON.stringify(valid.highlights),
      ]
    );
    return mapProfile(rows[0]);
  });
}

const POST_SELECT = `
  SELECT sp.*, v.make AS vehicle_make, v.model AS vehicle_model, v.plate_display AS vehicle_plate
  FROM social_posts sp
  LEFT JOIN vehicles v ON v.id = sp.vehicle_id AND v.organization_id = sp.organization_id
`;

export async function listSocialPosts(organizationId: string): Promise<SocialPostRecord[]> {
  return withOrgTransaction(organizationId, async (client) => {
    const { rows } = await client.query<Record<string, unknown>>(
      `${POST_SELECT}
       WHERE sp.organization_id = $1
       ORDER BY sp.is_pinned DESC, sp.grid_order ASC, sp.scheduled_for ASC NULLS LAST, sp.created_at DESC`,
      [organizationId]
    );
    return rows.map(mapSocialPost);
  });
}

export async function createSocialPost(
  organizationId: string,
  createdByProfileId: string,
  raw: Record<string, unknown>
): Promise<SocialPostRecord> {
  const valid = validateSocialPostInput(raw);
  return withOrgTransaction(organizationId, async (client) => {
    const { rows: minRows } = await client.query<{ min_order: number | null }>(
      `SELECT MIN(grid_order)::int AS min_order FROM social_posts WHERE organization_id = $1`,
      [organizationId]
    );
    const nextGridOrder = minRows[0]?.min_order != null ? Number(minRows[0].min_order) - 10 : 10;

    const { rows: inserted } = await client.query<{ id: string }>(
      `INSERT INTO social_posts (
         organization_id, vehicle_id, title, format, pillar, status,
         scheduled_for, scheduled_time, grid_order, is_pinned,
         hook, caption, script_notes, cta, media_items, owner_consent,
         published_permalink, created_by
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15::jsonb, $16, $17, $18)
       RETURNING id`,
      [
        organizationId,
        valid.vehicleId,
        valid.title,
        valid.format,
        valid.pillar,
        valid.status,
        valid.scheduledFor,
        valid.scheduledTime,
        nextGridOrder,
        valid.isPinned,
        valid.hook,
        valid.caption,
        valid.scriptNotes,
        valid.cta,
        JSON.stringify(valid.mediaItems),
        valid.ownerConsent,
        valid.publishedPermalink,
        createdByProfileId,
      ]
    );

    const { rows } = await client.query<Record<string, unknown>>(
      `${POST_SELECT} WHERE sp.organization_id = $1 AND sp.id = $2`,
      [organizationId, inserted[0].id]
    );
    return mapSocialPost(rows[0]);
  });
}

export async function updateSocialPost(
  organizationId: string,
  postId: string,
  raw: Record<string, unknown>
): Promise<SocialPostRecord | null> {
  const valid = validateSocialPostInput(raw);
  return withOrgTransaction(organizationId, async (client) => {
    const { rowCount } = await client.query(
      `UPDATE social_posts
       SET vehicle_id = $3,
           title = $4,
           format = $5,
           pillar = $6,
           status = $7,
           scheduled_for = $8,
           scheduled_time = $9,
           is_pinned = $10,
           hook = $11,
           caption = $12,
           script_notes = $13,
           cta = $14,
           media_items = $15::jsonb,
           owner_consent = $16,
           published_permalink = $17,
           updated_at = NOW()
       WHERE organization_id = $1 AND id = $2`,
      [
        organizationId,
        postId,
        valid.vehicleId,
        valid.title,
        valid.format,
        valid.pillar,
        valid.status,
        valid.scheduledFor,
        valid.scheduledTime,
        valid.isPinned,
        valid.hook,
        valid.caption,
        valid.scriptNotes,
        valid.cta,
        JSON.stringify(valid.mediaItems),
        valid.ownerConsent,
        valid.publishedPermalink,
      ]
    );
    if (!rowCount) return null;

    const { rows } = await client.query<Record<string, unknown>>(
      `${POST_SELECT} WHERE sp.organization_id = $1 AND sp.id = $2`,
      [organizationId, postId]
    );
    return rows[0] ? mapSocialPost(rows[0]) : null;
  });
}

export async function deleteSocialPost(
  organizationId: string,
  postId: string
): Promise<boolean> {
  return withOrgTransaction(organizationId, async (client) => {
    const { rowCount } = await client.query(
      `DELETE FROM social_posts WHERE organization_id = $1 AND id = $2`,
      [organizationId, postId]
    );
    return Boolean(rowCount && rowCount > 0);
  });
}

export async function moveSocialPostGridPosition(
  organizationId: string,
  postId: string,
  direction: "earlier" | "later"
): Promise<SocialPostRecord[]> {
  return withOrgTransaction(organizationId, async (client) => {
    const { rows: feedRows } = await client.query<{ id: string; grid_order: number }>(
      `SELECT id, grid_order FROM social_posts
       WHERE organization_id = $1 AND format <> 'story' AND status <> 'published'
       ORDER BY is_pinned DESC, grid_order ASC, created_at DESC`,
      [organizationId]
    );

    const idx = feedRows.findIndex((r) => r.id === postId);
    if (idx === -1) return listSocialPosts(organizationId);

    const targetIdx = direction === "earlier" ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= feedRows.length) {
      return listSocialPosts(organizationId);
    }

    const reordered = [...feedRows];
    const [moved] = reordered.splice(idx, 1);
    reordered.splice(targetIdx, 0, moved);

    for (let i = 0; i < reordered.length; i += 1) {
      await client.query(
        `UPDATE social_posts SET grid_order = $3, updated_at = NOW()
         WHERE organization_id = $1 AND id = $2`,
        [organizationId, reordered[i].id, (i + 1) * 10]
      );
    }

    const { rows } = await client.query<Record<string, unknown>>(
      `${POST_SELECT}
       WHERE sp.organization_id = $1
       ORDER BY sp.is_pinned DESC, sp.grid_order ASC, sp.scheduled_for ASC NULLS LAST, sp.created_at DESC`,
      [organizationId]
    );
    return rows.map(mapSocialPost);
  });
}

export async function importDecember2026Plan(
  organizationId: string,
  createdByProfileId: string
): Promise<{ insertedCount: number; posts: SocialPostRecord[] }> {
  const seed = buildDecember2026SeedPosts();

  return withOrgTransaction(organizationId, async (client) => {
    const { rows: existing } = await client.query<{ scheduled_for: string | null; title: string }>(
      `SELECT scheduled_for::text, title FROM social_posts WHERE organization_id = $1`,
      [organizationId]
    );
    const seen = new Set(existing.map((r) => `${r.scheduled_for ?? ""}::${r.title.trim().toLowerCase()}`));

    let insertedCount = 0;
    for (const item of seed) {
      const key = `${item.scheduledFor ?? ""}::${item.title.trim().toLowerCase()}`;
      if (seen.has(key)) continue;

      await client.query(
        `INSERT INTO social_posts (
           organization_id, vehicle_id, title, format, pillar, status,
           scheduled_for, scheduled_time, grid_order, is_pinned,
           hook, caption, script_notes, cta, media_items, owner_consent,
           published_permalink, created_by
         ) VALUES ($1, NULL, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14::jsonb, $15, NULL, $16)`,
        [
          organizationId,
          item.title,
          item.format,
          item.pillar,
          item.status,
          item.scheduledFor,
          item.scheduledTime,
          item.gridOrder,
          item.isPinned,
          item.hook,
          item.caption,
          item.scriptNotes,
          item.cta,
          JSON.stringify(item.mediaItems ?? []),
          item.ownerConsent,
          createdByProfileId,
        ]
      );
      insertedCount += 1;
    }

    const { rows } = await client.query<Record<string, unknown>>(
      `${POST_SELECT}
       WHERE sp.organization_id = $1
       ORDER BY sp.is_pinned DESC, sp.grid_order ASC, sp.scheduled_for ASC NULLS LAST, sp.created_at DESC`,
      [organizationId]
    );
    return {
      insertedCount,
      posts: rows.map(mapSocialPost),
    };
  });
}

export async function listMarketingVehicleOptions(
  organizationId: string
): Promise<MarketingVehicleOption[]> {
  return withOrgTransaction(organizationId, async (client) => {
    const { rows } = await client.query<{
      id: string;
      make: string;
      model: string;
      plate_display: string | null;
    }>(
      `SELECT id, make, model, plate_display
       FROM vehicles
       WHERE organization_id = $1
       ORDER BY updated_at DESC NULLS LAST, created_at DESC
       LIMIT 60`,
      [organizationId]
    );
    return rows.map((r) => ({
      id: r.id,
      label: `${r.make} ${r.model}${r.plate_display ? ` (${r.plate_display})` : ""}`.trim(),
    }));
  });
}
