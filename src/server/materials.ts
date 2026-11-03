import { getDb, waitForBootstrap } from "@/lib/db";
import {
  calculateRemnantAreaM2,
  Material,
  MaterialRemnant,
  MaterialType,
  MaterialUnit,
  PurchaseOrder,
} from "@/domains/materials/types";
import { resolveStockStatus } from "@/domains/materials/stock";

type Row = Record<string, unknown>;

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const VALID_MATERIAL_TYPES: readonly MaterialType[] = [
  "ppf_gloss",
  "ppf_matte",
  "color_ppf",
  "cast_vinyl",
  "ceramic",
  "tint",
];

const VALID_UNITS: readonly MaterialUnit[] = ["meter", "bottle", "kit"];

function assertOrganizationId(organizationId: string): void {
  if (typeof organizationId !== "string" || !UUID_RE.test(organizationId)) {
    throw new Error("Organização inválida.");
  }
}

function assertUuid(value: string, label: string): void {
  if (typeof value !== "string" || !UUID_RE.test(value)) {
    throw new Error(`${label} inválido.`);
  }
}

function iso(value: unknown): string {
  if (!value) return "";
  return value instanceof Date ? value.toISOString() : String(value);
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
     ORDER BY b.received_date DESC, b.created_at DESC`,
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

export interface CreateOrUpdateMaterialInput {
  id?: string;
  brand: string;
  name: string;
  type: MaterialType;
  thicknessMicrons?: number;
  finish: string;
  rollWidthMeters?: number;
  costPerMeter: number;
  pricePerMeter: number;
  minimumStockAlertMeters?: number;
  unit?: MaterialUnit;
  supplierName?: string;
  initialBatchNumber?: string;
  initialMeters?: number;
}

export async function createOrUpdateMaterial(
  organizationId: string,
  input: CreateOrUpdateMaterialInput,
  authorName?: string
): Promise<{ ok: boolean; id?: string; error?: string }> {
  const db = getDb();
  const client = await db.connect();
  try {
    await waitForBootstrap(client);
    assertOrganizationId(organizationId);

    const brand = input.brand?.trim().slice(0, 100);
    const name = input.name?.trim().slice(0, 255);
    const finish = input.finish?.trim().slice(0, 50) || "Gloss";
    if (!brand || !name) {
      throw new Error("A marca e o nome do material são obrigatórios.");
    }
    if (!VALID_MATERIAL_TYPES.includes(input.type)) {
      throw new Error("Tipo de material inválido.");
    }
    const unit: MaterialUnit =
      input.unit && VALID_UNITS.includes(input.unit) ? input.unit : "meter";
    const rollWidthMeters =
      Number.isFinite(input.rollWidthMeters) && Number(input.rollWidthMeters) > 0
        ? Number(input.rollWidthMeters)
        : 1.52;
    const costPerMeter = Math.max(0, Number(input.costPerMeter) || 0);
    const pricePerMeter = Math.max(0, Number(input.pricePerMeter) || 0);
    const minimumStockAlertMeters = Math.max(
      0,
      Number.isFinite(input.minimumStockAlertMeters)
        ? Number(input.minimumStockAlertMeters)
        : 15
    );
    const thicknessMicrons =
      input.thicknessMicrons && Number(input.thicknessMicrons) > 0
        ? Math.round(Number(input.thicknessMicrons))
        : null;
    const supplierName = input.supplierName?.trim().slice(0, 255) || null;
    const author = authorName?.trim().slice(0, 150) || "Equipa X-Motion";

    await client.query("BEGIN");

    if (input.id) {
      assertUuid(input.id, "Material");
      const { rows: existing } = await client.query<Row>(
        `SELECT current_stock_meters FROM materials WHERE id = $1 AND organization_id = $2 FOR UPDATE`,
        [input.id, organizationId]
      );
      if (existing.length === 0) {
        throw new Error("Material não encontrado.");
      }
      const currentStock = Number(existing[0].current_stock_meters);
      const status = resolveStockStatus(currentStock, minimumStockAlertMeters);

      await client.query(
        `UPDATE materials
         SET brand = $3, name = $4, type = $5, thickness_microns = $6, finish = $7,
             roll_width_meters = $8, cost_per_meter = $9, price_per_meter = $10,
             minimum_stock_alert_meters = $11, unit = $12, status = $13,
             supplier_name = $14, updated_at = NOW()
         WHERE id = $1 AND organization_id = $2`,
        [
          input.id,
          organizationId,
          brand,
          name,
          input.type,
          thicknessMicrons,
          finish,
          rollWidthMeters,
          costPerMeter,
          pricePerMeter,
          minimumStockAlertMeters,
          unit,
          status,
          supplierName,
        ]
      );
      await client.query("COMMIT");
      return { ok: true, id: input.id };
    }

    const initialMeters =
      input.initialMeters && Number(input.initialMeters) > 0
        ? Math.round(Number(input.initialMeters) * 100) / 100
        : 0;
    const initialBatchNumber = input.initialBatchNumber?.trim().slice(0, 100);
    const status = resolveStockStatus(initialMeters, minimumStockAlertMeters);

    const { rows: created } = await client.query<Row>(
      `INSERT INTO materials (
         organization_id, brand, name, type, thickness_microns, finish,
         roll_width_meters, cost_per_meter, price_per_meter,
         current_stock_meters, minimum_stock_alert_meters, unit, status, supplier_name
       )
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
       RETURNING id`,
      [
        organizationId,
        brand,
        name,
        input.type,
        thicknessMicrons,
        finish,
        rollWidthMeters,
        costPerMeter,
        pricePerMeter,
        initialMeters,
        minimumStockAlertMeters,
        unit,
        status,
        supplierName,
      ]
    );
    const materialId = String(created[0].id);

    if (initialBatchNumber && initialMeters > 0) {
      const { rows: batchRows } = await client.query<Row>(
        `INSERT INTO material_batches (
           organization_id, material_id, batch_number, supplier_name,
           received_date, initial_meters, remaining_meters
         )
         VALUES ($1,$2,$3,$4,CURRENT_DATE,$5,$5)
         RETURNING id`,
        [
          organizationId,
          materialId,
          initialBatchNumber,
          supplierName ?? brand,
          initialMeters,
        ]
      );
      const batchId = String(batchRows[0].id);

      await client.query(
        `INSERT INTO material_movements (
           organization_id, material_id, batch_id, movement_type, meters, notes, author_name
         )
         VALUES ($1,$2,$3,'entry',$4,$5,$6)`,
        [
          organizationId,
          materialId,
          batchId,
          initialMeters,
          `Stock inicial (${initialBatchNumber})`,
          author,
        ]
      );
    }

    await client.query("COMMIT");
    return { ok: true, id: materialId };
  } catch (e) {
    await client.query("ROLLBACK").catch(() => {});
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Erro ao guardar material.",
    };
  } finally {
    client.release();
  }
}

export async function addMaterialBatch(
  organizationId: string,
  input: {
    materialId: string;
    batchNumber: string;
    supplierName: string;
    meters: number;
    costPerMeter?: number;
  },
  authorName?: string
): Promise<{ ok: boolean; batchId?: string; error?: string }> {
  const db = getDb();
  const client = await db.connect();
  try {
    await waitForBootstrap(client);
    assertOrganizationId(organizationId);
    assertUuid(input.materialId, "Material");

    const batchNumber = input.batchNumber?.trim().slice(0, 100);
    if (!batchNumber) {
      throw new Error("O número de lote é obrigatório.");
    }
    const meters = Math.round((Number(input.meters) || 0) * 100) / 100;
    if (meters <= 0) {
      throw new Error("A metragem de entrada tem de ser superior a zero.");
    }

    await client.query("BEGIN");

    const { rows: matRows } = await client.query<Row>(
      `SELECT id, brand, current_stock_meters, minimum_stock_alert_meters, cost_per_meter, supplier_name
       FROM materials
       WHERE id = $1 AND organization_id = $2
       FOR UPDATE`,
      [input.materialId, organizationId]
    );
    if (matRows.length === 0) {
      throw new Error("Material não encontrado.");
    }
    const mat = matRows[0];
    const supplierName =
      input.supplierName?.trim().slice(0, 255) ||
      (mat.supplier_name ? String(mat.supplier_name) : String(mat.brand));

    const { rows: batchRows } = await client.query<Row>(
      `INSERT INTO material_batches (
         organization_id, material_id, batch_number, supplier_name,
         received_date, initial_meters, remaining_meters
       )
       VALUES ($1,$2,$3,$4,CURRENT_DATE,$5,$5)
       RETURNING id`,
      [organizationId, input.materialId, batchNumber, supplierName, meters]
    );
    const batchId = String(batchRows[0].id);

    const newStock =
      Math.round((Number(mat.current_stock_meters) + meters) * 100) / 100;
    const minStock = Number(mat.minimum_stock_alert_meters);
    const newStatus = resolveStockStatus(newStock, minStock);
    const nextCost =
      input.costPerMeter !== undefined && Number(input.costPerMeter) > 0
        ? Number(input.costPerMeter)
        : Number(mat.cost_per_meter);

    await client.query(
      `UPDATE materials
       SET current_stock_meters = $3,
           status = $4,
           cost_per_meter = $5,
           supplier_name = $6,
           updated_at = NOW()
       WHERE id = $1 AND organization_id = $2`,
      [
        input.materialId,
        organizationId,
        newStock,
        newStatus,
        nextCost,
        supplierName,
      ]
    );

    const author = authorName?.trim().slice(0, 150) || "Equipa X-Motion";
    await client.query(
      `INSERT INTO material_movements (
         organization_id, material_id, batch_id, movement_type, meters, notes, author_name
       )
       VALUES ($1,$2,$3,'entry',$4,$5,$6)`,
      [
        organizationId,
        input.materialId,
        batchId,
        meters,
        `Entrada de rolo · Lote ${batchNumber}`,
        author,
      ]
    );

    await client.query("COMMIT");
    return { ok: true, batchId };
  } catch (e) {
    await client.query("ROLLBACK").catch(() => {});
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Erro ao registar entrada de rolo.",
    };
  } finally {
    client.release();
  }
}

export async function registerMaterialCut(
  organizationId: string,
  input: {
    materialId: string;
    batchId?: string;
    metersCut: number;
    estimatedMeters?: number;
    workOrderId?: string;
    createRemnant?: {
      widthCm: number;
      lengthCm: number;
      location: string;
      notes?: string;
    };
    notes?: string;
  },
  authorName?: string
): Promise<{ ok: boolean; error?: string }> {
  const db = getDb();
  const client = await db.connect();
  try {
    await waitForBootstrap(client);
    assertOrganizationId(organizationId);
    assertUuid(input.materialId, "Material");

    const metersCut = Math.round((Number(input.metersCut) || 0) * 100) / 100;
    if (metersCut <= 0) {
      throw new Error("A metragem cortada tem de ser superior a zero.");
    }
    if (input.workOrderId) {
      assertUuid(input.workOrderId, "Ordem de trabalho");
    }

    await client.query("BEGIN");

    const { rows: matRows } = await client.query<Row>(
      `SELECT id, brand, name, current_stock_meters, minimum_stock_alert_meters
       FROM materials
       WHERE id = $1 AND organization_id = $2
       FOR UPDATE`,
      [input.materialId, organizationId]
    );
    if (matRows.length === 0) {
      throw new Error("Material não encontrado.");
    }
    const mat = matRows[0];
    const currentStock = Number(mat.current_stock_meters);
    if (metersCut > currentStock) {
      throw new Error(
        `Stock insuficiente (${currentStock} m disponíveis para cortar ${metersCut} m).`
      );
    }

    let batchId: string | null = null;
    let batchNumber = "LOTE-OFICINA";

    if (input.batchId && UUID_RE.test(input.batchId)) {
      const { rows: bRows } = await client.query<Row>(
        `SELECT id, batch_number, remaining_meters
         FROM material_batches
         WHERE id = $1 AND material_id = $2 AND organization_id = $3
         FOR UPDATE`,
        [input.batchId, input.materialId, organizationId]
      );
      if (bRows.length > 0) {
        batchId = String(bRows[0].id);
        batchNumber = String(bRows[0].batch_number);
      }
    } else {
      const { rows: bRows } = await client.query<Row>(
        `SELECT id, batch_number, remaining_meters
         FROM material_batches
         WHERE material_id = $1 AND organization_id = $2 AND remaining_meters > 0
         ORDER BY received_date ASC, created_at ASC
         LIMIT 1
         FOR UPDATE`,
        [input.materialId, organizationId]
      );
      if (bRows.length > 0) {
        batchId = String(bRows[0].id);
        batchNumber = String(bRows[0].batch_number);
      }
    }

    if (batchId) {
      await client.query(
        `UPDATE material_batches
         SET remaining_meters = GREATEST(0, remaining_meters - $1)
         WHERE id = $2 AND organization_id = $3`,
        [metersCut, batchId, organizationId]
      );
    }

    const newStock = Math.max(0, Math.round((currentStock - metersCut) * 100) / 100);
    const minStock = Number(mat.minimum_stock_alert_meters);
    const newStatus = resolveStockStatus(newStock, minStock);

    await client.query(
      `UPDATE materials
       SET current_stock_meters = $3,
           status = $4,
           updated_at = NOW()
       WHERE id = $1 AND organization_id = $2`,
      [input.materialId, organizationId, newStock, newStatus]
    );

    const author = authorName?.trim().slice(0, 150) || "Equipa X-Motion";
    const cutNotes = input.notes?.trim().slice(0, 500) || null;

    await client.query(
      `INSERT INTO material_movements (
         organization_id, material_id, batch_id, work_order_id,
         movement_type, meters, notes, author_name
       )
       VALUES ($1,$2,$3,$4,'cut',$5,$6,$7)`,
      [
        organizationId,
        input.materialId,
        batchId,
        input.workOrderId ?? null,
        metersCut,
        cutNotes,
        author,
      ]
    );

    if (input.workOrderId) {
      const { rows: woRows } = await client.query<Row>(
        `SELECT id FROM work_orders WHERE id = $1 AND organization_id = $2`,
        [input.workOrderId, organizationId]
      );
      if (woRows.length === 0) {
        throw new Error("Ordem de trabalho não encontrada.");
      }
      const materialFullName = `${String(mat.brand)} ${String(mat.name)}`.trim().slice(0, 150);
      const estimatedMeters =
        input.estimatedMeters && Number(input.estimatedMeters) > 0
          ? Math.round(Number(input.estimatedMeters) * 100) / 100
          : metersCut;
      const scrapPercentage =
        estimatedMeters > 0 && metersCut > estimatedMeters
          ? Math.round(((metersCut - estimatedMeters) / estimatedMeters) * 10000) / 100
          : 0;

      await client.query(
        `INSERT INTO work_order_material_usages (
           work_order_id, material_id, material_name, batch_number,
           estimated_meters, actual_meters, scrap_percentage
         )
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [
          input.workOrderId,
          input.materialId,
          materialFullName,
          batchNumber,
          estimatedMeters,
          metersCut,
          scrapPercentage,
        ]
      );
    }

    if (input.createRemnant) {
      const widthCm = Math.round(Number(input.createRemnant.widthCm) || 0);
      const lengthCm = Math.round(Number(input.createRemnant.lengthCm) || 0);
      if (widthCm <= 0 || lengthCm <= 0) {
        throw new Error("As dimensões do retalho (largura e comprimento em cm) têm de ser positivas.");
      }
      const location =
        input.createRemnant.location?.trim().slice(0, 150) || "Estante de Retalhos";
      const remnantNotes = input.createRemnant.notes?.trim().slice(0, 500) || cutNotes;

      await client.query(
        `INSERT INTO material_remnants (
           organization_id, material_id, batch_number,
           width_cm, length_cm, location, status, notes
         )
         VALUES ($1,$2,$3,$4,$5,$6,'available',$7)`,
        [
          organizationId,
          input.materialId,
          batchNumber,
          widthCm,
          lengthCm,
          location,
          remnantNotes,
        ]
      );

      const remnantLinearMeters = Math.round((lengthCm / 100) * 100) / 100;
      await client.query(
        `INSERT INTO material_movements (
           organization_id, material_id, batch_id, work_order_id,
           movement_type, meters, notes, author_name
         )
         VALUES ($1,$2,$3,$4,'remnant_created',$5,$6,$7)`,
        [
          organizationId,
          input.materialId,
          batchId,
          input.workOrderId ?? null,
          remnantLinearMeters,
          `Retalho ${widthCm}x${lengthCm} cm (${location})`,
          author,
        ]
      );
    }

    await client.query("COMMIT");
    return { ok: true };
  } catch (e) {
    await client.query("ROLLBACK").catch(() => {});
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Erro ao registar corte de material.",
    };
  } finally {
    client.release();
  }
}

