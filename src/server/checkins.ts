import { getDb } from "@/lib/db";
import { Checkin } from "@/domains/checkins/types";

type Row = Record<string, unknown>;

function iso(value: unknown): string {
  return value instanceof Date ? value.toISOString() : String(value);
}

function num(value: unknown): number {
  return value === null || value === undefined ? 0 : Number(value);
}

const CHECKIN_JOINS = `
  FROM checkins ch
  JOIN vehicles v ON v.id = ch.vehicle_id
  JOIN customers c ON c.id = ch.customer_id
  LEFT JOIN profiles p ON p.id = ch.technician_id`;

export async function listCheckins(organizationId: string): Promise<Checkin[]> {
  const { rows } = await getDb().query<Row>(
    `SELECT ch.*, v.plate_display, v.make || ' ' || v.model AS vehicle_model,
            v.generation_year, v.original_color_name AS vehicle_color, c.name AS customer_name,
            c.phone AS customer_phone, p.name AS technician_name
     ${CHECKIN_JOINS}
     WHERE ch.organization_id = $1 ORDER BY ch.created_at DESC`,
    [organizationId]
  );
  return rows.map(mapCheckin);
}

export async function getCheckinById(
  organizationId: string,
  checkinId: string
): Promise<Checkin | null> {
  const db = getDb();
  const { rows } = await db.query<Row>(
    `SELECT ch.*, v.plate_display, v.make || ' ' || v.model AS vehicle_model,
            v.generation_year, v.original_color_name AS vehicle_color, c.name AS customer_name,
            c.phone AS customer_phone, p.name AS technician_name
     ${CHECKIN_JOINS}
     WHERE ch.organization_id = $1 AND ch.id = $2`,
    [organizationId, checkinId]
  );
  if (rows.length === 0) return null;
  const checkin = mapCheckin(rows[0]);

  const { rows: damageRows } = await db.query<Row>(
    `SELECT * FROM checkin_damages WHERE checkin_id = $1`,
    [checkinId]
  );
  checkin.damages = damageRows.map((r) => ({
    id: String(r.id),
    posX: num(r.pos_x),
    posY: num(r.pos_y),
    bodyPart: String(r.body_part),
    type: r.damage_type as Checkin["damages"][number]["type"],
    severity: r.severity as Checkin["damages"][number]["severity"],
    notes: (r.notes as string) ?? "",
    photoUrl: (r.photo_url as string) ?? undefined,
  }));

  return checkin;
}

export async function getCheckinByToken(token: string): Promise<Checkin | null> {
  const db = getDb();
  const { rows } = await db.query<Row>(
    `SELECT organization_id FROM checkins WHERE token = $1 LIMIT 1`,
    [token]
  );
  if (rows.length === 0) return null;
  return getCheckinById(String(rows[0].organization_id), token);
}

function mapCheckin(r: Row): Checkin {
  return {
    id: String(r.id),
    organizationId: String(r.organization_id),
    appointmentId: r.appointment_id ? String(r.appointment_id) : undefined,
    quoteId: r.quote_id ? String(r.quote_id) : undefined,
    vehicleId: String(r.vehicle_id),
    vehiclePlate: String(r.plate_display ?? ""),
    vehicleModel: String(r.vehicle_model ?? ""),
    vehicleYear: num(r.generation_year),
    vehicleColor: String(r.vehicle_color ?? ""),
    customerId: String(r.customer_id),
    customerName: String(r.customer_name ?? ""),
    customerPhone: String(r.customer_phone ?? ""),
    type: (r.type as "entry" | "exit") ?? "entry",
    mileage: num(r.mileage),
    fuelLevel: (r.fuel_level as Checkin["fuelLevel"]) ?? "half",
    hasRoofPhoto: Boolean(r.has_roof_photo),
    cleanlinessStatus: (r.cleanliness_status as Checkin["cleanlinessStatus"]) ?? "clean",
    damages: [],
    photos: [],
    belongings: [],
    status: (r.status as Checkin["status"]) ?? "draft",
    technicianName: (r.technician_name as string) ?? "Equipa X-Motion",
    signedByName: (r.signed_by_name as string) ?? undefined,
    signatureDataUrl: (r.signature_data_url as string) ?? undefined,
    token: String(r.token),
    createdAt: iso(r.created_at),
    completedAt: r.completed_at ? iso(r.completed_at) : undefined,
  };
}
