import { getDb } from "@/lib/db";

export interface OrganizationSettings {
  googleReviewUrl: string;
  depositRequired: boolean;
  depositPercentage: number;
  depositFixedAmountCents: number | null;
  sidebarVisibleItems: string[];
}

const DEFAULT_SETTINGS: OrganizationSettings = {
  googleReviewUrl: "https://maps.app.goo.gl/W3RiGThiUjNGyNwX6",
  depositRequired: false,
  depositPercentage: 30.0,
  depositFixedAmountCents: null,
  sidebarVisibleItems: [],
};

export async function getOrganizationSettings(
  organizationId: string
): Promise<OrganizationSettings> {
  const { rows } = await getDb().query<{
    google_review_url: string | null;
    deposit_required: boolean | null;
    deposit_percentage: string | number | null;
    deposit_fixed_amount_cents: string | number | null;
    sidebar_visible_items: string[] | null;
  }>(
    `SELECT google_review_url, deposit_required, deposit_percentage, deposit_fixed_amount_cents, sidebar_visible_items
     FROM organization_settings
     WHERE organization_id = $1
     LIMIT 1`,
    [organizationId]
  );

  if (rows.length === 0) {
    return DEFAULT_SETTINGS;
  }

  const row = rows[0];
  return {
    googleReviewUrl: row.google_review_url || DEFAULT_SETTINGS.googleReviewUrl,
    depositRequired: Boolean(row.deposit_required),
    depositPercentage: row.deposit_percentage != null ? Number(row.deposit_percentage) : DEFAULT_SETTINGS.depositPercentage,
    depositFixedAmountCents: row.deposit_fixed_amount_cents != null ? Number(row.deposit_fixed_amount_cents) : null,
    sidebarVisibleItems: Array.isArray(row.sidebar_visible_items) ? row.sidebar_visible_items : [],
  };
}

export async function updateOrganizationSettings(
  organizationId: string,
  settings: Partial<OrganizationSettings>
): Promise<OrganizationSettings> {
  const current = await getOrganizationSettings(organizationId);
  const updated: OrganizationSettings = {
    ...current,
    ...settings,
  };

  await getDb().query(
    `INSERT INTO organization_settings (
       organization_id,
       google_review_url,
       deposit_required,
       deposit_percentage,
       deposit_fixed_amount_cents,
       sidebar_visible_items,
       updated_at
     ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
     ON CONFLICT (organization_id) DO UPDATE SET
       google_review_url = EXCLUDED.google_review_url,
       deposit_required = EXCLUDED.deposit_required,
       deposit_percentage = EXCLUDED.deposit_percentage,
       deposit_fixed_amount_cents = EXCLUDED.deposit_fixed_amount_cents,
       sidebar_visible_items = EXCLUDED.sidebar_visible_items,
       updated_at = NOW()`,
    [
      organizationId,
      updated.googleReviewUrl,
      updated.depositRequired,
      updated.depositPercentage,
      updated.depositFixedAmountCents,
      JSON.stringify(updated.sidebarVisibleItems),
    ]
  );

  return updated;
}
