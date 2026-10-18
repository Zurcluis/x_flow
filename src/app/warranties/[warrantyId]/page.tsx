import { notFound } from "next/navigation";
import { WarrantyDetailView } from "./WarrantyDetailView";
import { getWarrantyById } from "@/server/finance";
import { requireRole } from "@/server/auth";
import { SCHEDULING_ROLES } from "@/lib/roles";
import { getDb } from "@/lib/db";
import { workshopDateKey } from "@/domains/calendar/datetime";
import type { WarrantyCertificate } from "@/domains/finance/types";

export const dynamic = "force-dynamic";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default async function WarrantyDetailPage({
  params,
}: {
  params: Promise<{ warrantyId: string }>;
}) {
  const auth = await requireRole(SCHEDULING_ROLES);
  const { warrantyId } = await params;
  if (!UUID_RE.test(warrantyId)) notFound();

  const [warranty, dateResult] = await Promise.all([
    getWarrantyById(auth.organizationId, warrantyId),
    getDb().query<{ starts_at: string; expires_at: string }>(
      `SELECT to_char(starts_at, 'YYYY-MM-DD') AS starts_at,
              to_char(expires_at, 'YYYY-MM-DD') AS expires_at
       FROM warranties
       WHERE organization_id = $1 AND id = $2`,
      [auth.organizationId, warrantyId]
    ),
  ]);
  const dates = dateResult.rows[0];
  if (!warranty || !dates) notFound();

  let status: WarrantyCertificate["status"] = warranty.status;
  if (status !== "revoked") {
    status =
      status === "expired" || dates.expires_at < workshopDateKey(new Date())
        ? "expired"
        : "active";
  }

  return (
    <WarrantyDetailView
      warranty={{
        ...warranty,
        startsAt: dates.starts_at,
        expiresAt: dates.expires_at,
        status,
      }}
    />
  );
}
