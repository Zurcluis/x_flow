import { notFound } from "next/navigation";
import { requirePublicToken } from "@/server/auth";
import { getWarrantyByToken } from "@/server/finance";
import { getDb } from "@/lib/db";
import { workshopDateKey } from "@/domains/calendar/datetime";
import type { WarrantyCertificate } from "@/domains/finance/types";
import { WarrantyCertificateView } from "./WarrantyCertificateView";

export const dynamic = "force-dynamic";

export default async function PublicWarrantyCertificatePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  if (typeof token !== "string" || token.length === 0 || token.length > 100) {
    notFound();
  }

  const { organizationId } = await requirePublicToken("warranty", token);
  const [warranty, dateResult] = await Promise.all([
    getWarrantyByToken(token),
    getDb().query<{ starts_at: string; expires_at: string }>(
      `SELECT to_char(starts_at, 'YYYY-MM-DD') AS starts_at,
              to_char(expires_at, 'YYYY-MM-DD') AS expires_at
       FROM warranties
       WHERE organization_id = $1 AND token = $2`,
      [organizationId, token]
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
    <WarrantyCertificateView
      warranty={{
        ...warranty,
        startsAt: dates.starts_at,
        expiresAt: dates.expires_at,
        status,
      }}
    />
  );
}
