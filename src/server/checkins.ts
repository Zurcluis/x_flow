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
import { MANDATORY_PHOTO_ANGLES } from "@/domains/checkins/roof-validator";

type Row = Record<string, unknown>;

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const PHOTO_ANGLES = new Set<PhotoAngle>([
  "front",
  "left_side",
  "right_side",
  "rear",
  "roof",
  "odometer",
  "damage_detail",
]);
const DAMAGE_TYPES = new Set<DamageType>([
  "stone_chip",
  "scratch",
  "dent",
  "repainted",
  "swirls",
  "wear",
]);
const DAMAGE_SEVERITIES = new Set<DamageSeverity>(["minor", "moderate", "severe"]);
const FUEL_LEVELS = new Set<FuelLevel>([
  "empty",
  "quarter",
  "half",
  "three_quarters",
  "full",
]);
const CLEANLINESS_LEVELS = new Set<Checkin["cleanlinessStatus"]>([
  "clean",
  "dusty",
  "dirty",
  "needs_decontamination",
]);
const MAX_PHOTO_BYTES = 2_000_000;
const MAX_TOTAL_PHOTO_BYTES = 5_500_000;
const MAX_SIGNATURE_BYTES = 750_000;

export class CheckinValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CheckinValidationError";
  }
}

function assertUuid(value: unknown, label: string): asserts value is string {
  if (typeof value !== "string" || !UUID_RE.test(value)) {
    throw new CheckinValidationError(`${label} inválida.`);
  }
}

function assertText(value: unknown, label: string, maxLength: number): string {
  if (typeof value !== "string") {
    throw new CheckinValidationError(`${label} inválido.`);
  }
  const text = value.trim();
  if (text.length === 0 || text.length > maxLength) {
    throw new CheckinValidationError(`${label} inválido.`);
  }
  return text;
}

function assertImageDataUrl(
  value: unknown,
  label: string,
  maxBytes: number
): { value: string; bytes: number } {
  if (typeof value !== "string") {
    throw new CheckinValidationError(`${label} inválida.`);
  }
  const match = /^data:image\/(jpeg|jpg|png|webp);base64,([A-Za-z0-9+/]+={0,2})$/i.exec(
    value
  );
  if (!match) {
    throw new CheckinValidationError(`${label} inválida.`);
  }

  const mime = match[1].toLowerCase();
  const buffer = Buffer.from(match[2], "base64");
  if (buffer.length < 128) {
    throw new CheckinValidationError(`${label} inválida ou demasiado pequena.`);
  }
  if (buffer.length > maxBytes) {
    throw new CheckinValidationError(`${label} excede o tamanho máximo permitido.`);
  }

  const isPng =
    buffer.length > 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a;
  const isJpeg =
    buffer.length > 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff;
  const isWebp =
    buffer.length > 12 &&
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP";

  const validMagic =
    (mime === "png" && isPng) ||
    ((mime === "jpeg" || mime === "jpg") && isJpeg) ||
    (mime === "webp" && isWebp);
  if (!validMagic) {
    throw new CheckinValidationError(`${label} não corresponde a uma imagem válida.`);
  }

  return { value, bytes: buffer.length };
}

