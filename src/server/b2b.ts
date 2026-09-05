import { getDb } from "@/lib/db";
import { getPrimaryOrganizationId } from "@/server/org";
import { B2BAccount, B2BVehicleEntry } from "@/domains/timebook/types";

type Row = Record<string, unknown>;

function num(value: unknown): number {
  return value === null || value === undefined ? 0 : Number(value);
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
              p.name AS technician
       FROM vehicle_customer_links l
       JOIN vehicles v ON v.id = l.vehicle_id
       LEFT JOIN work_orders w ON w.vehicle_id = v.id
       LEFT JOIN profiles p ON p.id = w.primary_technician_id
       WHERE l.customer_id = $1 AND l.is_current
       ORDER BY w.started_at DESC`,
      [customerId]
    );

    const { rows: billedRows } = await db.query<Row>(
      `SELECT COALESCE(SUM(total_amount),0) AS total,
              COALESCE(SUM(CASE WHEN payment_status = 'pending' THEN total_amount ELSE 0 END),0) AS pending
       FROM invoices WHERE customer_id = $1`,
      [customerId]
    );

    const fleetVehicles: B2BVehicleEntry[] = vehicleRows.map((v) => ({
      id: String(v.id),
      plate: String(v.plate_display ?? ""),
      make: String(v.make),
      model: String(v.model),
      service: (v.service_title as string) ?? "—",
      status: mapStatus((v.status as string) ?? null),
      deliveryDueDate: v.completed_at
        ? new Date(v.completed_at as string).toISOString().slice(0, 10)
        : "—",
      assignedTechnician: (v.technician as string) ?? "—",
      amountCents: Math.round(num(v.estimated_hours) * 33 * 100),
    }));

    accounts.push({
      id: customerId,
      companyName: String(r.name),
      tradeName: (r.legal_name as string) ?? String(r.name),
      nif: (r.nif as string) ?? "",
      contactPerson: (r.contact_person as string) ?? "—",
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

export { getPrimaryOrganizationId };