export async function listMaterialRemnants(
  organizationId: string
): Promise<MaterialRemnant[]> {
  assertOrganizationId(organizationId);
  const { rows } = await getDb().query<Row>(
    `SELECT r.*, m.name AS material_name, m.brand AS material_brand
     FROM material_remnants r
     JOIN materials m ON m.id = r.material_id AND m.organization_id = r.organization_id
     WHERE r.organization_id = $1
     ORDER BY
       CASE r.status WHEN 'available' THEN 0 WHEN 'used' THEN 1 ELSE 2 END,
       r.created_at DESC`,
    [organizationId]
  );

  return rows.map((r) => {
    const widthCm = Number(r.width_cm);
    const lengthCm = Number(r.length_cm);
    return {
      id: String(r.id),
      materialId: String(r.material_id),
      materialName: String(r.material_name),
      brand: String(r.material_brand),
      batchNumber: r.batch_number ? String(r.batch_number) : undefined,
      widthCm,
      lengthCm,
      areaM2: calculateRemnantAreaM2(widthCm, lengthCm),
      location: String(r.location),
      status: r.status as MaterialRemnant["status"],
      usedWorkOrderId: r.used_work_order_id ? String(r.used_work_order_id) : undefined,
      notes: r.notes ? String(r.notes) : undefined,
      createdAt: iso(r.created_at),
      usedAt: r.used_at ? iso(r.used_at) : undefined,
    };
  });
}

