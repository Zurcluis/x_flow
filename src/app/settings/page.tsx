import { getDb } from "@/lib/db";
import { requireRole } from "@/server/auth";
import { SettingsView } from "./SettingsView";

export const dynamic = "force-dynamic";

type OrganizationRow = {
  name: string;
  timezone: string | null;
  locale: string | null;
  currency: string | null;
};

type LocationRow = {
  name: string;
  address: string | null;
  city: string | null;
  postal_code: string | null;
  email: string | null;
  phone: string | null;
};

export default async function SettingsPage() {
  const auth = await requireRole(["admin"]);
  let organization: OrganizationRow | null = null;
  let location: LocationRow | null = null;
  try {
    const { rows: orgRows } = await getDb().query<OrganizationRow>(
      `SELECT name, timezone, locale, currency FROM organizations WHERE id = $1 LIMIT 1`,
      [auth.organizationId]
    );
    organization = orgRows[0] ?? null;
    const { rows: locationRows } = await getDb().query<LocationRow>(
      `SELECT name, address, city, postal_code, email, phone
       FROM locations
       WHERE organization_id = $1
       ORDER BY is_primary DESC, created_at
       LIMIT 1`,
      [auth.organizationId]
    );
    location = locationRows[0] ?? null;
  } catch {
    organization = null;
    location = null;
  }

  return <SettingsView organization={organization} location={location} />;
}
