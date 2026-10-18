import { WarrantiesView, WarrantyRecord } from "./WarrantiesView";
import { listWarranties } from "@/server/finance";
import { listWorkOrders } from "@/server/production";
import { requireRole } from "@/server/auth";
import { SCHEDULING_ROLES } from "@/lib/roles";
import { getDb } from "@/lib/db";
import { workshopDateKey } from "@/domains/calendar/datetime";

export const dynamic = "force-dynamic";

interface WarrantyDates {
  startsAt: string;
  expiresAt: string;
}

function effectiveStatus(
  status: WarrantyRecord["status"],
  expiresAt: string,
  todayKey: string
): WarrantyRecord["status"] {
  if (status === "revoked") return "revoked";
  if (status === "expired") return "expired";
  if (expiresAt && expiresAt < todayKey) return "expired";
  return "active";
}

async function loadWarrantyDates(
  organizationId: string,
  warrantyIds: string[]
): Promise<Map<string, WarrantyDates>> {
  if (warrantyIds.length === 0) return new Map();
  const { rows } = await getDb().query<{
    id: string;
    starts_at: string;
    expires_at: string;
  }>(
    `SELECT id,
            to_char(starts_at, 'YYYY-MM-DD') AS starts_at,
            to_char(expires_at, 'YYYY-MM-DD') AS expires_at
     FROM warranties
     WHERE organization_id = $1 AND id = ANY($2::uuid[])`,
    [organizationId, warrantyIds]
  );
  return new Map(
    rows.map((row) => [
      row.id,
      { startsAt: row.starts_at, expiresAt: row.expires_at },
    ])
  );
}

export default async function WarrantiesPage() {
  const auth = await requireRole(SCHEDULING_ROLES);
  const [warranties, workOrders] = await Promise.all([
    listWarranties(auth.organizationId),
    listWorkOrders(auth.organizationId),
  ]);
  const dates = await loadWarrantyDates(
    auth.organizationId,
    warranties.map((warranty) => warranty.id)
  );
  const todayKey = workshopDateKey(new Date());

  const records: WarrantyRecord[] = warranties.map((w) => {
    const workOrder = workOrders.find((o) => o.id === w.workOrderId);
    const date = dates.get(w.id);
    return {
      id: w.id,
      token: w.token,
      vehiclePlate: w.vehiclePlate,
      vehicleModel: w.vehicleModel,
      customerName: w.customerName,
      serviceName: workOrder?.serviceTitle ?? "Serviço não identificado",
      materialUsed: w.materialName,
      batchNumber: w.batchNumber,
      yearsWarranty: w.warrantyYears,
      certificateNumber: w.certificateNumber,
      qcCertificateNumber: w.qcCertificateNumber,
      issuedAt: date?.startsAt ?? "",
      expiresAt: date?.expiresAt ?? "",
      status: effectiveStatus(w.status, date?.expiresAt ?? "", todayKey),
    };
  });

  return <WarrantiesView initialWarranties={records} />;
}