export async function createMaterialRemnant(
  organizationId: string,
  input: {
    materialId: string;
    batchNumber?: string;
    widthCm: number;
    lengthCm: number;
    location: string;
    notes?: string;
  },
  authorName?: string
): Promise<{ ok: boolean; id?: string; error?: string }> {
  const db = getDb();
  const client = await db.connect();
  try {
    await waitForBootstrap(client);
    assertOrganizationId(organizationId);
    assertUuid(input.materialId, "Material");

    const widthCm = Math.round(Number(input.widthCm) || 0);
    const lengthCm = Math.round(Number(input.lengthCm) || 0);
    if (widthCm <= 0 || lengthCm <= 0) {
      throw new Error("A largura e o comprimento em cm têm de ser superiores a zero.");
    }
    const location = input.location?.trim().slice(0, 150) || "Estante de Retalhos";
    const batchNumber = input.batchNumber?.trim().slice(0, 100) || null;
    const notes = input.notes?.trim().slice(0, 500) || null;
    const author = authorName?.trim().slice(0, 150) || "Equipa X-Motion";

    await client.query("BEGIN");

    const { rows: matRows } = await client.query<Row>(
      `SELECT id FROM materials WHERE id = $1 AND organization_id = $2`,
      [input.materialId, organizationId]
    );
    if (matRows.length === 0) {
      throw new Error("Material não encontrado.");
    }

    const { rows } = await client.query<Row>(
      `INSERT INTO material_remnants (
         organization_id, material_id, batch_number,
         width_cm, length_cm, location, status, notes
       )
       VALUES ($1,$2,$3,$4,$5,$6,'available',$7)
       RETURNING id`,
      [
        organizationId,
        input.materialId,
        batchNumber,
        widthCm,
        lengthCm,
        location,
        notes,
      ]
    );
    const remnantId = String(rows[0].id);

    await client.query(
      `INSERT INTO material_movements (
         organization_id, material_id, movement_type, meters, notes, author_name
       )
       VALUES ($1,$2,'remnant_created',$3,$4,$5)`,
      [
        organizationId,
        input.materialId,
        Math.round((lengthCm / 100) * 100) / 100,
        `Retalho ${widthCm}x${lengthCm} cm (${location})`,
        author,
      ]
    );

    await client.query("COMMIT");
    return { ok: true, id: remnantId };
  } catch (e) {
    await client.query("ROLLBACK").catch(() => {});
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Erro ao registar retalho.",
    };
  } finally {
    client.release();
  }
}

