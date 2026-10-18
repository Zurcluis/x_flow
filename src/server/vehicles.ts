import { getDb } from "@/lib/db";
import { workshopDateKey } from "@/domains/calendar/datetime";
import { formatCurrency } from "@/lib/formatting";
import {
  formatPlateForDisplay,
  isValidPlate,
  normalizePlate,
} from "@/domains/vehicles/plate-normalizer";
import {
  parseGenerationYear,
  parseMileage,
  parseOptionalVin,
  VehicleValidationError,
} from "@/domains/vehicles/validation";
import {
  BodyType,
  ColorFamily,
  FuelType,
  Vehicle,
  VehicleCustomerLink,
  VehicleNote,
  VehicleTimelineEvent,
} from "@/domains/vehicles/types";

export { VehicleValidationError };

type Row = Record<string, unknown>;

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const BODY_TYPES = new Set<BodyType>([
  "sedan",
  "coupe",
  "suv",
  "wagon",
  "hatchback",
  "cabrio",
  "motorcycle",
  "van",
]);
const COLOR_FAMILIES = new Set<ColorFamily>([
  "white",
  "black",
  "grey",
  "silver",
  "blue",
  "red",
  "green",
  "yellow",
  "orange",
  "other",
]);
const FUEL_TYPES = new Set<FuelType>(["gasoline", "diesel", "electric", "hybrid"]);

const QUOTE_STATUS_LABELS: Record<string, string> = {
  draft: "Rascunho",
  sent: "Enviado",
  viewed: "Visto",
  approved: "Aprovado",
  rejected: "Rejeitado",
  expired: "Expirado",
};

const WORK_ORDER_STATUS_LABELS: Record<string, string> = {
  draft: "Rascunho",
  in_progress: "Em curso",
  waiting_parts: "A aguardar peças",
  quality_control: "Controlo de qualidade",
  completed: "Concluída",
};

const CHECKIN_STATUS_LABELS: Record<string, string> = {
  draft: "Rascunho",
  completed: "Concluído",
  signed: "Assinado",
};

function statusLabel(labels: Record<string, string>, value: unknown): string {
  const key = String(value);
  return labels[key] ?? key;
}

function assertUuid(value: string, label: string): void {
  if (!UUID_RE.test(value)) {
    throw new VehicleValidationError(`${label} inválido.`);
  }
}

function requiredText(value: unknown, label: string, maxLength: number): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new VehicleValidationError(`${label} é obrigatório.`);
  }
  const text = value.trim();
  if (text.length > maxLength) {
    throw new VehicleValidationError(`${label} excede o limite de ${maxLength} caracteres.`);
  }
  return text;
}

function optionalText(value: unknown, label: string, maxLength: number): string | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "string") {
    throw new VehicleValidationError(`${label} inválido.`);
  }
  const text = value.trim();
  if (text.length === 0) return undefined;
  if (text.length > maxLength) {
    throw new VehicleValidationError(`${label} excede o limite de ${maxLength} caracteres.`);
  }
  return text;
}

function iso(value: unknown): string {
  return value instanceof Date ? value.toISOString() : String(value);
}

function dateOnly(value: unknown): string {
  const date = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(date.getTime()) ? "" : workshopDateKey(date);
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
    currentMileage:
      row.current_mileage === null || row.current_mileage === undefined
        ? undefined
        : Number(row.current_mileage),
    fuelType: (row.fuel_type as FuelType) ?? undefined,
    notes: (row.notes as string) ?? undefined,
    photoUrl: (row.photo_url as string) ?? undefined,
    createdAt: iso(row.created_at),
    updatedAt: iso(row.updated_at),
    currentOwner:
      owner && owner.customer_id
        ? {
            customerId: String(owner.customer_id),
            customerName: String(owner.customer_name),
            customerType: owner.customer_type as "individual" | "business",
            since: dateOnly(owner.started_at),
          }
        : undefined,
  };
}