export function validateCreateCheckinInput(input: CreateCheckinInput): void {
  if (!input || typeof input !== "object") {
    throw new CheckinValidationError("Dados do check-in inválidos.");
  }
  assertUuid(input.vehicleId, "Viatura");
  assertUuid(input.customerId, "Cliente");

  if (
    !Number.isInteger(input.mileage) ||
    input.mileage <= 0 ||
    input.mileage > 5_000_000
  ) {
    throw new CheckinValidationError("Quilometragem inválida.");
  }
  if (!FUEL_LEVELS.has(input.fuelLevel)) {
    throw new CheckinValidationError("Nível de combustível inválido.");
  }
  if (!CLEANLINESS_LEVELS.has(input.cleanlinessStatus)) {
    throw new CheckinValidationError("Estado de limpeza inválido.");
  }

  if (!Array.isArray(input.photos) || input.photos.length > 20) {
    throw new CheckinValidationError("Fotografias inválidas.");
  }
  const photoIds = new Set<string>();
  const photoAngles = new Set<PhotoAngle>();
  let totalPhotoBytes = 0;
  for (const photo of input.photos) {
    if (!photo || typeof photo !== "object") {
      throw new CheckinValidationError("Fotografia inválida.");
    }
    const id = assertText(photo.id, "Identificador da fotografia", 100);
    if (photoIds.has(id)) {
      throw new CheckinValidationError("Fotografia duplicada.");
    }
    photo.id = id;
    photoIds.add(id);
    if (!PHOTO_ANGLES.has(photo.angle)) {
      throw new CheckinValidationError("Ângulo de fotografia inválido.");
    }
    if (photoAngles.has(photo.angle)) {
      throw new CheckinValidationError("Existe mais de uma fotografia para o mesmo ângulo.");
    }
    photoAngles.add(photo.angle);
    photo.label = assertText(photo.label, "Legenda da fotografia", 100);
    const photoImage = assertImageDataUrl(photo.photoUrl, "Fotografia", MAX_PHOTO_BYTES);
    photo.photoUrl = photoImage.value;
    totalPhotoBytes += photoImage.bytes;
    if (totalPhotoBytes > MAX_TOTAL_PHOTO_BYTES) {
      throw new CheckinValidationError("O conjunto de fotografias excede o tamanho máximo.");
    }
  }
  for (const mandatory of MANDATORY_PHOTO_ANGLES) {
    if (!photoAngles.has(mandatory.angle)) {
      throw new CheckinValidationError(
        `Falta a fotografia obrigatória: ${mandatory.label}.`
      );
    }
  }

  if (!Array.isArray(input.damages) || input.damages.length > 200) {
    throw new CheckinValidationError("Registo de danos inválido.");
  }
  for (const damage of input.damages) {
    if (!damage || typeof damage !== "object") {
      throw new CheckinValidationError("Registo de dano inválido.");
    }
    damage.photoId = assertText(
      damage.photoId,
      "Identificador da fotografia do dano",
      100
    );
    if (!photoIds.has(damage.photoId)) {
      throw new CheckinValidationError("Dano associado a uma fotografia inexistente.");
    }
    if (
      !Number.isFinite(damage.posX) ||
      !Number.isFinite(damage.posY) ||
      damage.posX < 0 ||
      damage.posX > 100 ||
      damage.posY < 0 ||
      damage.posY > 100
    ) {
      throw new CheckinValidationError("Posição do dano inválida.");
    }
    if (!DAMAGE_TYPES.has(damage.type)) {
      throw new CheckinValidationError("Tipo de dano inválido.");
    }
    if (!DAMAGE_SEVERITIES.has(damage.severity)) {
      throw new CheckinValidationError("Severidade do dano inválida.");
    }
    if (damage.notes !== undefined && typeof damage.notes !== "string") {
      throw new CheckinValidationError("Notas do dano inválidas.");
    }
    if ((damage.notes?.length ?? 0) > 500) {
      throw new CheckinValidationError("Notas do dano demasiado longas.");
    }
  }

  if (!Array.isArray(input.belongings) || input.belongings.length > 50) {
    throw new CheckinValidationError("Lista de pertences inválida.");
  }
  for (const item of input.belongings) {
    if (!item || typeof item !== "object" || typeof item.isPresent !== "boolean") {
      throw new CheckinValidationError("Pertence inválido.");
    }
    item.id = assertText(item.id, "Identificador do pertence", 100);
    item.itemName = assertText(item.itemName, "Nome do pertence", 120);
    if (item.notes !== undefined && (typeof item.notes !== "string" || item.notes.length > 300)) {
      throw new CheckinValidationError("Notas do pertence inválidas.");
    }
  }

  const signedByName = assertText(input.signedByName, "Nome do signatário", 255);
  input.signedByName = signedByName;
  if (input.signatureDataUrl !== undefined) {
    input.signatureDataUrl = assertImageDataUrl(
      input.signatureDataUrl,
      "Assinatura",
      MAX_SIGNATURE_BYTES
    ).value;
  }
}

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
  assertUuid(organizationId, "Organização");
  const { rows } = await getDb().query<Row>(
    `SELECT ch.id, ch.organization_id, ch.appointment_id, ch.quote_id, ch.vehicle_id,
            ch.customer_id, ch.type, ch.mileage, ch.fuel_level, ch.has_roof_photo,
            ch.cleanliness_status, ch.status, ch.signed_by_name, ch.token,
            ch.created_at, ch.completed_at,
            (ch.signature_data_url IS NOT NULL) AS has_signature,
            NULL::jsonb AS belongings, NULL::text AS signature_data_url,
            v.plate_display, v.make || ' ' || v.model AS vehicle_model,
            v.generation_year, v.original_color_name AS vehicle_color, c.name AS customer_name,
            c.phone AS customer_phone, p.name AS technician_name,
            (SELECT COUNT(*)::int FROM checkin_photos ph WHERE ph.checkin_id = ch.id) AS photo_count,
            (SELECT COUNT(*)::int FROM checkin_damages d WHERE d.checkin_id = ch.id) AS damage_count,
            EXISTS(
              SELECT 1 FROM checkin_photos roof
              WHERE roof.checkin_id = ch.id AND roof.angle = 'roof'
            ) AS actual_roof_photo
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
  assertUuid(organizationId, "Organização");
  if (!UUID_RE.test(checkinId)) return null;
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
  checkin.hasRoofPhoto = checkin.photos.some((photo) => photo.angle === "roof");
  checkin.photoCount = checkin.photos.length;
  checkin.damageCount = checkin.damages.length;

  return checkin;
}

export async function createCheckin(
  organizationId: string,
  input: CreateCheckinInput,
  technicianId: string
): Promise<Checkin> {
  assertUuid(organizationId, "Organização");
  assertUuid(technicianId, "Técnico");
  validateCreateCheckinInput(input);

  const db = getDb();
  const client = await db.connect();
  try {
    await client.query("BEGIN");

    const { rows: vehicleRows } = await client.query<{ id: string }>(
      `SELECT id FROM vehicles
       WHERE id = $1 AND organization_id = $2
       FOR SHARE`,
      [input.vehicleId, organizationId]
    );
    if (vehicleRows.length === 0) {
      throw new CheckinValidationError("Viatura não encontrada nesta organização.");
    }

    const { rows: customerRows } = await client.query<{ id: string }>(
      `SELECT id FROM customers
       WHERE id = $1 AND organization_id = $2
       FOR SHARE`,
      [input.customerId, organizationId]
    );
    if (customerRows.length === 0) {
      throw new CheckinValidationError("Cliente não encontrado nesta organização.");
    }

    const { rows: ownerRows } = await client.query<{ id: string }>(
      `SELECT id FROM vehicle_customer_links
       WHERE organization_id = $1
         AND vehicle_id = $2
         AND customer_id = $3
         AND is_current = TRUE
         AND ended_at IS NULL
       LIMIT 1
       FOR SHARE`,
      [organizationId, input.vehicleId, input.customerId]
    );
    if (ownerRows.length === 0) {
      throw new CheckinValidationError(
        "O cliente selecionado não é o proprietário atual desta viatura."
      );
    }

    const hasRoofPhoto = input.photos.some((p) => p.angle === "roof");
    const status = input.signatureDataUrl ? "signed" : "completed";
    const token = `ck_${crypto.randomUUID().replace(/-/g, "").slice(0, 24)}`;

    const { rows: checkinRows } = await client.query<Row>(
      `INSERT INTO checkins
        (organization_id, vehicle_id, customer_id, type, mileage, fuel_level,
         has_roof_photo, cleanliness_status, status, technician_id, signed_by_name,
         signature_data_url, token, completed_at, belongings)
       VALUES ($1,$2,$3,'entry',$4,$5,$6,$7,$8,$9,$10,$11,$12,NOW(),$13::jsonb)
       RETURNING id`,
      [
        organizationId,
        input.vehicleId,
        input.customerId,
        input.mileage,
        input.fuelLevel,
        hasRoofPhoto,
        input.cleanlinessStatus,
        status,
        technicianId,
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
      if (!photo) {
        throw new CheckinValidationError(
          "Dano associado a uma fotografia inexistente."
        );
      }
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
  if (typeof token !== "string" || token.length === 0 || token.length > 100) {
    return null;
  }
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
    hasRoofPhoto:
      r.actual_roof_photo === undefined
        ? Boolean(r.has_roof_photo)
        : Boolean(r.actual_roof_photo),
    cleanlinessStatus: (r.cleanliness_status as Checkin["cleanlinessStatus"]) ?? "clean",
    damages: [],
    photos: [],
    photoCount: r.photo_count === undefined ? undefined : num(r.photo_count),
    damageCount: r.damage_count === undefined ? undefined : num(r.damage_count),
    belongings: Array.isArray(r.belongings) ? (r.belongings as CheckinBelonging[]) : [],
    status: (r.status as Checkin["status"]) ?? "draft",
    technicianName: (r.technician_name as string) ?? "Equipa X-Motion",
    signedByName: (r.signed_by_name as string) ?? undefined,
    signatureDataUrl: (r.signature_data_url as string) ?? undefined,
    hasSignature:
      r.has_signature === undefined ? undefined : Boolean(r.has_signature),
    token: String(r.token),
    createdAt: iso(r.created_at),
    completedAt: r.completed_at ? iso(r.completed_at) : undefined,
  };
}