export async function useMaterialRemnant(
  organizationId: string,
  remnantId: string,
  workOrderId?: string,
  authorName?: string
): Promise<{ ok: boolean; error?: string }> {
  const db = getDb();
  const client = await db.connect();
  try {
    await waitForBootstrap(client);
    assertOrganizationId(organizationId);
    assertUuid(remnantId, "Retalho");
    if (workOrderId) {
      assertUuid(workOrderId, "Ordem de trabalho");
    }

    await client.query("BEGIN");

    const { rows } = await client.query<Row>(
      `UPDATE material_remnants
       SET status = 'used',
           used_at = NOW(),
           used_work_order_id = COALESCE($3, used_work_order_id)
       WHERE id = $1 AND organization_id = $2 AND status = 'available'
       RETURNING material_id, width_cm, length_cm, location`,
      [remnantId, organizationId, workOrderId ?? null]
    );
    if (rows.length === 0) {
      throw new Error("Retalho não encontrado ou já utilizado.");
    }
    const r = rows[0];
    const author = authorName?.trim().slice(0, 150) || "Equipa X-Motion";

    await client.query(
      `INSERT INTO material_movements (
         organization_id, material_id, work_order_id,
         movement_type, meters, notes, author_name
       )
       VALUES ($1,$2,$3,'remnant_used',$4,$5,$6)`,
      [
        organizationId,
        String(r.material_id),
        workOrderId ?? null,
        Math.round((Number(r.length_cm) / 100) * 100) / 100,
        `Retalho utilizado (${Number(r.width_cm)}x${Number(r.length_cm)} cm · ${String(r.location)})`,
        author,
      ]
    );

    await client.query("COMMIT");
    return { ok: true };
  } catch (e) {
    await client.query("ROLLBACK").catch(() => {});
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Erro ao utilizar retalho.",
    };
  } finally {
    client.release();
  }
}