const OWNER_JOIN = `
  LEFT JOIN LATERAL (
    SELECT c.id AS customer_id, c.name AS customer_name, c.type AS customer_type, l.started_at
    FROM vehicle_customer_links l
    JOIN customers c ON c.id = l.customer_id AND c.organization_id = v.organization_id
    WHERE l.vehicle_id = v.id AND l.is_current AND l.organization_id = v.organization_id
    LIMIT 1
  ) own ON TRUE`;

export async function listVehicles(organizationId: string): Promise<Vehicle[]> {
  assertUuid(organizationId, "Organização");
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
  assertUuid(organizationId, "Organização");
  if (!UUID_RE.test(vehicleId)) return null;
  const { rows } = await getDb().query<Row>(
    `SELECT v.*, own.customer_id, own.customer_name, own.customer_type, own.started_at
     FROM vehicles v ${OWNER_JOIN}
     WHERE v.organization_id = $1 AND v.id = $2`,
    [organizationId, vehicleId]
  );
  if (rows.length === 0) return null;
  return mapVehicle(rows[0], rows[0]);
}

export async function listVehicleFrontCovers(
  organizationId: string
): Promise<Record<string, string>> {
  assertUuid(organizationId, "Organização");
  const { rows } = await getDb().query<Row>(
    `SELECT DISTINCT ON (ch.vehicle_id)
            ch.vehicle_id, p.photo_url
     FROM checkin_photos p
     JOIN checkins ch ON ch.id = p.checkin_id
     WHERE ch.organization_id = $1 AND p.angle = 'front'
     ORDER BY ch.vehicle_id, p.created_at DESC`,
    [organizationId]
  );
  const covers: Record<string, string> = {};
  for (const r of rows) covers[String(r.vehicle_id)] = String(r.photo_url);
  return covers;
}

export interface VehiclePassportOptions {
  includeFinancials?: boolean;
}

