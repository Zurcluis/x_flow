import { getDb } from "@/lib/db";
import {
  ColorFamily,
  BodyType,
  Vehicle,
  VehicleTimelineEvent,
  VehicleCustomerLink,
} from "@/domains/vehicles/types";

type Row = Record<string, unknown>;

function iso(value: unknown): string {
  return value instanceof Date ? value.toISOString() : String(value);
}

function mapVehicle(row: Row, owner?: Row): Vehicle {
  return {
    id: String(row.id),
    organizationId: String(row.organization_id),
    plateDisplay: String(row.plate_display),
    plateNormalized: String(row.plate_normalized),
    vin: (row.vin as string) ?? undefined,
    make: String(row.make),
    model: String(row.model),
    generationYear: Number(row.generation_year),
    bodyType: row.body_type as BodyType,
    originalColorName: String(row.original_color_name),
    originalColorFamily: row.original_color_family as ColorFamily,
    originalColorCode: (row.original_color_code as string) ?? undefined,
    currentMileage: row.current_mileage ? Number(row.current_mileage) : undefined,
    fuelType: (row.fuel_type as Vehicle["fuelType"]) ?? undefined,
    notes: (row.notes as string) ?? undefined,
    photoUrl: (row.photo_url as string) ?? undefined,
    createdAt: iso(row.created_at),
    updatedAt: iso(row.updated_at),
    currentOwner: owner
      ? {
          customerId: String(owner.customer_id),
          customerName: String(owner.customer_name),
          customerType: owner.customer_type as "individual" | "business",
          since: iso(owner.started_at).slice(0, 10),
        }
      : undefined,
  };
}

const OWNER_JOIN = `
  LEFT JOIN LATERAL (
    SELECT c.id AS customer_id, c.name AS customer_name, c.type AS customer_type, l.started_at
    FROM vehicle_customer_links l JOIN customers c ON c.id = l.customer_id
    WHERE l.vehicle_id = v.id AND l.is_current
    LIMIT 1
  ) own ON TRUE`;

export async function listVehicles(organizationId: string): Promise<Vehicle[]> {
  const { rows } = await getDb().query<Row>(
    `SELECT v.*, own.customer_id, own.customer_name, own.customer_type, own.started_at
     FROM vehicles v ${OWNER_JOIN}
     WHERE v.organization_id = $1
     ORDER BY v.created_at DESC`,
    [organizationId]
  );
  return rows.map((r) => mapVehicle(r, r));
}

export async function getVehicleById(
  organizationId: string,
  vehicleId: string
): Promise<Vehicle | null> {
  const { rows } = await getDb().query<Row>(
    `SELECT v.*, own.customer_id, own.customer_name, own.customer_type, own.started_at
     FROM vehicles v ${OWNER_JOIN}
     WHERE v.organization_id = $1 AND v.id = $2`,
    [organizationId, vehicleId]
  );
  if (rows.length === 0) return null;
  return mapVehicle(rows[0], rows[0]);
}