function mapPurchaseOrder(r: Row): PurchaseOrder {
  const quantityRolls = Number(r.quantity_rolls);
  const metersPerRoll = Number(r.meters_per_roll);
  return {
    id: String(r.id),
    orderNumber: String(r.order_number),
    supplierName: String(r.supplier_name),
    supplierPhone: r.supplier_phone ? String(r.supplier_phone) : undefined,
    supplierEmail: r.supplier_email ? String(r.supplier_email) : undefined,
    materialId: r.material_id ? String(r.material_id) : undefined,
    materialName: String(r.material_name),
    quantityRolls,
    metersPerRoll,
    totalMeters: Math.round(quantityRolls * metersPerRoll * 100) / 100,
    estimatedCost:
      r.estimated_cost !== null && r.estimated_cost !== undefined
        ? Number(r.estimated_cost)
        : undefined,
    status: r.status as PurchaseOrder["status"],
    sentVia: r.sent_via ? (String(r.sent_via) as "whatsapp" | "email") : undefined,
    notes: r.notes ? String(r.notes) : undefined,
    createdAt: iso(r.created_at),
    sentAt: r.sent_at ? iso(r.sent_at) : undefined,
    receivedAt: r.received_at ? iso(r.received_at) : undefined,
  };
}

export async function listPurchaseOrders(
  organizationId: string
): Promise<PurchaseOrder[]> {
  assertOrganizationId(organizationId);
  const { rows } = await getDb().query<Row>(
    `SELECT *
     FROM purchase_orders
     WHERE organization_id = $1
     ORDER BY created_at DESC`,
    [organizationId]
  );
  return rows.map(mapPurchaseOrder);
}