export async function getVehiclePassport(
  organizationId: string,
  vehicleId: string,
  options: VehiclePassportOptions = {}
): Promise<Vehicle | null> {
  assertUuid(organizationId, "Organização");
  const includeFinancials = options.includeFinancials === true;
  const db = getDb();
  const vehicle = await getVehicleById(organizationId, vehicleId);
  if (!vehicle) return null;

  const { rows: links } = await db.query<Row>(
    `SELECT l.id, l.vehicle_id, l.customer_id, c.name AS customer_name,
            l.relationship_type, l.started_at, l.ended_at, l.is_current
     FROM vehicle_customer_links l
     JOIN customers c ON c.id = l.customer_id AND c.organization_id = $2
     WHERE l.vehicle_id = $1 AND l.organization_id = $2
     ORDER BY l.started_at DESC`,
    [vehicleId, organizationId]
  );
  vehicle.ownerHistory = links.map<VehicleCustomerLink>((r) => ({
    id: String(r.id),
    vehicleId: String(r.vehicle_id),
    customerId: String(r.customer_id),
    customerName: String(r.customer_name),
    relationshipType: r.relationship_type as VehicleCustomerLink["relationshipType"],
    startedAt: dateOnly(r.started_at),
    endedAt: r.ended_at ? dateOnly(r.ended_at) : undefined,
    isCurrent: Boolean(r.is_current),
  }));

  const events: VehicleTimelineEvent[] = [];

  const { rows: quoteRows } = await db.query<Row>(
    `SELECT q.id, q.quote_number, q.status, q.created_at,
            o.name AS option_name, o.total_with_vat
     FROM quotes q
     LEFT JOIN LATERAL (
       SELECT qo.name, qo.total_with_vat
       FROM quote_options qo
       WHERE qo.quote_id = q.id AND qo.is_recommended
       ORDER BY qo.created_at
       LIMIT 1
     ) o ON TRUE
     WHERE q.vehicle_id = $1 AND q.organization_id = $2
     ORDER BY q.created_at DESC`,
    [vehicleId, organizationId]
  );
  for (const r of quoteRows) {
    const status = statusLabel(QUOTE_STATUS_LABELS, r.status);
    const optionName = r.option_name ? String(r.option_name) : null;
    const total = r.total_with_vat === null || r.total_with_vat === undefined
      ? null
      : Number(r.total_with_vat);
    const descriptionParts = [optionName ?? "Sem opção recomendada", `estado: ${status}`];
    if (includeFinancials && total !== null && Number.isFinite(total)) {
      descriptionParts.push(formatCurrency(total));
    }
    events.push({
      id: `q-${r.id}`,
      vehicleId,
      type: "quote",
      title: `Orçamento ${r.quote_number}`,
      description: descriptionParts.join(" · "),
      date: iso(r.created_at),
      badgeText: status,
      linkHref: `/quotes/${r.id}`,
    });
  }

  const { rows: woRows } = await db.query<Row>(
    `SELECT w.id, w.work_order_number, w.service_title, w.status, w.completed_at,
            w.created_at, qc.status AS qc_status, qc.certificate_number
     FROM work_orders w
     LEFT JOIN LATERAL (
       SELECT qi.status, qi.certificate_number
       FROM qc_inspections qi
       WHERE qi.work_order_id = w.id
       ORDER BY qi.created_at DESC
       LIMIT 1
     ) qc ON TRUE
     WHERE w.vehicle_id = $1 AND w.organization_id = $2
     ORDER BY w.created_at DESC`,
    [vehicleId, organizationId]
  );
  for (const r of woRows) {
    const status = statusLabel(WORK_ORDER_STATUS_LABELS, r.status);
    events.push({
      id: `wo-${r.id}`,
      vehicleId,
      type: "work_order",
      title: `Ordem ${r.work_order_number} — ${r.service_title}`,
      description: `Estado: ${status}`,
      date: iso(r.created_at),
      badgeText: status,
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
    `SELECT id, type, mileage, status, created_at
     FROM checkins
     WHERE vehicle_id = $1 AND organization_id = $2
     ORDER BY created_at DESC`,
    [vehicleId, organizationId]
  );
  for (const r of checkinRows) {
    const mileage =
      r.mileage === null || r.mileage === undefined ? null : Number(r.mileage);
    const mileageText =
      mileage !== null && Number.isFinite(mileage)
        ? `${mileage.toLocaleString("pt-PT")} km`
        : "Quilometragem não registada";
    const status = statusLabel(CHECKIN_STATUS_LABELS, r.status);
    events.push({
      id: `ck-${r.id}`,
      vehicleId,
      type: "checkin",
      title: r.type === "entry" ? "Check-in de entrada" : "Check-in de saída",
      description: `${mileageText} — ${status}`,
      date: iso(r.created_at),
      badgeText: r.type === "entry" ? "Entrada" : "Saída",
      linkHref: `/checkins/${r.id}`,
    });
  }

  const { rows: warrantyRows } = await db.query<Row>(
    `SELECT id, certificate_number, material_name, warranty_years, starts_at
     FROM warranties
     WHERE vehicle_id = $1 AND organization_id = $2`,
    [vehicleId, organizationId]
  );
  for (const r of warrantyRows) {
    events.push({
      id: `wty-${r.id}`,
      vehicleId,
      type: "warranty_issued",
      title: `Garantia ${r.warranty_years} anos`,
      description: `${r.material_name} — certificado ${r.certificate_number}`,
      date: dateOnly(r.starts_at),
      badgeText: "Garantia",
      linkHref: `/warranties/${r.id}`,
    });
  }

  const { rows: noteRows } = await db.query<Row>(
    `SELECT n.id, n.vehicle_id, n.category, n.content, n.created_at,
            p.name AS author_name
     FROM vehicle_notes n
     LEFT JOIN profiles p ON p.id = n.author_id
     WHERE n.vehicle_id = $1
     ORDER BY n.created_at DESC`,
    [vehicleId]
  );
  vehicle.technicalNotes = noteRows.map<VehicleNote>((r) => ({
    id: String(r.id),
    vehicleId: String(r.vehicle_id),
    authorName: (r.author_name as string) ?? "Sistema",
    category: r.category as VehicleNote["category"],
    content: String(r.content),
    createdAt: iso(r.created_at),
  }));

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
  fuelType?: FuelType;
  notes?: string;
  customerId?: string;
}

export async function createVehicle(
  organizationId: string,
  input: VehicleCreateInput
): Promise<Vehicle> {
  assertUuid(organizationId, "Organização");

  const plateDisplay = requiredText(input.plateDisplay, "A matrícula", 50);
  if (!isValidPlate(plateDisplay)) {
    throw new VehicleValidationError("A matrícula indicada não é válida.");
  }
  const plateNormalized = normalizePlate(plateDisplay);
  const displayPlate = formatPlateForDisplay(plateDisplay);
  const make = requiredText(input.make, "A marca", 100);
  const model = requiredText(input.model, "O modelo", 100);
  const generationYear = parseGenerationYear(input.generationYear);
  if (!BODY_TYPES.has(input.bodyType)) {
    throw new VehicleValidationError("Tipo de carroçaria inválido.");
  }
  const originalColorName =
    optionalText(input.originalColorName, "O nome da cor", 100) ?? "Por identificar";
  if (!COLOR_FAMILIES.has(input.originalColorFamily)) {
    throw new VehicleValidationError("Família de cor inválida.");
  }
  const vin = parseOptionalVin(input.vin);
  const currentMileage = parseMileage(input.currentMileage);
  let fuelType: FuelType | undefined;
  if (input.fuelType !== undefined && input.fuelType !== null) {
    if (!FUEL_TYPES.has(input.fuelType)) {
      throw new VehicleValidationError("Tipo de combustível inválido.");
    }
    fuelType = input.fuelType;
  }
  const notes = optionalText(input.notes, "As notas", 5000);
  const customerId = input.customerId?.trim() || undefined;
  if (customerId) assertUuid(customerId, "Cliente");

  const db = getDb();
  const client = await db.connect();
  try {
    await client.query("BEGIN");
    if (customerId) {
      const { rows: customerRows } = await client.query<{ id: string }>(
        `SELECT id FROM customers WHERE id = $1 AND organization_id = $2 FOR SHARE`,
        [customerId, organizationId]
      );
      if (customerRows.length === 0) {
        throw new VehicleValidationError("O cliente indicado não pertence a esta organização.");
      }
    }

    const { rows } = await client.query<Row>(
      `INSERT INTO vehicles
        (organization_id, plate_display, plate_normalized, vin, make, model, generation_year,
         body_type, original_color_name, original_color_family, current_mileage, fuel_type, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
      [
        organizationId,
        displayPlate,
        plateNormalized,
        vin ?? null,
        make,
        model,
        generationYear,
        input.bodyType,
        originalColorName,
        input.originalColorFamily,
        currentMileage ?? null,
        fuelType ?? null,
        notes ?? null,
      ]
    );
    const vehicleId = String(rows[0].id);
    if (customerId) {
      await client.query(
        `INSERT INTO vehicle_customer_links
          (organization_id, vehicle_id, customer_id, relationship_type, is_current)
         VALUES ($1,$2,$3,'owner',TRUE)`,
        [organizationId, vehicleId, customerId]
      );
    }
    await client.query("COMMIT");
    const vehicle = await getVehicleById(organizationId, vehicleId);
    if (!vehicle) {
      throw new VehicleValidationError("Não foi possível confirmar a viatura criada.");
    }
    return vehicle;
  } catch (e) {
    await client.query("ROLLBACK").catch(() => {});
    throw e;
  } finally {
    client.release();
  }
}
