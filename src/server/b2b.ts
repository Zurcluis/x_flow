import { getDb } from "@/lib/db";
import { B2BAccount, B2BVehicleEntry } from "@/domains/timebook/types";
import { workshopDateKey } from "@/domains/calendar/datetime";

type Row = Record<string, unknown>;

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function num(value: unknown): number {
  return value === null || value === undefined ? 0 : Number(value);
}

function assertUuid(value: string, label: string): void {
  if (typeof value !== "string" || !UUID_RE.test(value)) {
    throw new Error(`${label} inválido.`);
  }
}

function mapStatus(status: string | null): B2BVehicleEntry["status"] {
  switch (status) {
    case "in_progress":
    case "waiting_parts":
      return "in_production";
    case "quality_control":
      return "qc";
    case "completed":
      return "ready";
    case "delivered":
      return "delivered";
    default:
      return "scheduled";
  }
}

export async function listB2BAccounts(organizationId: string): Promise<B2BAccount[]> {
  assertUuid(organizationId, "Organização");
  const db = getDb();
  const { rows } = await db.query<Row>(
    `SELECT c.id, c.name, c.legal_name, c.nif, b.discount_rate, b.payment_terms_days,
            (SELECT name FROM customer_contacts ct WHERE ct.customer_id = c.id ORDER BY is_primary DESC LIMIT 1) AS contact_person,
            (SELECT email FROM customer_contacts ct WHERE ct.customer_id = c.id ORDER BY is_primary DESC LIMIT 1) AS contact_email,
            (SELECT phone FROM customer_contacts ct WHERE ct.customer_id = c.id ORDER BY is_primary DESC LIMIT 1) AS contact_phone
     FROM customers c
     JOIN b2b_accounts b ON b.customer_id = c.id
     WHERE c.organization_id = $1 AND c.type = 'business'
     ORDER BY c.name`,
    [organizationId]
  );

  const accounts: B2BAccount[] = [];
  for (const r of rows) {
    const customerId = String(r.id);

    const { rows: vehicleRows } = await db.query<Row>(
      `SELECT v.id, v.plate_display, v.make, v.model,
              w.status, w.service_title, w.completed_at, w.estimated_hours,
              p.name AS technician, inv.total_amount
       FROM vehicle_customer_links l
       JOIN vehicles v ON v.id = l.vehicle_id AND v.organization_id = l.organization_id
       LEFT JOIN LATERAL (
         SELECT w.*
         FROM work_orders w
         WHERE w.organization_id = $2 AND w.vehicle_id = v.id
         ORDER BY w.started_at DESC NULLS LAST, w.created_at DESC
         LIMIT 1
       ) w ON TRUE
       LEFT JOIN profiles p ON p.id = w.primary_technician_id
       LEFT JOIN LATERAL (
         SELECT i.total_amount
         FROM invoices i
         WHERE i.organization_id = $2
           AND i.work_order_id = w.id
           AND i.payment_status <> 'cancelled'
         ORDER BY i.issued_at DESC
         LIMIT 1
       ) inv ON TRUE
       WHERE l.organization_id = $2
         AND l.customer_id = $1
         AND l.is_current
       ORDER BY w.started_at DESC NULLS LAST`,
      [customerId, organizationId]
    );

    const { rows: billedRows } = await db.query<Row>(
      `SELECT COALESCE(SUM(total_amount),0) AS total,
              COALESCE(SUM(CASE WHEN payment_status IN ('pending','overdue') THEN total_amount ELSE 0 END),0) AS pending
       FROM invoices
       WHERE organization_id = $1 AND customer_id = $2 AND payment_status <> 'cancelled'`,
      [organizationId, customerId]
    );

    const fleetVehicles: B2BVehicleEntry[] = vehicleRows.map((v) => ({
      id: String(v.id),
      plate: String(v.plate_display ?? ""),
      make: String(v.make),
      model: String(v.model),
      service: (v.service_title as string) ?? "",
      status: mapStatus((v.status as string) ?? null),
      deliveryDueDate: v.completed_at
        ? workshopDateKey(new Date(v.completed_at as string))
        : "",
      assignedTechnician: (v.technician as string) ?? "",
      amountCents: Math.round(num(v.total_amount) * 100),
    }));

    accounts.push({
      id: customerId,
      companyName: String(r.name),
      tradeName: (r.legal_name as string) ?? String(r.name),
      nif: (r.nif as string) ?? "",
      contactPerson: (r.contact_person as string) ?? "",
      contactEmail: (r.contact_email as string) ?? "",
      contactPhone: (r.contact_phone as string) ?? "",
      discountRate: num(r.discount_rate),
      paymentTermsDays: num(r.payment_terms_days),
      currentBalanceCents: Math.round(num(billedRows[0]?.pending) * 100),
      totalBilledCents: Math.round(num(billedRows[0]?.total) * 100),
      fleetVehicles,
    });
  }
  return accounts;
}

export async function getB2BAccountById(
  organizationId: string,
  accountId: string
): Promise<B2BAccount | null> {
  assertUuid(organizationId, "Organização");
  if (typeof accountId !== "string" || !UUID_RE.test(accountId)) return null;
  const accounts = await listB2BAccounts(organizationId);
  return accounts.find((account) => account.id === accountId) ?? null;
}