export async function createPurchaseOrder(
  organizationId: string,
  input: {
    materialId?: string;
    materialName?: string;
    supplierName: string;
    supplierPhone?: string;
    supplierEmail?: string;
    quantityRolls: number;
    metersPerRoll: number;
    estimatedCost?: number;
    notes?: string;
  }
): Promise<{ ok: boolean; order?: PurchaseOrder; error?: string }> {
  const db = getDb();
  const client = await db.connect();
  try {
    await waitForBootstrap(client);
    assertOrganizationId(organizationId);

    const supplierName = input.supplierName?.trim().slice(0, 255);
    if (!supplierName) {
      throw new Error("O nome do fornecedor é obrigatório.");
    }
    const quantityRolls = Math.max(1, Math.round(Number(input.quantityRolls) || 1));
    const metersPerRoll = Math.round((Number(input.metersPerRoll) || 15) * 100) / 100;
    if (metersPerRoll <= 0) {
      throw new Error("Os metros por rolo têm de ser superiores a zero.");
    }

    await client.query("BEGIN");

    let materialId: string | null = null;
    let resolvedMaterialName = input.materialName?.trim().slice(0, 255) || "";
    let defaultCostPerMeter = 0;

    if (input.materialId && UUID_RE.test(input.materialId)) {
      const { rows: matRows } = await client.query<Row>(
        `SELECT id, brand, name, cost_per_meter
         FROM materials
         WHERE id = $1 AND organization_id = $2`,
        [input.materialId, organizationId]
      );
      if (matRows.length > 0) {
        materialId = String(matRows[0].id);
        defaultCostPerMeter = Number(matRows[0].cost_per_meter);
        if (!resolvedMaterialName) {
          resolvedMaterialName = `${String(matRows[0].brand)} ${String(matRows[0].name)}`.trim();
        }
      }
    }

    if (!resolvedMaterialName) {
      throw new Error("Indica o material ou película a encomendar.");
    }

    const year = new Date().getFullYear();
    const { rows: countRows } = await client.query<Row>(
      `SELECT count(*)::int AS cnt FROM purchase_orders WHERE organization_id = $1`,
      [organizationId]
    );
    const seq = Number(countRows[0]?.cnt ?? 0) + 1;
    const suffix = String(seq).padStart(4, "0");
    const rand = Math.floor(100 + Math.random() * 900);
    const orderNumber = `PO-${year}-${suffix}-${rand}`;

    const estimatedCost =
      input.estimatedCost !== undefined && Number(input.estimatedCost) >= 0
        ? Math.round(Number(input.estimatedCost) * 100) / 100
        : defaultCostPerMeter > 0
          ? Math.round(quantityRolls * metersPerRoll * defaultCostPerMeter * 100) / 100
          : null;

    const { rows } = await client.query<Row>(
      `INSERT INTO purchase_orders (
         organization_id, order_number, supplier_name, supplier_phone, supplier_email,
         material_id, material_name, quantity_rolls, meters_per_roll, estimated_cost,
         status, notes
       )
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'draft',$11)
       RETURNING *`,
      [
        organizationId,
        orderNumber,
        supplierName,
        input.supplierPhone?.trim().slice(0, 60) || null,
        input.supplierEmail?.trim().slice(0, 255) || null,
        materialId,
        resolvedMaterialName,
        quantityRolls,
        metersPerRoll,
        estimatedCost,
        input.notes?.trim().slice(0, 500) || null,
      ]
    );

    await client.query("COMMIT");
    return { ok: true, order: mapPurchaseOrder(rows[0]) };
  } catch (e) {
    await client.query("ROLLBACK").catch(() => {});
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Erro ao criar encomenda ao fornecedor.",
    };
  } finally {
    client.release();
  }
}