export async function getVehiclePassport(
  organizationId: string,
  vehicleId: string
): Promise<Vehicle | null> {
  const db = getDb();
  const vehicle = await getVehicleById(organizationId, vehicleId);
  if (!vehicle) return null;

  const { rows: links } = await db.query<Row>(
    `SELECT l.id, l.vehicle_id, l.customer_id, c.name AS customer_name,
            l.relationship_type, l.started_at, l.ended_at, l.is_current
     FROM vehicle_customer_links l JOIN customers c ON c.id = l.customer_id
     WHERE l.vehicle_id = $1 ORDER BY l.started_at DESC`,
    [vehicleId]
  );
  vehicle.ownerHistory = links.map<VehicleCustomerLink>((r) => ({
    id: String(r.id),
    vehicleId: String(r.vehicle_id),
    customerId: String(r.customer_id),
    customerName: String(r.customer_name),
    relationshipType: r.relationship_type as VehicleCustomerLink["relationshipType"],
    startedAt: iso(r.started_at).slice(0, 10),
    endedAt: r.ended_at ? iso(r.ended_at).slice(0, 10) : undefined,
    isCurrent: Boolean(r.is_current),
  }));

  const events: VehicleTimelineEvent[] = [];

  const { rows: quoteRows } = await db.query<Row>(
    `SELECT q.id, q.quote_number, q.status, q.created_at,
            o.name AS option_name, o.total_with_vat
     FROM quotes q LEFT JOIN quote_options o ON o.quote_id = q.id AND o.is_recommended
     WHERE q.vehicle_id = $1 ORDER BY q.created_at DESC`,
    [vehicleId]
  );
  for (const r of quoteRows) {
    events.push({
      id: `q-${r.id}`,
      vehicleId,
      type: "quote",
      title: `Orçamento ${r.quote_number}`,
      description: `${r.option_name ?? "Orçamento"} — ${r.status === "approved" ? "aprovado" : r.status} · ${Number(r.total_with_vat ?? 0).toFixed(2)} €`,
      date: iso(r.created_at),
      badgeText: String(r.status),
      linkHref: `/quotes/${r.id}`,
    });
  }

  const { rows: woRows } = await db.query<Row>(
    `SELECT w.id, w.work_order_number, w.service_title, w.status, w.completed_at, w.created_at,
            qc.status AS qc_status, qc.certificate_number
     FROM work_orders w
     LEFT JOIN qc_inspections qc ON qc.work_order_id = w.id
     WHERE w.vehicle_id = $1 ORDER BY w.created_at DESC`,
    [vehicleId]
  );
  for (const r of woRows) {
    events.push({
      id: `wo-${r.id}`,
      vehicleId,
      type: "work_order",
      title: `Ordem ${r.work_order_number} — ${r.service_title}`,
      description: `Estado: ${r.status}`,
      date: iso(r.created_at),
      badgeText: String(r.status),
      linkHref: `/production/${r.id}`,
    });
    if (r.qc_status === "passed") {
      events.push({
        id: `qc-${r.id}`,
        vehicleId,
        type: "qc_passed",
        title: "Controlo de Qualidade aprovado",
        description: `Certificado ${r.certificate_number ?? ""}`.trim(),
        date: iso(r.completed_at ?? r.created_at),
        badgeText: "QC",
      });
    }
    if (r.status === "completed") {
      events.push({
        id: `done-${r.id}`,
        vehicleId,
        type: "service_completed",
        title: `Serviço concluído — ${r.service_title}`,
        description: "Trabalho finalizado e pronto para entrega.",
        date: iso(r.completed_at ?? r.created_at),
        badgeText: "Concluído",
      });
    }
  }

  const { rows: checkinRows } = await db.query<Row>(
    `SELECT id, type, mileage, status, created_at FROM checkins WHERE vehicle_id = $1 ORDER BY created_at DESC`,
    [vehicleId]
  );
  for (const r of checkinRows) {
    events.push({
      id: `ck-${r.id}`,
      vehicleId,
      type: "checkin",
      title: r.type === "entry" ? "Check-in de entrada" : "Check-in de saída",
      description: `${Number(r.mileage).toLocaleString("pt-PT")} km — ${r.status}`,
      date: iso(r.created_at),
      badgeText: r.type === "entry" ? "Entrada" : "Saída",
      linkHref: `/checkins/${r.id}`,
    });
  }

  const { rows: warrantyRows } = await db.query<Row>(
    `SELECT id, certificate_number, material_name, warranty_years, starts_at FROM warranties WHERE vehicle_id = $1`,
    [vehicleId]
  );
  for (const r of warrantyRows) {
    events.push({
      id: `wty-${r.id}`,
      vehicleId,
      type: "warranty_issued",
      title: `Garantia ${r.warranty_years} anos`,
      description: `${r.material_name} — certificado ${r.certificate_number}`,
      date: iso(r.starts_at),
      badgeText: "Garantia",
      linkHref: `/warranties/certificate/wty-2026-001`,
    });
  }

  vehicle.timeline = events.sort((a, b) => b.date.localeCompare(a.date));
  return vehicle;
}

export interface VehicleCreateInput {
  plateDisplay: string;
  plateNormalized: string;
  make: string;
  model: string;
  generationYear: number;
  bodyType: BodyType;
  originalColorName: string;
  originalColorFamily: ColorFamily;
  vin?: string;
  currentMileage?: number;
  notes?: string;
  customerId?: string;
}

export async function createVehicle(
  organizationId: string,
  input: VehicleCreateInput
): Promise<Vehicle> {
  const db = getDb();
  const client = await db.connect();
  try {
    await client.query("BEGIN");
    const { rows } = await client.query<Row>(
      `INSERT INTO vehicles
        (organization_id, plate_display, plate_normalized, vin, make, model, generation_year,
         body_type, original_color_name, original_color_family, current_mileage, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [
        organizationId,
        input.plateDisplay,
        input.plateNormalized,
        input.vin ?? null,
        input.make,
        input.model,
        input.generationYear,
        input.bodyType,
        input.originalColorName,
        input.originalColorFamily,
        input.currentMileage ?? null,
        input.notes ?? null,
      ]
    );
    const vehicleId = String(rows[0].id);
    if (input.customerId) {
      await client.query(
        `INSERT INTO vehicle_customer_links (organization_id, vehicle_id, customer_id, relationship_type, is_current)
         VALUES ($1,$2,$3,'owner',TRUE)`,
        [organizationId, vehicleId, input.customerId]
      );
    }
    await client.query("COMMIT");
    const vehicle = await getVehicleById(organizationId, vehicleId);
    if (!vehicle) throw new Error("Viatura não encontrada após criação.");
    return vehicle;
  } catch (e) {
    await client.query("ROLLBACK").catch(() => {});
    throw e;
  } finally {
    client.release();
  }
}
