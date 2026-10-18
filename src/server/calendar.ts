import { getDb } from "@/lib/db";
import type { PoolClient } from "pg";
import { Appointment, AppointmentStatus, WorkshopBay } from "@/domains/calendar/types";
import {
  addCivilDays,
  civilDateFromKey,
  civilDateKey,
  workshopDateKey,
  workshopIsoFromWallTime,
  workshopTime,
} from "@/domains/calendar/datetime";

type Row = Record<string, unknown>;
type Queryable = Pick<PoolClient, "query">;

const APPOINTMENT_STATUSES: readonly AppointmentStatus[] = [
  "scheduled",
  "confirmed",
  "in_progress",
  "completed",
  "cancelled",
  "no_show",
];

/**
 * Serializa as escritas de calendário por organização. O lock é transacional:
 * o check de conflitos e a escrita acontecem sob o mesmo lock, evitando
 * double-booking quando dois utilizadores gravam ao mesmo tempo.
 */
async function withCalendarLock<T>(
  organizationId: string,
  task: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await getDb().connect();
  try {
    await client.query("BEGIN");
    await client.query("SELECT set_config('app.current_organization_id', $1, true)", [
      organizationId,
    ]);
    await client.query("SELECT pg_advisory_xact_lock(hashtext($1))", [organizationId]);
    const result = await task(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    throw error;
  } finally {
    client.release();
  }
}

function iso(value: unknown): string {
  return value instanceof Date ? value.toISOString() : String(value);
}

export async function listBays(organizationId: string): Promise<WorkshopBay[]> {
  const { rows } = await getDb().query<Row>(
    `SELECT b.*, p.name AS technician_name
     FROM bays b LEFT JOIN profiles p ON p.id = b.default_technician_id
     WHERE b.organization_id = $1 ORDER BY b.code`,
    [organizationId]
  );
  return rows.map((r) => ({
    id: String(r.id),
    organizationId: String(r.organization_id),
    name: String(r.name),
    code: String(r.code),
    serviceType: r.service_type as WorkshopBay["serviceType"],
    defaultTechnicianId: r.default_technician_id ? String(r.default_technician_id) : undefined,
    defaultTechnicianName: (r.technician_name as string) ?? "Sem técnico",
    status: (r.status as WorkshopBay["status"]) ?? "available",
  }));
}

export interface TechnicianOption {
  id: string;
  name: string;
}

export async function listTechnicians(organizationId: string): Promise<TechnicianOption[]> {
  const { rows } = await getDb().query<Row>(
    `SELECT p.id, p.name FROM profiles p
     JOIN organization_memberships m ON m.profile_id = p.id
     WHERE m.organization_id = $1 AND m.status = 'active'
       AND m.role IN ('admin', 'workshop_manager', 'technician')
     ORDER BY p.name`,
    [organizationId]
  );
  return rows.map((r) => ({ id: String(r.id), name: String(r.name) }));
}

function mapAppointment(r: Row): Appointment {
  const start = new Date(r.start_time as string);
  const end = new Date(r.end_time as string);
  return {
    id: String(r.id),
    organizationId: String(r.organization_id),
    quoteId: r.quote_id ? String(r.quote_id) : undefined,
    quoteNumber: (r.quote_number as string) ?? undefined,
    vehicleId: String(r.vehicle_id),
    vehiclePlate: String(r.plate_display ?? ""),
    vehicleModel: String(r.vehicle_model ?? ""),
    customerId: String(r.customer_id),
    customerName: String(r.customer_name ?? ""),
    bayId: String(r.bay_id),
    bayName: String(r.bay_name ?? ""),
    technicianId: r.technician_id ? String(r.technician_id) : undefined,
    technicianName: (r.technician_name as string) ?? "Sem técnico",
    serviceTitle: (r.notes as string) || "Serviço agendado",
    startTime: workshopTime(start),
    endTime: workshopTime(end),
    date: workshopDateKey(start),
    startIso: start.toISOString(),
    endIso: end.toISOString(),
    estimatedHours: Number(r.estimated_hours ?? 0),
    status: r.status as AppointmentStatus,
    notes: (r.notes as string) ?? undefined,
  };
}

const APPOINTMENT_SELECT = `
  SELECT a.*, v.plate_display, v.make || ' ' || v.model AS vehicle_model,
         c.name AS customer_name, b.name AS bay_name, p.name AS technician_name,
         q.quote_number
  FROM appointments a
  JOIN vehicles v ON v.id = a.vehicle_id
  JOIN customers c ON c.id = a.customer_id
  JOIN bays b ON b.id = a.bay_id
  LEFT JOIN profiles p ON p.id = a.technician_id
  LEFT JOIN quotes q ON q.id = a.quote_id`;

export async function listAppointmentsBetween(
  organizationId: string,
  start: Date,
  end: Date
): Promise<Appointment[]> {
  const { rows } = await getDb().query<Row>(
    `${APPOINTMENT_SELECT}
     WHERE a.organization_id = $1 AND a.start_time >= $2 AND a.start_time < $3
     ORDER BY a.start_time`,
    [organizationId, iso(start), iso(end)]
  );
  return rows.map(mapAppointment);
}

export async function listAppointmentsForWeek(
  organizationId: string,
  reference = new Date()
): Promise<Appointment[]> {
  const ref = new Date(reference);
  const day = ref.getUTCDay();
  const monday = new Date(ref);
  monday.setUTCDate(ref.getUTCDate() - ((day + 6) % 7));
  monday.setUTCHours(0, 0, 0, 0);
  return listAppointmentsBetween(organizationId, monday, new Date(monday.getTime() + 7 * 86400000));
}

export interface AppointmentInput {
  vehicleId: string;
  customerId: string;
  bayId: string;
  technicianId?: string | null;
  quoteId?: string | null;
  startTime: string; // ISO
  endTime: string; // ISO
  estimatedHours: number;
  status?: AppointmentStatus;
  notes?: string;
}

export interface ConflictInfo {
  appointmentId: string;
  label: string;
  resource: string;
}

export class AppointmentConflictError extends Error {
  readonly conflicts: ConflictInfo[];

  constructor(conflicts: ConflictInfo[]) {
    super("CONFLICT");
    this.name = "AppointmentConflictError";
    this.conflicts = conflicts;
  }
}

async function queryAppointmentConflicts(
  db: Queryable,
  organizationId: string,
  input: AppointmentInput,
  excludeAppointmentId?: string
): Promise<ConflictInfo[]> {
  const { rows } = await db.query<Row>(
    `SELECT a.id, a.start_time, a.end_time, b.name AS bay_name,
            v.plate_display, c.name AS customer_name, p.name AS technician_name
     FROM appointments a
     JOIN vehicles v ON v.id = a.vehicle_id
     JOIN customers c ON c.id = a.customer_id
     JOIN bays b ON b.id = a.bay_id
     LEFT JOIN profiles p ON p.id = a.technician_id
     WHERE a.organization_id = $1 AND a.status <> 'cancelled'
       AND a.start_time < $3 AND a.end_time > $2
       AND (a.bay_id = $4 OR a.technician_id = $5 OR a.vehicle_id = $6)
       AND ($7::uuid IS NULL OR a.id <> $7::uuid)`,
    [
      organizationId,
      input.startTime,
      input.endTime,
      input.bayId,
      input.technicianId ?? null,
      input.vehicleId,
      excludeAppointmentId ?? null,
    ]
  );

  return rows.map((r) => ({
    appointmentId: String(r.id),
    label: `${r.plate_display ?? ""} — ${r.customer_name ?? ""}`.trim(),
    resource: `Baia ${r.bay_name ?? ""}${r.technician_name ? ` · ${r.technician_name}` : ""}`,
  }));
}

export function getAppointmentConflicts(
  organizationId: string,
  input: AppointmentInput,
  excludeAppointmentId?: string
): Promise<ConflictInfo[]> {
  return queryAppointmentConflicts(
    getDb(),
    organizationId,
    input,
    excludeAppointmentId
  );
}

function assertValidAppointmentInput(input: AppointmentInput): void {
  const start = new Date(input.startTime);
  const end = new Date(input.endTime);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    throw new Error("Data ou hora inválida.");
  }
  if (end.getTime() <= start.getTime()) {
    throw new Error("A hora de fim tem de ser depois da hora de início.");
  }
  if (!Number.isFinite(input.estimatedHours) || input.estimatedHours <= 0) {
    throw new Error("A duração tem de ser superior a zero.");
  }
  if (input.estimatedHours > 24 * 7) {
    throw new Error("A duração não pode exceder 7 dias.");
  }
  if (input.status && !APPOINTMENT_STATUSES.includes(input.status)) {
    throw new Error("Estado da marcação inválido.");
  }
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function assertUuid(value: string, label: string): void {
  if (!UUID_PATTERN.test(value)) throw new Error(`${label} inválido.`);
}

async function assertResourcesBelongToOrganization(
  db: Queryable,
  organizationId: string,
  input: AppointmentInput,
  existingCustomerId?: string | null
): Promise<void> {
  assertUuid(organizationId, "Organização");
  assertUuid(input.vehicleId, "Viatura");
  assertUuid(input.customerId, "Cliente");
  assertUuid(input.bayId, "Baia");
  if (input.technicianId) assertUuid(input.technicianId, "Técnico");
  if (input.quoteId) assertUuid(input.quoteId, "Orçamento");

  const { rows } = await db.query<Row>(
    `SELECT
       EXISTS (SELECT 1 FROM vehicles WHERE id = $2 AND organization_id = $1) AS vehicle_ok,
       EXISTS (SELECT 1 FROM customers WHERE id = $3 AND organization_id = $1) AS customer_ok,
       EXISTS (SELECT 1 FROM bays WHERE id = $4 AND organization_id = $1) AS bay_ok,
       EXISTS (
         SELECT 1 FROM vehicle_customer_links l
         WHERE l.organization_id = $1 AND l.vehicle_id = $2 AND l.customer_id = $3
           AND (l.is_current OR l.customer_id = $7::uuid)
       ) AS link_ok,
       ($5::uuid IS NULL OR EXISTS (
         SELECT 1 FROM profiles p
         JOIN organization_memberships m ON m.profile_id = p.id
         WHERE p.id = $5 AND m.organization_id = $1 AND m.status = 'active'
           AND m.role IN ('admin', 'workshop_manager', 'technician')
       )) AS technician_ok,
       ($6::uuid IS NULL OR EXISTS (
         SELECT 1 FROM quotes WHERE id = $6 AND organization_id = $1
       )) AS quote_ok`,
    [
      organizationId,
      input.vehicleId,
      input.customerId,
      input.bayId,
      input.technicianId ?? null,
      input.quoteId ?? null,
      existingCustomerId ?? null,
    ]
  );

  const row = rows[0];
  if (!row?.vehicle_ok || !row?.customer_ok || !row?.bay_ok) {
    throw new Error("Viatura, cliente ou baia inválidos para esta organização.");
  }
  if (!row.link_ok) {
    throw new Error("O cliente selecionado não está associado a esta viatura.");
  }
  if (!row.technician_ok) {
    throw new Error("O técnico selecionado não pertence à equipa.");
  }
  if (!row.quote_ok) {
    throw new Error("O orçamento selecionado não pertence a esta organização.");
  }
}

async function selectAppointment(db: Queryable, appointmentId: string): Promise<Appointment> {
  const { rows } = await db.query<Row>(`${APPOINTMENT_SELECT} WHERE a.id = $1`, [
    appointmentId,
  ]);
  if (!rows[0]) throw new Error("Marcação não encontrada.");
  return mapAppointment(rows[0]);
}

export interface AppointmentWriteOptions {
  checkConflicts?: boolean;
}

export async function createAppointment(
  organizationId: string,
  input: AppointmentInput,
  options: AppointmentWriteOptions = {}
): Promise<Appointment> {
  return withCalendarLock(organizationId, async (client) => {
    assertValidAppointmentInput(input);
    await assertResourcesBelongToOrganization(client, organizationId, input);
    if (options.checkConflicts !== false) {
      const conflicts = await queryAppointmentConflicts(client, organizationId, input);
      if (conflicts.length > 0) throw new AppointmentConflictError(conflicts);
    }
    const { rows } = await client.query<Row>(
      `INSERT INTO appointments
        (organization_id, quote_id, vehicle_id, customer_id, bay_id, technician_id,
         start_time, end_time, estimated_hours, status, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING id`,
      [
        organizationId,
        input.quoteId ?? null,
        input.vehicleId,
        input.customerId,
        input.bayId,
        input.technicianId ?? null,
        input.startTime,
        input.endTime,
        input.estimatedHours,
        input.status ?? "scheduled",
        input.notes ?? null,
      ]
    );
    return selectAppointment(client, String(rows[0].id));
  });
}

export async function updateAppointment(
  organizationId: string,
  appointmentId: string,
  input: AppointmentInput,
  options: AppointmentWriteOptions = {}
): Promise<Appointment> {
  assertUuid(appointmentId, "Marcação");
  return withCalendarLock(organizationId, async (client) => {
    assertValidAppointmentInput(input);
    const { rows: existingRows } = await client.query<Row>(
      `SELECT customer_id FROM appointments WHERE id = $1 AND organization_id = $2`,
      [appointmentId, organizationId]
    );
    if (!existingRows[0]) throw new Error("Marcação não encontrada.");
    await assertResourcesBelongToOrganization(
      client,
      organizationId,
      input,
      String(existingRows[0].customer_id)
    );
    if (options.checkConflicts !== false) {
      const conflicts = await queryAppointmentConflicts(
        client,
        organizationId,
        input,
        appointmentId
      );
      if (conflicts.length > 0) throw new AppointmentConflictError(conflicts);
    }
    const { rows } = await client.query<Row>(
      `UPDATE appointments SET
         vehicle_id = $3, customer_id = $4, bay_id = $5, technician_id = $6,
         quote_id = $7, start_time = $8, end_time = $9, estimated_hours = $10,
         status = $11, notes = $12, updated_at = NOW()
       WHERE id = $1 AND organization_id = $2 RETURNING id`,
      [
        appointmentId,
        organizationId,
        input.vehicleId,
        input.customerId,
        input.bayId,
        input.technicianId ?? null,
        input.quoteId ?? null,
        input.startTime,
        input.endTime,
        input.estimatedHours,
        input.status ?? "scheduled",
        input.notes ?? null,
      ]
    );
    if (rows.length === 0) throw new Error("Marcação não encontrada.");
    return selectAppointment(client, appointmentId);
  });
}

export async function moveAppointment(
  organizationId: string,
  appointmentId: string,
  newStart: Date,
  newEnd: Date,
  bayId?: string
): Promise<Appointment> {
  const durationMs = newEnd.getTime() - newStart.getTime();
  if (Number.isNaN(durationMs)) {
    throw new Error("Data ou hora inválida.");
  }
  if (durationMs <= 0) {
    throw new Error("A hora de fim tem de ser depois da hora de início.");
  }
  if (durationMs > 24 * 7 * 3600000) {
    throw new Error("A duração não pode exceder 7 dias.");
  }
  assertUuid(organizationId, "Organização");
  assertUuid(appointmentId, "Marcação");
  if (bayId) assertUuid(bayId, "Baia");

  return withCalendarLock(organizationId, async (client) => {
    const { rows } = await client.query<Row>(
      `SELECT vehicle_id, customer_id, technician_id, bay_id, estimated_hours
       FROM appointments WHERE id = $1 AND organization_id = $2`,
      [appointmentId, organizationId]
    );
    const current = rows[0];
    if (!current) throw new Error("Marcação não encontrada.");

    const targetBayId = bayId ?? String(current.bay_id);
    if (bayId) {
      const { rows: bayRows } = await client.query<Row>(
        `SELECT 1 FROM bays WHERE id = $1 AND organization_id = $2`,
        [bayId, organizationId]
      );
      if (bayRows.length === 0) throw new Error("Baia inválida para esta organização.");
    }

    const conflicts = await queryAppointmentConflicts(
      client,
      organizationId,
      {
        vehicleId: String(current.vehicle_id),
        customerId: String(current.customer_id),
        bayId: targetBayId,
        technicianId: current.technician_id ? String(current.technician_id) : null,
        quoteId: null,
        startTime: iso(newStart),
        endTime: iso(newEnd),
        estimatedHours: Number(current.estimated_hours ?? 0),
      },
      appointmentId
    );
    if (conflicts.length > 0) throw new AppointmentConflictError(conflicts);

    const { rows: updated } = await client.query<Row>(
      `UPDATE appointments SET
         start_time = $3, end_time = $4,
         bay_id = COALESCE($5, bay_id), updated_at = NOW()
       WHERE id = $1 AND organization_id = $2 RETURNING id`,
      [appointmentId, organizationId, iso(newStart), iso(newEnd), bayId ?? null]
    );
    if (updated.length === 0) throw new Error("Marcação não encontrada.");
    return selectAppointment(client, appointmentId);
  });
}

export async function cancelAppointment(
  organizationId: string,
  appointmentId: string
): Promise<void> {
  assertUuid(organizationId, "Organização");
  assertUuid(appointmentId, "Marcação");
  const { rows } = await getDb().query<Row>(
    `UPDATE appointments SET status = 'cancelled', updated_at = NOW()
     WHERE id = $1 AND organization_id = $2 RETURNING id`,
    [appointmentId, organizationId]
  );
  if (rows.length === 0) throw new Error("Marcação não encontrada.");
}

// ── Gestão de baías ─────────────────────────────────────────────────────────

export interface BayInput {
  name: string;
  code: string;
  serviceType: WorkshopBay["serviceType"];
  technicianId?: string | null;
}

async function assertTechnicianBelongsToOrganization(
  db: Queryable,
  organizationId: string,
  technicianId: string
): Promise<void> {
  assertUuid(technicianId, "Técnico");
  const { rows } = await db.query<Row>(
    `SELECT 1 FROM profiles p
     JOIN organization_memberships m ON m.profile_id = p.id
     WHERE p.id = $1 AND m.organization_id = $2 AND m.status = 'active'
       AND m.role IN ('admin', 'workshop_manager', 'technician')`,
    [technicianId, organizationId]
  );
  if (rows.length === 0) throw new Error("O técnico selecionado não pertence à equipa.");
}

export async function createBay(
  organizationId: string,
  input: BayInput
): Promise<WorkshopBay> {
  assertUuid(organizationId, "Organização");
  if (!input.name.trim()) throw new Error("O nome da baia é obrigatório.");
  if (input.technicianId) {
    await assertTechnicianBelongsToOrganization(getDb(), organizationId, input.technicianId);
  }
  const { rows } = await getDb().query<Row>(
    `INSERT INTO bays (organization_id, name, code, service_type, default_technician_id)
     VALUES ($1,$2,$3,$4,$5) RETURNING id`,
    [
      organizationId,
      input.name.trim(),
      input.code,
      input.serviceType,
      input.technicianId ?? null,
    ]
  );
  const bays = await listBays(organizationId);
  return bays.find((b) => b.id === String(rows[0].id))!;
}

export async function updateBay(
  organizationId: string,
  bayId: string,
  input: Partial<BayInput>
): Promise<void> {
  assertUuid(organizationId, "Organização");
  assertUuid(bayId, "Baia");
  if (input.name !== undefined && !input.name.trim()) {
    throw new Error("O nome da baia é obrigatório.");
  }
  if (typeof input.technicianId === "string") {
    await assertTechnicianBelongsToOrganization(getDb(), organizationId, input.technicianId);
  }
  const { rows } = await getDb().query<Row>(
    `UPDATE bays SET
       name = COALESCE($3, name),
       service_type = COALESCE($4, service_type),
       default_technician_id = CASE
         WHEN $5::boolean THEN NULL
         ELSE COALESCE($6::uuid, default_technician_id)
       END
     WHERE id = $1 AND organization_id = $2 RETURNING id`,
    [
      bayId,
      organizationId,
      input.name?.trim() ?? null,
      input.serviceType ?? null,
      input.technicianId === null,
      input.technicianId ?? null,
    ]
  );
  if (rows.length === 0) throw new Error("Baia não encontrada.");
}

export async function deleteBay(organizationId: string, bayId: string): Promise<{ ok: boolean; error?: string }> {
  assertUuid(organizationId, "Organização");
  assertUuid(bayId, "Baia");
  const deleted = await getDb().query<Row>(
    `DELETE FROM bays b
     WHERE b.id = $1 AND b.organization_id = $2
       AND NOT EXISTS (
         SELECT 1 FROM appointments a WHERE a.bay_id = b.id AND a.organization_id = $2
       )
     RETURNING b.id`,
    [bayId, organizationId]
  );
  if (deleted.rows.length > 0) return { ok: true };

  const { rows } = await getDb().query<Row>(
    `SELECT
       EXISTS (SELECT 1 FROM bays WHERE id = $1 AND organization_id = $2) AS bay_ok,
       EXISTS (SELECT 1 FROM appointments WHERE bay_id = $1 AND organization_id = $2) AS has_appointments`,
    [bayId, organizationId]
  );
  if (!rows[0]?.bay_ok) return { ok: false, error: "Baia não encontrada." };
  if (rows[0]?.has_appointments) {
    return {
      ok: false,
      error:
        "Esta baia tem marcações associadas (incluindo histórico). Para preservar o histórico, cria uma nova baia em vez de eliminar.",
    };
  }
  return { ok: false, error: "Não foi possível eliminar a baia." };
}

// ── Atribuir viatura a baia (mapa da oficina) ───────────────────────────────

export async function assignVehicleToBay(
  organizationId: string,
  vehicleId: string,
  bayId: string,
  date: string
): Promise<{ ok: boolean; error?: string }> {
  const dayStart = workshopIsoFromWallTime(date, "00:00");
  const nextDayKey = civilDateKey(addCivilDays(civilDateFromKey(date), 1));
  const dayEnd = workshopIsoFromWallTime(nextDayKey, "00:00");
  const slotStart = workshopIsoFromWallTime(date, "09:00");
  const slotEnd = workshopIsoFromWallTime(date, "13:00");
  if (!dayStart || !dayEnd || !slotStart || !slotEnd) {
    return { ok: false, error: "Data inválida." };
  }

  return withCalendarLock(organizationId, async (client) => {
    const { rows: bayRows } = await client.query<Row>(
      `SELECT id FROM bays WHERE id = $1 AND organization_id = $2`,
      [bayId, organizationId]
    );
    if (bayRows.length === 0) return { ok: false, error: "Baia não encontrada." };

    const { rows: ownerRows } = await client.query<Row>(
      `SELECT c.id AS customer_id FROM vehicle_customer_links l
       JOIN customers c ON c.id = l.customer_id
       JOIN vehicles v ON v.id = l.vehicle_id
       WHERE l.vehicle_id = $1 AND v.organization_id = $2 AND l.is_current LIMIT 1`,
      [vehicleId, organizationId]
    );
    const customerId = ownerRows[0] ? String(ownerRows[0].customer_id) : null;
    if (!customerId) return { ok: false, error: "A viatura não tem proprietário associado." };

    const { rows: existing } = await client.query<Row>(
      `SELECT id, technician_id, start_time, end_time, estimated_hours FROM appointments
       WHERE vehicle_id = $1 AND organization_id = $2
         AND start_time < $4 AND end_time > $3 AND status <> 'cancelled'
       LIMIT 1`,
      [vehicleId, organizationId, dayStart, dayEnd]
    );

    if (existing.length > 0) {
      const current = existing[0];
      const conflicts = await queryAppointmentConflicts(
        client,
        organizationId,
        {
          vehicleId,
          customerId,
          bayId,
          technicianId: current.technician_id ? String(current.technician_id) : null,
          quoteId: null,
          startTime: iso(current.start_time),
          endTime: iso(current.end_time),
          estimatedHours: Number(current.estimated_hours ?? 0),
        },
        String(current.id)
      );
      if (conflicts.length > 0) {
        return { ok: false, error: "A baia já tem outra marcação nesse horário." };
      }
      await client.query(
        `UPDATE appointments SET bay_id = $3, updated_at = NOW() WHERE id = $1 AND organization_id = $2`,
        [String(current.id), organizationId, bayId]
      );
      return { ok: true };
    }

    const conflicts = await queryAppointmentConflicts(client, organizationId, {
      vehicleId,
      customerId,
      bayId,
      technicianId: null,
      quoteId: null,
      startTime: slotStart,
      endTime: slotEnd,
      estimatedHours: 4,
    });
    if (conflicts.length > 0) {
      return { ok: false, error: "A baia já tem outra marcação entre as 09:00 e as 13:00." };
    }

    await client.query(
      `INSERT INTO appointments
        (organization_id, vehicle_id, customer_id, bay_id, start_time, end_time, estimated_hours, status, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,'scheduled','Atribuída via mapa da oficina')`,
      [organizationId, vehicleId, customerId, bayId, slotStart, slotEnd, 4]
    );
    return { ok: true };
  });
}