export async function markPurchaseOrderSent(
  organizationId: string,
  orderId: string,
  via: "whatsapp" | "email"
): Promise<{ ok: boolean; error?: string }> {
  try {
    assertOrganizationId(organizationId);
    assertUuid(orderId, "Encomenda");
    if (via !== "whatsapp" && via !== "email") {
      throw new Error("Canal de envio inválido.");
    }

    const { rows } = await getDb().query<Row>(
      `UPDATE purchase_orders
       SET status = CASE WHEN status = 'received' THEN 'received' ELSE 'sent' END,
           sent_via = $3,
           sent_at = NOW()
       WHERE id = $1 AND organization_id = $2
       RETURNING id`,
      [orderId, organizationId, via]
    );
    if (rows.length === 0) {
      throw new Error("Encomenda não encontrada.");
    }
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Erro ao marcar encomenda como enviada.",
    };
  }
}

export async function receivePurchaseOrder(
  organizationId: string,
  orderId: string,
  batchNumber: string,
  authorName?: string
): Promise<{ ok: boolean; error?: string }> {
  const db = getDb();
  const client = await db.connect();
  try {
    await waitForBootstrap(client);
    assertOrganizationId(organizationId);
    assertUuid(orderId, "Encomenda");

    const trimmedBatch = batchNumber?.trim().slice(0, 100);
    if (!trimmedBatch) {
      throw new Error("Indica o número de lote do(s) rolo(s) recebido(s).");
    }

    await client.query("BEGIN");

    const { rows: poRows } = await client.query<Row>(
      `SELECT * FROM purchase_orders WHERE id = $1 AND organization_id = $2 FOR UPDATE`,
      [orderId, organizationId]
    );
    if (poRows.length === 0) {
      throw new Error("Encomenda não encontrada.");
    }
    const po = poRows[0];
    if (po.status === "received") {
      throw new Error("Esta encomenda já foi recebida em stock.");
    }
    if (po.status === "cancelled") {
      throw new Error("Não é possível receber uma encomenda cancelada.");
    }

    await client.query(
      `UPDATE purchase_orders
       SET status = 'received',
           received_at = NOW()
       WHERE id = $1 AND organization_id = $2`,
      [orderId, organizationId]
    );

    const totalMeters =
      Math.round(Number(po.quantity_rolls) * Number(po.meters_per_roll) * 100) / 100;
    const materialId = po.material_id ? String(po.material_id) : null;

    if (materialId && totalMeters > 0) {
      const { rows: matRows } = await client.query<Row>(
        `SELECT id, current_stock_meters, minimum_stock_alert_meters
         FROM materials
         WHERE id = $1 AND organization_id = $2
         FOR UPDATE`,
        [materialId, organizationId]
      );
      if (matRows.length > 0) {
        const mat = matRows[0];
        const { rows: batchRows } = await client.query<Row>(
          `INSERT INTO material_batches (
             organization_id, material_id, batch_number, supplier_name,
             received_date, initial_meters, remaining_meters
           )
           VALUES ($1,$2,$3,$4,CURRENT_DATE,$5,$5)
           RETURNING id`,
          [
            organizationId,
            materialId,
            trimmedBatch,
            String(po.supplier_name),
            totalMeters,
          ]
        );
        const batchId = String(batchRows[0].id);

        const newStock =
          Math.round((Number(mat.current_stock_meters) + totalMeters) * 100) / 100;
        const newStatus = resolveStockStatus(
          newStock,
          Number(mat.minimum_stock_alert_meters)
        );

        await client.query(
          `UPDATE materials
           SET current_stock_meters = $3,
               status = $4,
               supplier_name = COALESCE(supplier_name, $5),
               updated_at = NOW()
           WHERE id = $1 AND organization_id = $2`,
          [
            materialId,
            organizationId,
            newStock,
            newStatus,
            String(po.supplier_name),
          ]
        );

        const author = authorName?.trim().slice(0, 150) || "Equipa X-Motion";
        await client.query(
          `INSERT INTO material_movements (
             organization_id, material_id, batch_id, movement_type, meters, notes, author_name
           )
           VALUES ($1,$2,$3,'entry',$4,$5,$6)`,
          [
            organizationId,
            materialId,
            batchId,
            totalMeters,
            `Receção da encomenda ${String(po.order_number)} · Lote ${trimmedBatch}`,
            author,
          ]
        );
      }
    }

    await client.query("COMMIT");
    return { ok: true };
  } catch (e) {
    await client.query("ROLLBACK").catch(() => {});
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Erro ao receber encomenda em stock.",
    };
  } finally {
    client.release();
  }
}
