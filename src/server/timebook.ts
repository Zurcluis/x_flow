import { getDb } from "@/lib/db";
import { buildTimeBookModels, type TimeBookEntryRow } from "@/domains/timebook/benchmarks";
import type { VehicleTimeBookModel } from "@/domains/timebook/types";

type Row = Record<string, unknown>;

export async function listTimeBookBenchmarks(
  organizationId: string
): Promise<VehicleTimeBookModel[]> {
  const { rows } = await getDb().query<Row>(
    `SELECT v.make, v.model, v.generation_year, v.body_type,
            v.id AS vehicle_id, w.service_title, w.id AS work_order_id, w.estimated_hours,
            te.phase_key, te.hours_spent, te.notes
     FROM work_order_time_entries te
     JOIN work_orders w ON w.id = te.work_order_id
     JOIN vehicles v ON v.id = w.vehicle_id
     WHERE w.organization_id = $1 AND w.status = 'completed'
       AND v.organization_id = w.organization_id
     ORDER BY v.make, v.model, v.generation_year, v.body_type, w.service_title, w.id, te.phase_key`,
    [organizationId]
  );

  const entries: TimeBookEntryRow[] = rows.map((row) => ({
    make: String(row.make),
    model: String(row.model),
    generationYear: Number(row.generation_year ?? 0),
    bodyType: String(row.body_type ?? ""),
    vehicleId: String(row.vehicle_id),
    serviceTitle: String(row.service_title ?? ""),
    workOrderId: String(row.work_order_id),
    estimatedHours: Number(row.estimated_hours ?? 0),
    phaseKey: String(row.phase_key),
    hoursSpent: Number(row.hours_spent ?? 0),
    notes: (row.notes as string | null) ?? null,
  }));

  return buildTimeBookModels(entries);
}
