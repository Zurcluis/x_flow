import { getDb } from "@/lib/db";
import { Material } from "@/domains/materials/types";
import { resolveStockStatus } from "@/domains/materials/stock";

type Row = Record<string, unknown>;

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function assertOrganizationId(organizationId: string): void {
  if (typeof organizationId !== "string" || !UUID_RE.test(organizationId)) {
    throw new Error("Organização inválida.");
  }
}

export async function listMaterials(organizationId: string): Promise<Material[]> {
  assertOrganizationId(organizationId);
  const db = getDb();
  const { rows } = await db.query<Row>(
    `SELECT id, organization_id, brand, name, type, thickness_microns, finish,
            roll_width_meters, cost_per_meter, price_per_meter, current_stock_meters,
            minimum_stock_alert_meters, unit, supplier_name
     FROM materials
     WHERE organization_id = $1
     ORDER BY name`,
    [organizationId]
  );
  if (rows.length === 0) return [];

  const { rows: batchRows } = await db.query<Row>(
    `SELECT b.*,
            to_char(b.received_date, 'YYYY-MM-DD') AS received_date_key,
            to_char(b.expiry_date, 'YYYY-MM-DD') AS expiry_date_key
     FROM material_batches b
     JOIN materials m ON m.id = b.material_id AND m.organization_id = b.organization_id
     WHERE b.organization_id = $1
     ORDER BY b.received_date DESC`,
    [organizationId]
  );

  return rows.map((r) => {
    const materialId = String(r.id);
    const currentStockMeters = Number(r.current_stock_meters);
    const minimumStockAlertMeters = Number(r.minimum_stock_alert_meters);
    const batches = batchRows
      .filter((b) => String(b.material_id) === materialId)
      .map((b) => ({
        id: String(b.id),
        organizationId: String(b.organization_id),
        materialId,
        batchNumber: String(b.batch_number),
        supplierName: String(b.supplier_name),
        receivedDate: String(b.received_date_key ?? ""),
        initialMeters: Number(b.initial_meters),
        remainingMeters: Number(b.remaining_meters),
        expiryDate: b.expiry_date_key ? String(b.expiry_date_key) : undefined,
      }));

    return {
      id: materialId,
      organizationId: String(r.organization_id),
      brand: String(r.brand),
      name: String(r.name),
      type: r.type as Material["type"],
      thicknessMicrons: r.thickness_microns ? Number(r.thickness_microns) : undefined,
      finish: String(r.finish),
      rollWidthMeters: Number(r.roll_width_meters),
      costPerMeter: Number(r.cost_per_meter),
      pricePerMeter: Number(r.price_per_meter),
      currentStockMeters,
      minimumStockAlertMeters,
      unit: (r.unit as Material["unit"]) ?? "meter",
      status: resolveStockStatus(currentStockMeters, minimumStockAlertMeters),
      supplierName: (r.supplier_name as string) ?? undefined,
      batches,
    };
  });
}
