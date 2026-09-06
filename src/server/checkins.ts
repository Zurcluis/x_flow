import { getDb } from "@/lib/db";
import {
  Checkin,
  CheckinBelonging,
  CheckinDamage,
  CheckinPhoto,
  DamageSeverity,
  DamageType,
  FuelLevel,
  PhotoAngle,
} from "@/domains/checkins/types";

type Row = Record<string, unknown>;

export interface CreateCheckinPhotoInput {
  id: string;
  photoUrl: string;
  angle: PhotoAngle;
  label: string;
}

export interface CreateCheckinDamageInput {
  photoId: string;
  posX: number;
  posY: number;
  type: DamageType;
  severity: DamageSeverity;
  notes?: string;
}

export interface CreateCheckinInput {
  vehicleId: string;
  customerId: string;
  mileage: number;
  fuelLevel: FuelLevel;
  cleanlinessStatus: Checkin["cleanlinessStatus"];
  belongings: CheckinBelonging[];
  photos: CreateCheckinPhotoInput[];
  damages: CreateCheckinDamageInput[];
  signedByName: string;
  signatureDataUrl?: string;
}

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

  const { rows: photoRows } = await db.query<Row>(
    `SELECT id, photo_url, angle, label, is_mandatory, created_at
     FROM checkin_photos WHERE checkin_id = $1 ORDER BY created_at`,
    [checkin.id]
  );
  const photoUrlById = new Map<string, string>();
  checkin.photos = photoRows.map((r) => {
    const id = String(r.id);
    photoUrlById.set(id, String(r.photo_url));
    return {
      id,
      photoUrl: String(r.photo_url),
      angle: r.angle as CheckinPhoto["angle"],
      label: String(r.label),
      isMandatory: Boolean(r.is_mandatory),
      createdAt: iso(r.created_at),
    } satisfies CheckinPhoto;
  });

  const { rows: damageRows } = await db.query<Row>(
    `SELECT * FROM checkin_damages WHERE checkin_id = $1`,
    [checkin.id]
  );
  checkin.damages = damageRows.map((r) => {
    const photoId = r.photo_id ? String(r.photo_id) : undefined;
    return {
      id: String(r.id),
      posX: num(r.pos_x),
      posY: num(r.pos_y),
      bodyPart: String(r.body_part),
      type: r.damage_type as CheckinDamage["type"],
      severity: r.severity as CheckinDamage["severity"],
      notes: (r.notes as string) ?? "",
      photoId,
      photoUrl: photoId ? photoUrlById.get(photoId) : undefined,
    } satisfies CheckinDamage;
  });

  return checkin;
}

export async function createCheckin(
  organizationId: string,
  input: CreateCheckinInput
): Promise<Checkin> {
  const db = getDb();
  const client = await db.connect();
  try {
    await client.query("BEGIN");

    const hasRoofPhoto = input.photos.some((p) => p.angle === "roof");
    const token = `ck_${crypto.randomUUID().replace(/-/g, "").slice(0, 24)}`;

    const { rows: checkinRows } = await client.query<Row>(
      `INSERT INTO checkins
        (organization_id, vehicle_id, customer_id, type, mileage, fuel_level,
         has_roof_photo, cleanliness_status, status, signed_by_name,
         signature_data_url, token, completed_at, belongings)
       VALUES ($1,$2,$3,'entry',$4,$5,$6,$7,'signed',$8,$9,$10,NOW(),$11::jsonb)
       RETURNING id`,
      [
        organizationId,
        input.vehicleId,
        input.customerId,
        input.mileage,
        input.fuelLevel,
        hasRoofPhoto,
        input.cleanlinessStatus,
        input.signedByName,
        input.signatureDataUrl ?? null,
        token,
        JSON.stringify(input.belongings),
      ]
    );
    const checkinId = String(checkinRows[0].id);

    const photoIdByKey = new Map<string, string>();
    for (const p of input.photos) {
      const { rows } = await client.query<Row>(
        `INSERT INTO checkin_photos (checkin_id, photo_url, angle, label, is_mandatory)
         VALUES ($1,$2,$3,$4,TRUE) RETURNING id`,
        [checkinId, p.photoUrl, p.angle, p.label]
      );
      photoIdByKey.set(`${p.angle}:${p.label}`, String(rows[0].id));
    }

    for (const d of input.damages) {
      const photo = input.photos.find((p) => p.id === d.photoId);
      if (!photo) continue;
      await client.query(
        `INSERT INTO checkin_damages
          (checkin_id, photo_id, pos_x, pos_y, body_part, damage_type, severity, notes)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [
          checkinId,
          photoIdByKey.get(`${photo.angle}:${photo.label}`),
          d.posX,
          d.posY,
          photo.label,
          d.type,
          d.severity,
          d.notes ?? null,
        ]
      );
    }

    await client.query("COMMIT");
    return (await getCheckinById(organizationId, checkinId))!;
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}

export async function getCheckinByToken(token: string): Promise<Checkin | null> {
  const db = getDb();
  const { rows } = await db.query<Row>(
    `SELECT id, organization_id FROM checkins WHERE token = $1 LIMIT 1`,
    [token]
  );
  if (rows.length === 0) return null;
  return getCheckinById(String(rows[0].organization_id), String(rows[0].id));
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
    belongings: Array.isArray(r.belongings) ? (r.belongings as CheckinBelonging[]) : [],
    status: (r.status as Checkin["status"]) ?? "draft",
    technicianName: (r.technician_name as string) ?? "Equipa X-Motion",
    signedByName: (r.signed_by_name as string) ?? undefined,
    signatureDataUrl: (r.signature_data_url as string) ?? undefined,
    token: String(r.token),
    createdAt: iso(r.created_at),
    completedAt: r.completed_at ? iso(r.completed_at) : undefined,
  };
}
