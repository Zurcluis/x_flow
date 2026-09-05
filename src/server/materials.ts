import { getDb } from "@/lib/db";
import { Material } from "@/domains/materials/types";

type Row = Record<string, unknown>;

export async function listMaterials(organizationId: string): Promise<Material[]> {
  const db = getDb();
  const { rows } = await db.query<Row>(
    `SELECT * FROM materials WHERE organization_id = $1 ORDER BY name`,
    [organizationId]
  );
  if (rows.length === 0) return [];

  const { rows: batchRows } = await db.query<Row>(
    `SELECT * FROM material_batches WHERE organization_id = $1 ORDER BY received_date DESC`,
    [organizationId]
  );

  return rows.map((r) => {
    const materialId = String(r.id);
    const batches = batchRows
      .filter((b) => String(b.material_id) === materialId)
      .map((b) => ({
        id: String(b.id),
        organizationId: String(b.organization_id),
        materialId,
        batchNumber: String(b.batch_number),
        supplierName: String(b.supplier_name),
        receivedDate: String(b.received_date).slice(0, 10),
        initialMeters: Number(b.initial_meters),
        remainingMeters: Number(b.remaining_meters),
        expiryDate: b.expiry_date ? String(b.expiry_date).slice(0, 10) : undefined,
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
      currentStockMeters: Number(r.current_stock_meters),
      minimumStockAlertMeters: Number(r.minimum_stock_alert_meters),
      unit: (r.unit as Material["unit"]) ?? "meter",
      status: (r.status as Material["status"]) ?? "available",
      supplierName: (r.supplier_name as string) ?? undefined,
      batches,
    };
  });
}
